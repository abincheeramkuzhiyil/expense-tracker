import { Page } from '@playwright/test';
import { Expense } from '../../types/expense.types';

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
