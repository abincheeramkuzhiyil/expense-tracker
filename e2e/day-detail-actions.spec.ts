import { test, expect } from './fixtures/base-fixture';
import { ExpensesPage } from './pages/ExpensesPage';
import { seedApprovedExpenses } from './utils/storage-helper';

/** Fixed test date to keep tests deterministic */
const TEST_DATE = '2026-04-25';
const NOW_ISO = new Date('2026-04-25T10:00:00').toISOString();

/** A single approved expense used as the baseline for all tests */
const TEST_EXPENSE = {
  id: 'e2e-test-expense-1',
  amount: 500,
  category: 'Food',
  date: TEST_DATE,
  description: 'Lunch at café',
  source: 'manual',
  createdAt: NOW_ISO,
  updatedAt: NOW_ISO,
};

test.describe('Day View — Edit & Delete Actions', () => {
  test('should delete an expense and update the total', async ({ page }) => {
    await seedApprovedExpenses(page, [TEST_EXPENSE]);

    const expensesPage = new ExpensesPage(page);
    await expensesPage.navigate({ view: 'day', date: TEST_DATE });

    // Verify expense is visible before delete
    await expect(expensesPage.getExpenseAccordions()).toHaveCount(1);

    // Delete the first accordion item
    await expensesPage.clickDeleteOnAccordion(0);
    await expensesPage.confirmDelete();

    // Expense should be gone and total should be 0
    await expect(expensesPage.getExpenseAccordions()).toHaveCount(0);
    await expect(page.getByText('0.00')).toBeVisible();
  });

  test('should show success snackbar after deleting an expense', async ({ page }) => {
    await seedApprovedExpenses(page, [TEST_EXPENSE]);

    const expensesPage = new ExpensesPage(page);
    await expensesPage.navigate({ view: 'day', date: TEST_DATE });

    await expensesPage.clickDeleteOnAccordion(0);
    await expensesPage.confirmDelete();

    await expect(page.getByText('Expense deleted')).toBeVisible();
  });

  test('should cancel delete and keep the expense', async ({ page }) => {
    await seedApprovedExpenses(page, [TEST_EXPENSE]);

    const expensesPage = new ExpensesPage(page);
    await expensesPage.navigate({ view: 'day', date: TEST_DATE });

    await expensesPage.clickDeleteOnAccordion(0);
    await expensesPage.cancelDelete();

    // Expense should still be present
    await expect(expensesPage.getExpenseAccordions()).toHaveCount(1);
    await expect(page.getByText('500.00').first()).toBeVisible();
  });

  test('should edit an expense amount and update the total', async ({ page }) => {
    await seedApprovedExpenses(page, [TEST_EXPENSE]);

    const expensesPage = new ExpensesPage(page);
    await expensesPage.navigate({ view: 'day', date: TEST_DATE });

    // Open edit dialog
    await expensesPage.clickEditOnAccordion(0);

    // Wait for the edit dialog to appear
    await expect(page.getByRole('button', { name: /save changes/i })).toBeVisible();

    // Update the amount
    const amountField = page.getByLabel(/amount/i);
    await amountField.fill('750');

    await page.getByRole('button', { name: /save changes/i }).click();

    // Updated amount should be visible
    await expect(page.getByText('750.00').first()).toBeVisible();
  });

  test('should show success snackbar after editing an expense', async ({ page }) => {
    await seedApprovedExpenses(page, [TEST_EXPENSE]);

    const expensesPage = new ExpensesPage(page);
    await expensesPage.navigate({ view: 'day', date: TEST_DATE });

    await expensesPage.clickEditOnAccordion(0);
    await expect(page.getByRole('button', { name: /save changes/i })).toBeVisible();
    await page.getByRole('button', { name: /save changes/i }).click();

    await expect(page.getByText('Changes saved')).toBeVisible();
  });

  test('should pre-fill edit dialog with existing expense values', async ({ page }) => {
    await seedApprovedExpenses(page, [TEST_EXPENSE]);

    const expensesPage = new ExpensesPage(page);
    await expensesPage.navigate({ view: 'day', date: TEST_DATE });

    await expensesPage.clickEditOnAccordion(0);
    await expect(page.getByRole('button', { name: /save changes/i })).toBeVisible();

    // Form should be pre-filled with the existing expense values
    await expect(page.getByLabel(/amount/i)).toHaveValue('500');
    await expect(page.getByLabel(/category/i)).toHaveValue('Food');
    await expect(page.getByLabel(/date/i)).toHaveValue(TEST_DATE);
  });

  test('should cancel edit and keep original values', async ({ page }) => {
    await seedApprovedExpenses(page, [TEST_EXPENSE]);

    const expensesPage = new ExpensesPage(page);
    await expensesPage.navigate({ view: 'day', date: TEST_DATE });

    await expensesPage.clickEditOnAccordion(0);
    await expect(page.getByRole('button', { name: /save changes/i })).toBeVisible();

    // Change the amount but cancel
    await page.getByLabel(/amount/i).fill('9999');
    await page.getByRole('button', { name: /cancel/i }).click();

    // Accordion should still show original amount
    await expect(page.getByText('500.00').first()).toBeVisible();
  });
});
