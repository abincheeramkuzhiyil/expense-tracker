import { test, expect } from './fixtures/base-fixture';
import { Expense } from '../types/expense.types';

/**
 * Builds three approved expenses dated today so the default "This Month" range
 * always includes them. Amounts total 1000 for predictable percentages:
 * Food 50%, Travel 30%, Entertainment 20%.
 */
function currentMonthExpenses(): Expense[] {
  const today = new Date();
  const make = (id: string, amount: number, spentOn: string, category: string): Expense => ({
    id,
    amount,
    spentOn,
    category,
    date: today,
    description: '',
    source: 'manual',
    status: 'approved',
    createdAt: today,
    updatedAt: today,
  });
  return [
    make('r1', 500, 'Groceries', 'Food'),
    make('r2', 300, 'Taxi', 'Travel'),
    make('r3', 200, 'Movie', 'Entertainment'),
  ];
}

test.describe('Reports', () => {
  test('shows the sticky range + total card and category totals', async ({ page, seedExpenses }) => {
    await seedExpenses(currentMonthExpenses());
    await page.goto('/reports');

    // Range selector lives inside the summary card
    await expect(page.getByRole('combobox', { name: /range/i })).toBeVisible();
    // Total reflects the seeded expenses (500 + 300 + 200)
    await expect(page.getByRole('heading', { name: '₹1000.00' })).toBeVisible();

    await expect(page.getByText('Food')).toBeVisible();
    await expect(page.getByText('Rs. 500.00')).toBeVisible();
  });

  test('renders the percentage label on each category progress bar', async ({ page, seedExpenses }) => {
    await seedExpenses(currentMonthExpenses());
    await page.goto('/reports');

    // Percentages are overlaid on the progress bars (Food 50%, Travel 30%, Entertainment 20%)
    await expect(page.getByText('50%')).toBeVisible();
    await expect(page.getByText('30%')).toBeVisible();
    await expect(page.getByText('20%')).toBeVisible();

    await expect(page.getByRole('progressbar').first()).toBeVisible();
  });

  test('opens the Compare Periods tab without crashing', async ({ page, seedExpenses }) => {
    await seedExpenses(currentMonthExpenses());
    await page.goto('/reports');

    await page.getByRole('tab', { name: 'Compare Periods' }).click();

    // Month/Year toggle and both period pickers should render (regression guard for the
    // "Grid is not defined" crash that previously broke this tab).
    await expect(page.getByRole('button', { name: 'Month', exact: true })).toBeVisible();
    await expect(page.getByText('Period A')).toBeVisible();
    await expect(page.getByText('Period B')).toBeVisible();
  });
});
