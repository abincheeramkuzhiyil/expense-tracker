import { test as base, expect } from '@playwright/test';
import { clearLocalStorage, seedLocalStorage } from '../utils/storage-helper';
import { Expense } from '../../types/expense.types';

/**
 * Extended test fixtures with localStorage utilities
 */
type TestFixtures = {
  cleanLocalStorage: void;
  seedExpenses: (expenses: Expense[], categories?: string[]) => Promise<void>;
};

/**
 * Custom test fixture that extends base Playwright test
 * Provides utilities for localStorage management
 */
export const test = base.extend<TestFixtures>({
  /**
   * Fixture that clears localStorage before each test
   * Use: test.use({ cleanLocalStorage: true })
   */
  cleanLocalStorage: [async ({ page }, use) => {
    await clearLocalStorage(page);
    await use();
  }, { auto: true }], // Auto-run before each test

  /**
   * Fixture that provides a function to seed expenses into localStorage
   * Use: await seedExpenses([...expenses], [...categories])
   */
  seedExpenses: async ({ page }, use) => {
    const seed = async (expenses: Expense[], categories: string[] = []) => {
      await seedLocalStorage(page, expenses, categories);
    };
    await use(seed);
  },
});

// Re-export expect for convenience
export { expect };
