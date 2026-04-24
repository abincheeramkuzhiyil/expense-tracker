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
