import { test, expect } from './fixtures/base-fixture';
import { ExpensesPage } from './pages/ExpensesPage';
import { AddExpensePage } from './pages/AddExpensePage';

test.describe('Add Expense Navigation', () => {
  test('should navigate to add page with view mode and date preserved', async ({ page }) => {
    const expensesPage = new ExpensesPage(page);
    await expensesPage.navigate({ view: 'day', date: '2026-03-01' });
    
    await expensesPage.clickAddFab();
    
    await expect(page).toHaveURL(/\/expenses\/add\?view=day&date=2026-03-01/);
  });

  test('should display correct default date for day view', async ({ page }) => {
    const addPage = new AddExpensePage(page);
    await addPage.navigate({ view: 'day', date: '2026-03-15' });
    
    const dateValue = await addPage.getDateValue();
    expect(dateValue).toBe('2026-03-15');
  });

  test('should display correct default date for month view', async ({ page }) => {
    const addPage = new AddExpensePage(page);
    await addPage.navigate({ view: 'month', date: '2026-03-15' });
    
    const dateValue = await addPage.getDateValue();
    // Month view defaults to first day of month
    expect(dateValue).toBe('2026-03-01');
  });

  test('should display correct default date for year view', async ({ page }) => {
    const addPage = new AddExpensePage(page);
    await addPage.navigate({ view: 'year', date: '2026-06-15' });
    
    const dateValue = await addPage.getDateValue();
    // Year view defaults to first day of year
    expect(dateValue).toBe('2026-01-01');
  });

  test('should show info alert for month view about date defaulting', async ({ page }) => {
    const addPage = new AddExpensePage(page);
    await addPage.navigate({ view: 'month', date: '2026-03-15' });
    
    await page.waitForTimeout(500);
    
    const hasAlert = await addPage.hasInfoAlert();
    expect(hasAlert).toBe(true);
    
    const alertText = await addPage.getInfoAlertText();
    expect(alertText.toLowerCase()).toContain('month');
  });

  test('should show info alert for year view about date defaulting', async ({ page }) => {
    const addPage = new AddExpensePage(page);
    await addPage.navigate({ view: 'year', date: '2026-06-15' });
    
    await page.waitForTimeout(500);
    
    const hasAlert = await addPage.hasInfoAlert();
    expect(hasAlert).toBe(true);
    
    const alertText = await addPage.getInfoAlertText();
    expect(alertText.toLowerCase()).toContain('year');
  });

  test('should return to expenses page with context when clicking back', async ({ page }) => {
    const addPage = new AddExpensePage(page);
    await addPage.navigate({ view: 'month', date: '2026-02-15' });
    
    await addPage.clickBack();
    
    await expect(page).toHaveURL(/\/expenses\?view=month&date=2026-02-15/);
  });

  test('should return to expenses page with context when clicking cancel', async ({ page }) => {
    const addPage = new AddExpensePage(page);
    await addPage.navigate({ view: 'day', date: '2026-03-10' });
    
    await addPage.clickCancel();
    
    await expect(page).toHaveURL(/\/expenses\?view=day&date=2026-03-10/);
  });

  test('should preserve context through complete add flow', async ({ page }) => {
    // Start from expenses page with specific view/date
    const expensesPage = new ExpensesPage(page);
    await expensesPage.navigate({ view: 'month', date: '2026-02-20' });
    
    // Click add
    await expensesPage.clickAddFab();
    await expect(page).toHaveURL(/\/expenses\/add\?view=month&date=2026-02-20/);
    
    // Cancel should return with same params
    const addPage = new AddExpensePage(page);
    await addPage.clickCancel();
    await expect(page).toHaveURL(/\/expenses\?view=month&date=2026-02-20/);
  });
});
