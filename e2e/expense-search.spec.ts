import { test, expect } from './fixtures/base-fixture';
import { ExpensesPage } from './pages/ExpensesPage';
import { ExpenseSearchPage } from './pages/ExpenseSearchPage';
import { seedApprovedExpenses, seedPendingItems } from './utils/storage-helper';
import { addDays, addMonths, addYears, formatDate } from './utils/date-helper';
import { formatResultDate } from '../utils/expenseSearch';

const NOW = new Date();

function make(
  id: string,
  spentOn: string,
  amount: number,
  date: Date,
  description = '',
  category = 'Other'
) {
  const iso = date.toISOString();
  return { id, spentOn, amount, category, date: formatDate(date), description, source: 'manual', createdAt: iso, updatedAt: iso };
}

const D_RECENT = addDays(NOW, -10);
const D_SIX_MONTHS = addMonths(NOW, -6);
const D_TWO_YEARS = addYears(NOW, -2);
const D_FLIGHT = addMonths(NOW, -14);

const SEED = [
  make('hc-1', 'Haircut', 250, D_RECENT, 'Son'),
  make('hc-2', 'Haircut', 300, D_SIX_MONTHS),
  make('hc-3', 'haircut', 500, D_TWO_YEARS),
  make('oil-1', 'Hair oil', 120, addDays(NOW, -20)),
  make('fl-1', 'Flight', 6500, D_FLIGHT, 'Native place trip', 'Travel'),
  make('gr-1', 'Groceries', 640, addDays(NOW, -3), '', 'Food'),
];

async function openSearch(page: import('@playwright/test').Page) {
  const expensesPage = new ExpensesPage(page);
  await expensesPage.navigate();
  const search = new ExpenseSearchPage(page);
  await search.open();
  return search;
}

test.describe('Global expense search', () => {
  test.beforeEach(async ({ page }) => {
    await seedApprovedExpenses(page, SEED);
  });

  test('opens from the Expenses header icon with a hint and range chips', async ({ page }) => {
    const search = await openSearch(page);

    await expect(search.heading).toBeVisible();
    await expect(page.getByText(/Find any expense/)).toBeVisible();
    await expect(search.chip('All time')).toHaveAttribute('aria-pressed', 'true');
    await expect(search.chip('Last 12 months')).toHaveAttribute('aria-pressed', 'false');
    await expect(search.chip('Last 3 months')).toHaveAttribute('aria-pressed', 'false');
  });

  test('suggests used Spent On items with counts, ranked by match then count', async ({ page }) => {
    const search = await openSearch(page);
    await search.type('hai');

    const options = page.getByRole('option');
    await expect(options).toHaveCount(3);
    await expect(options.nth(0)).toHaveText(/Haircut\s*3/);
    await expect(options.nth(1)).toHaveText(/Hair oil\s*1/);
    await expect(options.nth(2)).toHaveText(/Search "hai" in all text/);
  });

  test('does not suggest built-in mapping items that were never used', async ({ page }) => {
    const search = await openSearch(page);
    await search.type('netflix');

    await expect(page.getByRole('option')).toHaveCount(1);
    await expect(search.option(/Search "netflix" in all text/)).toBeVisible();
  });

  test('selecting a suggestion lists matches newest first, merging case variants', async ({ page }) => {
    const search = await openSearch(page);
    await search.selectSuggestion('hai', /^Haircut\s*3$/);

    await expect(search.rows).toHaveCount(3);
    await expect(search.rows.nth(0)).toContainText(formatResultDate(formatDate(D_RECENT)));
    await expect(search.rows.nth(0)).toContainText('250.00');
    await expect(search.rows.nth(0)).toContainText('Son');
    await expect(search.rows.nth(1)).toContainText(formatResultDate(formatDate(D_SIX_MONTHS)));
    await expect(search.rows.nth(2)).toContainText(formatResultDate(formatDate(D_TWO_YEARS)));
    await expect(search.rows.nth(2)).toContainText('500.00');
    // Not an exact match, so "Hair oil" must be absent.
    await expect(page.getByTestId('search-results')).not.toContainText('Hair oil');
  });

  test('Enter runs a free-text search across the description', async ({ page }) => {
    const search = await openSearch(page);
    await search.type('native');
    await search.input.press('Enter');

    await expect(search.rows).toHaveCount(1);
    await expect(search.rows.first()).toContainText('Flight');
    await expect(search.rows.first()).toContainText('Native place trip');
  });

  test('the "in all text" option matches category too', async ({ page }) => {
    const search = await openSearch(page);
    await search.type('travel');
    await search.option(/in all text/).click();

    await expect(search.rows).toHaveCount(1);
    await expect(search.rows.first()).toContainText('Flight');
  });

  test('range chips narrow and widen the results', async ({ page }) => {
    const search = await openSearch(page);
    await search.selectSuggestion('hai', /^Haircut\s*3$/);
    await expect(search.rows).toHaveCount(3);

    await search.chip('Last 12 months').click();
    await expect(search.rows).toHaveCount(2);

    await search.chip('Last 3 months').click();
    await expect(search.rows).toHaveCount(1);
    await expect(search.rows.first()).toContainText('250.00');

    await search.chip('All time').click();
    await expect(search.rows).toHaveCount(3);
  });

  test('empty range result offers an All time shortcut', async ({ page }) => {
    const search = await openSearch(page);
    await search.chip('Last 3 months').click();
    await search.selectSuggestion('fli', /^Flight\s*1$/);

    await expect(search.noResults).toContainText('No expenses found for "Flight"');
    await search.noResults.getByRole('button', { name: 'All time' }).click();
    await expect(search.rows).toHaveCount(1);
  });

  test('shows a no-results state for unknown text', async ({ page }) => {
    const search = await openSearch(page);
    await search.type('zzzzz');
    await search.input.press('Enter');

    await expect(search.noResults).toContainText('No expenses found for "zzzzz"');
    await expect(search.rows).toHaveCount(0);
  });

  test('editing the text after a search clears the stale results', async ({ page }) => {
    const search = await openSearch(page);
    await search.selectSuggestion('hai', /^Haircut\s*3$/);
    await expect(search.rows).toHaveCount(3);

    await search.type('hairc');
    await expect(search.rows).toHaveCount(0);
    await expect(page.getByText(/Find any expense/)).toBeVisible();
  });

  test('reopening the sheet starts with a clean search', async ({ page }) => {
    const search = await openSearch(page);
    await search.selectSuggestion('hai', /^Haircut\s*3$/);
    await search.closeTopSheet();
    await expect(search.heading).toBeHidden();

    await search.open();
    await expect(search.input).toHaveValue('');
    await expect(search.rows).toHaveCount(0);
  });

  test('the row arrow opens the day sheet and closing it returns to the results', async ({ page }) => {
    const search = await openSearch(page);
    await search.selectSuggestion('hai', /^Haircut\s*3$/);

    await search.dayButton(0).click();

    const day = String(D_RECENT.getDate());
    const month = D_RECENT.toLocaleDateString('en-GB', { month: 'short' });
    const year = String(D_RECENT.getFullYear());
    await expect(
      page.getByRole('heading', { name: new RegExp(`${day}\\s+${month}\\s+${year}`) })
    ).toBeVisible();
    await expect(page.getByRole('button', { name: /Haircut\s*250\.00/ })).toBeVisible();
    expect(page.url()).toContain('/expenses');

    await search.closeTopSheet();
    await expect(search.heading).toBeVisible();
    await expect(search.input).toHaveValue('Haircut');
    await expect(search.rows).toHaveCount(3);
  });

  test('deleting from the day sheet removes the row from the results', async ({ page }) => {
    const search = await openSearch(page);
    await search.selectSuggestion('hai', /^Haircut\s*3$/);

    await search.dayButton(0).click();
    await page.getByRole('button', { name: /Haircut\s*250\.00/ }).click();
    await page.getByRole('button', { name: 'Delete', exact: true }).click();
    await page.getByRole('button', { name: 'Confirm delete expense' }).click();

    await search.closeTopSheet();
    await expect(search.rows).toHaveCount(2);
    await expect(page.getByTestId('search-results')).not.toContainText('250.00');
  });
});

