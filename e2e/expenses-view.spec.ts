import { test, expect } from './fixtures/base-fixture';
import { ExpensesPage } from './pages/ExpensesPage';
import { SAMPLE_EXPENSES, TODAY_EXPENSES, FEBRUARY_EXPENSES, YEAR_2026_EXPENSES } from './utils/test-data';
import { formatDate } from './utils/date-helper';

test.describe('Expenses View', () => {
  test('should load expenses from localStorage', async ({ page, seedExpenses }) => {
    await seedExpenses(SAMPLE_EXPENSES);
    
    const expensesPage = new ExpensesPage(page);
    await expensesPage.navigate();
    
    // Should display some expenses
    const count = await expensesPage.getExpenseCount();
    expect(count).toBeGreaterThan(0);
  });

  test('should display empty state when no expenses', async ({ page }) => {
    const expensesPage = new ExpensesPage(page);
    await expensesPage.navigate();
    
    const count = await expensesPage.getExpenseCount();
    expect(count).toBe(0);
  });

  test('should filter expenses by day view', async ({ page, seedExpenses }) => {
    await seedExpenses(SAMPLE_EXPENSES);
    
    const expensesPage = new ExpensesPage(page);
    await expensesPage.navigate({ view: 'day', date: '2026-03-01' });
    
    // Wait for page to load
    await page.waitForTimeout(500);
    
    const count = await expensesPage.getExpenseCount();
    // Today (March 1, 2026) has 2 expenses in sample data
    expect(count).toBe(TODAY_EXPENSES.length);
  });

  test('should filter expenses by month view', async ({ page, seedExpenses }) => {
    await seedExpenses(SAMPLE_EXPENSES);
    
    const expensesPage = new ExpensesPage(page);
    await expensesPage.navigate({ view: 'month', date: '2026-02-01' });
    
    await page.waitForTimeout(500);
    
    const count = await expensesPage.getExpenseCount();
    // February 2026 has specific expenses
    expect(count).toBe(FEBRUARY_EXPENSES.length);
  });

  test('should filter expenses by year view', async ({ page, seedExpenses }) => {
    await seedExpenses(SAMPLE_EXPENSES);
    
    const expensesPage = new ExpensesPage(page);
    await expensesPage.navigate({ view: 'year', date: '2026-01-01' });
    
    await page.waitForTimeout(500);
    
    const count = await expensesPage.getExpenseCount();
    // 2026 has specific number of expenses
    expect(count).toBe(YEAR_2026_EXPENSES.length);
  });

  test('should change view mode and update URL', async ({ page, seedExpenses }) => {
    await seedExpenses(SAMPLE_EXPENSES);
    
    const expensesPage = new ExpensesPage(page);
    await expensesPage.navigate({ view: 'day', date: '2026-03-01' });
    
    await expensesPage.selectViewMode('month');
    await page.waitForTimeout(500);
    
    const urlParams = expensesPage.getUrlParams();
    expect(urlParams.get('view')).toBe('month');
  });

  test('should navigate to previous date', async ({ page, seedExpenses }) => {
    await seedExpenses(SAMPLE_EXPENSES);
    
    const expensesPage = new ExpensesPage(page);
    await expensesPage.navigate({ view: 'day', date: '2026-03-01' });
    
    await expensesPage.clickPrevious();
    await page.waitForTimeout(500);
    
    const urlParams = expensesPage.getUrlParams();
    expect(urlParams.get('date')).toBe('2026-02-29'); // Previous day
  });

  test('should navigate to next date', async ({ page, seedExpenses }) => {
    await seedExpenses(SAMPLE_EXPENSES);
    
    const expensesPage = new ExpensesPage(page);
    await expensesPage.navigate({ view: 'day', date: '2026-03-01' });
    
    await expensesPage.clickNext();
    await page.waitForTimeout(500);
    
    const urlParams = expensesPage.getUrlParams();
    expect(urlParams.get('date')).toBe('2026-03-02'); // Next day
  });

  test('should navigate to today', async ({ page, seedExpenses }) => {
    await seedExpenses(SAMPLE_EXPENSES);
    
    const expensesPage = new ExpensesPage(page);
    await expensesPage.navigate({ view: 'day', date: '2026-02-01' });
    
    await expensesPage.clickToday();
    await page.waitForTimeout(500);
    
    const urlParams = expensesPage.getUrlParams();
    const today = formatDate(new Date(2026, 2, 1)); // March 1, 2026
    expect(urlParams.get('date')).toBe(today);
  });

  test('should disable today button when viewing current date', async ({ page, seedExpenses }) => {
    await seedExpenses(SAMPLE_EXPENSES);
    
    const expensesPage = new ExpensesPage(page);
    const today = formatDate(new Date(2026, 2, 1)); // March 1, 2026
    await expensesPage.navigate({ view: 'day', date: today });
    
    await page.waitForTimeout(500);
    
    const isDisabled = await expensesPage.isTodayButtonDisabled();
    expect(isDisabled).toBe(true);
  });

  test('should display total calculation', async ({ page, seedExpenses }) => {
    await seedExpenses(SAMPLE_EXPENSES);
    
    const expensesPage = new ExpensesPage(page);
    await expensesPage.navigate({ view: 'day', date: '2026-03-01' });
    
    await page.waitForTimeout(500);
    
    const total = await expensesPage.getTotal();
    // Total for March 1 should be 250.50 + 45.00 = 295.50
    expect(total).toContain('295.50');
  });

  test('should initialize state from URL params', async ({ page, seedExpenses }) => {
    await seedExpenses(SAMPLE_EXPENSES);
    
    const expensesPage = new ExpensesPage(page);
    await expensesPage.navigate({ view: 'month', date: '2026-02-15' });
    
    await page.waitForTimeout(500);
    
    const urlParams = expensesPage.getUrlParams();
    expect(urlParams.get('view')).toBe('month');
    expect(urlParams.get('date')).toBe('2026-02-15');
  });
});
