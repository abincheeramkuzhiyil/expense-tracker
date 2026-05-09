import { test, expect } from './fixtures/base-fixture';
import { ExpensesPage } from './pages/ExpensesPage';
import { seedApprovedExpenses } from './utils/storage-helper';

/** Approved expenses covering multiple months and days for drill-down testing */
const APPROVED_EXPENSES = [
  {
    id: 'yr-1',
    amount: 500,
    spentOn: 'Groceries',
    category: 'Food',
    date: '2026-03-15',
    description: 'March groceries',
    source: 'manual',
    createdAt: '2026-03-15T10:00:00.000Z',
    updatedAt: '2026-03-15T10:00:00.000Z',
  },
  {
    id: 'yr-2',
    amount: 1500,
    spentOn: 'Rent',
    category: 'Bills',
    date: '2026-03-01',
    description: 'March rent',
    source: 'manual',
    createdAt: '2026-03-01T10:00:00.000Z',
    updatedAt: '2026-03-01T10:00:00.000Z',
  },
  {
    id: 'yr-3',
    amount: 200,
    spentOn: 'Taxi',
    category: 'Travel',
    date: '2026-02-10',
    description: 'Taxi ride',
    source: 'manual',
    createdAt: '2026-02-10T10:00:00.000Z',
    updatedAt: '2026-02-10T10:00:00.000Z',
  },
  {
    id: 'yr-4',
    amount: 350,
    spentOn: 'Movie',
    category: 'Entertainment',
    date: '2026-01-20',
    description: 'Movie night',
    source: 'manual',
    createdAt: '2026-01-20T10:00:00.000Z',
    updatedAt: '2026-01-20T10:00:00.000Z',
  },
];

test.describe('Year View — Month Summary Table', () => {
  test('should display all 12 months in year view', async ({ page }) => {
    await seedApprovedExpenses(page, APPROVED_EXPENSES);

    const expensesPage = new ExpensesPage(page);
    await expensesPage.navigate({ view: 'year', date: '2026-01-01' });

    // Short month names should be visible
    await expect(page.getByRole('cell', { name: 'Jan' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Mar' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Dec' })).toBeVisible();
  });

  test('should display monthly totals for months with expenses', async ({ page }) => {
    await seedApprovedExpenses(page, APPROVED_EXPENSES);

    const expensesPage = new ExpensesPage(page);
    await expensesPage.navigate({ view: 'year', date: '2026-01-01' });

    // March total = 500 + 1500 = 2000
    await expect(page.getByText('2000.00')).toBeVisible();
    // February total = 200
    await expect(page.getByText('200.00')).toBeVisible();
  });

  test('should open MonthDetailModal when clicking the expand button for a month', async ({ page }) => {
    await seedApprovedExpenses(page, APPROVED_EXPENSES);

    const expensesPage = new ExpensesPage(page);
    await expensesPage.navigate({ view: 'year', date: '2026-01-01' });

    // Click the icon button in the March row (3rd month, 0-based index 2)
    // Find the row containing "Mar" and click its expand button
    const marRow = page.getByRole('row').filter({ hasText: 'Mar' });
    await marRow.getByRole('button').click();

    // MonthDetailModal should open with March heading
    await expect(page.getByText(/march/i)).toBeVisible();
  });

  test('should show correct month/year heading in MonthDetailModal', async ({ page }) => {
    await seedApprovedExpenses(page, APPROVED_EXPENSES);

    const expensesPage = new ExpensesPage(page);
    await expensesPage.navigate({ view: 'year', date: '2026-01-01' });

    const marRow = page.getByRole('row').filter({ hasText: 'Mar' });
    await marRow.getByRole('button').click();

    // Should say "March 2026" somewhere in the header
    await expect(page.getByText(/march 2026/i)).toBeVisible();
  });

  test('should close MonthDetailModal with Escape key', async ({ page }) => {
    await seedApprovedExpenses(page, APPROVED_EXPENSES);

    const expensesPage = new ExpensesPage(page);
    await expensesPage.navigate({ view: 'year', date: '2026-01-01' });

    const marRow = page.getByRole('row').filter({ hasText: 'Mar' });
    await marRow.getByRole('button').click();

    await expect(page.getByText(/march 2026/i)).toBeVisible();

    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);

    await expect(page.getByText(/march 2026/i)).not.toBeVisible();
  });

  test('should display day rows inside MonthDetailModal', async ({ page }) => {
    await seedApprovedExpenses(page, APPROVED_EXPENSES);

    const expensesPage = new ExpensesPage(page);
    await expensesPage.navigate({ view: 'year', date: '2026-01-01' });

    const marRow = page.getByRole('row').filter({ hasText: 'Mar' });
    await marRow.getByRole('button').click();

    // MonthDayTable should show all 31 days of March; day 1 and day 15 should appear
    await expect(page.getByRole('cell', { name: /^1 -/i }).first()).toBeVisible();
    await expect(page.getByRole('cell', { name: /^15 -/i })).toBeVisible();
  });

  test('should show month total in MonthDetailModal footer', async ({ page }) => {
    await seedApprovedExpenses(page, APPROVED_EXPENSES);

    const expensesPage = new ExpensesPage(page);
    await expensesPage.navigate({ view: 'year', date: '2026-01-01' });

    const marRow = page.getByRole('row').filter({ hasText: 'Mar' });
    await marRow.getByRole('button').click();

    // March total = 2000
    await expect(page.getByText('2000.00').first()).toBeVisible();
  });

  test('should display all months (even those with no expenses) in the year table', async ({ page }) => {
    await seedApprovedExpenses(page, APPROVED_EXPENSES);

    const expensesPage = new ExpensesPage(page);
    await expensesPage.navigate({ view: 'year', date: '2026-01-01' });

    // All months should be displayed
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (const month of monthNames) {
      await expect(page.getByRole('cell', { name: month })).toBeVisible();
    }
  });
});