test.describe('Global expense search — paging and data rules', () => {
  test('pages results 50 at a time', async ({ page }) => {
    const bulk = Array.from({ length: 60 }, (_, i) =>
      make(`bulk-${i}`, 'Bulk item', 10 + i, addDays(NOW, -(i + 1)))
    );
    await seedApprovedExpenses(page, bulk);

    const search = await openSearch(page);
    await search.selectSuggestion('bulk', /^Bulk item\s*60$/);

    await expect(search.rows).toHaveCount(50);
    await expect(search.showMoreButton()).toHaveText('Show more (50 of 60)');
    await search.showMoreButton().click();
    await expect(search.rows).toHaveCount(60);
    await expect(search.showMoreButton()).toHaveCount(0);
  });

  test('pending (unreviewed) expenses are not searchable', async ({ page }) => {
    await seedApprovedExpenses(page, SEED);
    const iso = NOW.toISOString();
    await seedPendingItems(page, [
      {
        id: 'pend-1',
        amount: 99,
        spentOn: 'Pendingthing',
        category: 'Other',
        date: formatDate(NOW),
        description: '',
        source: 'sms',
        createdAt: iso,
        updatedAt: iso,
      },
    ]);

    const search = await openSearch(page);
    await search.type('Pendingthing');
    await expect(page.getByRole('option')).toHaveCount(1);
    await search.input.press('Enter');

    await expect(search.noResults).toBeVisible();
  });

  test('an empty app shows the no-results state without errors', async ({ page }) => {
    const search = await openSearch(page);
    await search.type('anything');
    await search.input.press('Enter');

    await expect(search.noResults).toBeVisible();
  });
});

test.describe('Global expense search — mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('results fit the viewport without horizontal overflow', async ({ page }) => {
    await seedApprovedExpenses(page, [
      make('m-1', 'A very long spent on label that must be truncated', 12345.67, D_RECENT, 'A long description that should also be truncated nicely'),
    ]);

    const search = await openSearch(page);
    await search.type('very long');
    await search.input.press('Enter');

    await expect(search.rows).toHaveCount(1);
    const fits = await page
      .getByTestId('search-results')
      .evaluate((el) => el.scrollWidth <= el.clientWidth + 1);
    expect(fits).toBe(true);
    await expect(search.dayButton(0)).toBeVisible();
  });
});
