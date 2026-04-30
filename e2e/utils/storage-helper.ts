import { Page } from '@playwright/test';
import { Expense } from '../../types/expense.types';

const PENDING_STORAGE_KEY = 'expensesPending';

/**
 * Seeds localStorage with expense data in the browser context
 */
export async function seedLocalStorage(
  page: Page,
  expenses: Expense[] = [],
  categories: string[] = []
): Promise<void> {
  await page.addInitScript((data) => {
    if (data.expenses.length > 0) {
      localStorage.setItem('expenses', JSON.stringify(data.expenses));
    }
    if (data.categories.length > 0) {
      localStorage.setItem('expenseCategories', JSON.stringify(data.categories));
    }
  }, { expenses, categories });
}

/**
 * Seeds pending expenses into the dedicated pending queue key.
 * Uses the PendingStoredExpense flat-array format (no status field).
 */
export async function seedPendingExpenses(
  page: Page,
  pendingExpenses: Expense[]
): Promise<void> {
  const pendingKey = PENDING_STORAGE_KEY;
  await page.addInitScript(
    ({ key, items }: { key: string; items: Array<{ id: string; amount: number; category: string; date: string; description: string; source: string; createdAt: string; updatedAt: string }> }) => {
      localStorage.setItem(key, JSON.stringify(items));
    },
    {
      key: pendingKey,
      items: pendingExpenses.map((e) => ({
        id: e.id,
        amount: e.amount,
        category: e.category,
        date: `${e.date.getFullYear()}-${String(e.date.getMonth() + 1).padStart(2, '0')}-${String(e.date.getDate()).padStart(2, '0')}`,
        description: e.description,
        source: e.source,
        createdAt: e.createdAt.toISOString(),
        updatedAt: e.updatedAt.toISOString(),
      })),
    }
  );
}

/**
 * Clears all localStorage data in the browser context
 */
export async function clearLocalStorage(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.clear();
  });
}

/**
 * Gets localStorage data from the browser context
 */
export async function getLocalStorageItem(page: Page, key: string): Promise<any> {
  return await page.evaluate((storageKey) => {
    const item = localStorage.getItem(storageKey);
    return item ? JSON.parse(item) : null;
  }, key);
}

/**
 * Seeds approved expenses into the year/month bucket format used by expenseStorage.ts.
 * Each expense must have a date string in "YYYY-MM-DD" format.
 * Expenses are grouped by year and month automatically.
 */
export async function seedApprovedExpenses(
  page: Page,
  expenses: Array<{
    id: string;
    amount: number;
    category: string;
    date: string; // "YYYY-MM-DD"
    description: string;
    source: string;
    createdAt: string;
    updatedAt: string;
  }>
): Promise<void> {
  await page.addInitScript((items) => {
    const YEAR_INDEX_KEY = 'expenseYearIndex';
    // Group by year then month
    const yearMap: Record<string, Record<string, typeof items>> = {};
    for (const item of items) {
      const [year, month] = item.date.split('-');
      if (!yearMap[year]) yearMap[year] = {};
      if (!yearMap[year][String(Number(month))]) yearMap[year][String(Number(month))] = [];
      yearMap[year][String(Number(month))].push(item);
    }
    // Persist year index
    const years = Object.keys(yearMap).sort();
    localStorage.setItem(YEAR_INDEX_KEY, JSON.stringify(years));
    // Persist each year's data
    for (const year of years) {
      localStorage.setItem(year, JSON.stringify(yearMap[year]));
    }
  }, expenses);
}