test.describe('Month View — Day Detail Modal', () => {
  test('should display all days in month view', async ({ page }) => {
    await seedApprovedExpenses(page, APPROVED_EXPENSES);

    const expensesPage = new ExpensesPage(page);
    await expensesPage.navigate({ view: 'month', date: '2026-03-01' });

    // March has 31 days; day 1 and day 31 should appear
    await expect(page.getByRole('cell', { name: /^1 -/i }).first()).toBeVisible();
    await expect(page.getByRole('cell', { name: /^31 -/i })).toBeVisible();
  });

  test('should show day totals for days with expenses', async ({ page }) => {
    await seedApprovedExpenses(page, APPROVED_EXPENSES);

    const expensesPage = new ExpensesPage(page);
    await expensesPage.navigate({ view: 'month', date: '2026-03-01' });

    // Day 15 has 500, day 1 has 1500
    await expect(page.getByText('500.00')).toBeVisible();
    await expect(page.getByText('1500.00')).toBeVisible();
  });

  test('should open DayDetailModal when clicking the expand button for a day', async ({ page }) => {
    await seedApprovedExpenses(page, APPROVED_EXPENSES);

    const expensesPage = new ExpensesPage(page);
    await expensesPage.navigate({ view: 'month', date: '2026-03-01' });

    // Click the icon button for day 15
    const day15Row = page.getByRole('row').filter({ hasText: /^15 -/ });
    await day15Row.getByRole('button').click();

    // DayDetailModal should open
    // It shows the date heading: e.g. "Saturday, 15 March 2026"
    await expect(page.getByText(/15.*march.*2026/i)).toBeVisible();
  });

  test('should display expenses inside DayDetailModal', async ({ page }) => {
    await seedApprovedExpenses(page, APPROVED_EXPENSES);

    const expensesPage = new ExpensesPage(page);
    await expensesPage.navigate({ view: 'month', date: '2026-03-01' });

    const day15Row = page.getByRole('row').filter({ hasText: /^15 -/ });
    await day15Row.getByRole('button').click();

    // Groceries expense should appear in the modal
    await expect(page.getByText('Groceries')).toBeVisible();
  });

  test('should show day total inside DayDetailModal', async ({ page }) => {
    await seedApprovedExpenses(page, APPROVED_EXPENSES);

    const expensesPage = new ExpensesPage(page);
    await expensesPage.navigate({ view: 'month', date: '2026-03-01' });

    const day15Row = page.getByRole('row').filter({ hasText: /^15 -/ });
    await day15Row.getByRole('button').click();

    // Day 15 total = 500
    await expect(page.getByText('500.00').first()).toBeVisible();
  });

  test('should close DayDetailModal with Escape key', async ({ page }) => {
    await seedApprovedExpenses(page, APPROVED_EXPENSES);

    const expensesPage = new ExpensesPage(page);
    await expensesPage.navigate({ view: 'month', date: '2026-03-01' });

    const day15Row = page.getByRole('row').filter({ hasText: /^15 -/ });
    await day15Row.getByRole('button').click();

    await expect(page.getByText(/15.*march.*2026/i)).toBeVisible();

    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);

    await expect(page.getByText(/15.*march.*2026/i)).not.toBeVisible();
  });

  test('should have an Add FAB inside the DayDetailModal', async ({ page }) => {
    await seedApprovedExpenses(page, APPROVED_EXPENSES);

    const expensesPage = new ExpensesPage(page);
    await expensesPage.navigate({ view: 'month', date: '2026-03-01' });

    const day15Row = page.getByRole('row').filter({ hasText: /^15 -/ });
    await day15Row.getByRole('button').click();

    // FAB with "add" label should be visible inside the modal
    await expect(page.getByRole('button', { name: /add/i }).last()).toBeVisible();
  });

  test('should show month total in the MonthDayTable footer', async ({ page }) => {
    await seedApprovedExpenses(page, APPROVED_EXPENSES);

    const expensesPage = new ExpensesPage(page);
    await expensesPage.navigate({ view: 'month', date: '2026-03-01' });

    // March total = 2000
    await expect(page.getByText('2000.00')).toBeVisible();
  });
});
