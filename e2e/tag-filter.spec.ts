import { test, expect } from './fixtures/base-fixture';
import { ExpenseSearchPage } from './pages/ExpenseSearchPage';
import { seedApprovedExpenses } from './utils/storage-helper';

function seeded(
  id: string,
  spentOn: string,
  amount: number,
  date: string,
  tags?: string[]
) {
  return {
    id,
    spentOn,
    category: 'Other',
    amount,
    date,
    description: '',
    ...(tags ? { tags } : {}),
    source: 'manual',
    createdAt: `${date}T10:00:00.000Z`,
    updatedAt: `${date}T10:00:00.000Z`,
  };
}

const EXPENSES = [
  seeded('e1', 'Train', 4200, '2026-03-10', ['Wedding', 'Travel']),
  seeded('e2', 'Hotel', 12000, '2026-03-11', ['Wedding', 'Travel']),
  seeded('e3', 'Gift', 900, '2026-03-12', ['Wedding', 'Gifts']),
  seeded('e4', 'Lunch', 150, '2026-03-13'),
  seeded('e5', 'Fuel', 1000, '2026-02-01', ['Travel']),
];

async function openSearch(page: import('@playwright/test').Page) {
  await page.goto('/expenses');
  const search = new ExpenseSearchPage(page);
  await search.open();
  return search;
}

test.describe('Filter by tags — tabs', () => {
  test('should open on the Keyword tab and hide the tag filter', async ({ page }) => {
    await seedApprovedExpenses(page, EXPENSES);
    const search = await openSearch(page);

    await expect(search.keywordTab).toHaveAttribute('aria-selected', 'true');
    await expect(search.input).toBeVisible();
    await expect(search.tagInput).toBeHidden();
  });

  test('should show only the tag filter on the Tags tab', async ({ page }) => {
    await seedApprovedExpenses(page, EXPENSES);
    const search = await openSearch(page);

    await search.openTagsTab();

    await expect(search.tagsTab).toHaveAttribute('aria-selected', 'true');
    await expect(search.input).toBeHidden();
    await expect(
      page.getByText(/Pick one or more tags to see their expenses and total/)
    ).toBeVisible();
    await expect(search.tagTotal).toBeHidden();
  });

  test('should keep each tab state when switching and reset when reopened', async ({ page }) => {
    await seedApprovedExpenses(page, EXPENSES);
    const search = await openSearch(page);
    await search.openTagsTab();
    await search.selectTag('Wedding');

    await search.keywordTab.click();
    await search.tagsTab.click();
    await expect(page.getByTestId('tag-pill').filter({ hasText: 'Wedding' })).toBeVisible();

    await search.closeTopSheet();
    await expect(search.heading).toBeHidden();
    await search.open();
    await expect(search.keywordTab).toHaveAttribute('aria-selected', 'true');
    await search.openTagsTab();
    await expect(page.getByTestId('tag-pill')).toHaveCount(0);
  });

  test('should leave keyword search unchanged and without a total row', async ({ page }) => {
    await seedApprovedExpenses(page, EXPENSES);
    const search = await openSearch(page);

    await search.selectSuggestion('Train', /^Train\s*\d+$/);

    await expect(search.rows).toHaveCount(1);
    await expect(search.tagTotal).toBeHidden();
  });
});

test.describe('Filter by tags — picking tags', () => {
  test('should list used tags alphabetically with usage counts', async ({ page }) => {
    await seedApprovedExpenses(page, EXPENSES);
    const search = await openSearch(page);
    await search.openTagsTab();

    await search.tagInput.click();

    expect(await page.getByRole('option').allTextContents()).toEqual([
      'Gifts1',
      'Travel3',
      'Wedding3',
    ]);
  });

  test('should filter the tag list as you type', async ({ page }) => {
    await seedApprovedExpenses(page, EXPENSES);
    const search = await openSearch(page);
    await search.openTagsTab();

    await search.tagInput.fill('tra');

    expect(await page.getByRole('option').allTextContents()).toEqual(['Travel3']);
  });

  test('should drop a selected tag from the list', async ({ page }) => {
    await seedApprovedExpenses(page, EXPENSES);
    const search = await openSearch(page);
    await search.openTagsTab();
    await search.selectTag('Wedding');

    await search.tagInput.click();

    expect(await page.getByRole('option').allTextContents()).toEqual(['Gifts1', 'Travel3']);
  });

  test('should disable the field with a hint when no expense has a tag', async ({ page }) => {
    await seedApprovedExpenses(page, [seeded('n1', 'Lunch', 100, '2026-03-13')]);
    const search = await openSearch(page);
    await search.openTagsTab();

    await expect(search.tagInput).toBeDisabled();
    await expect(
      page.getByText('No tags yet. Add tags when you create or edit an expense.')
    ).toBeVisible();
  });
});

test.describe('Filter by tags — results and total', () => {
  test('should list expenses for one tag with a fixed total row', async ({ page }) => {
    await seedApprovedExpenses(page, EXPENSES);
    const search = await openSearch(page);
    await search.openTagsTab();

    await search.selectTag('Travel');

    await expect(search.rows).toHaveCount(3);
    await expect(search.tagTotal).toContainText('Total (3 expenses)');
    await expect(search.tagTotal).toContainText('17200.00');
  });

  test('should require ALL selected tags', async ({ page }) => {
    await seedApprovedExpenses(page, EXPENSES);
    const search = await openSearch(page);
    await search.openTagsTab();

    await search.selectTag('Wedding');
    await search.selectTag('Travel');

    await expect(search.rows).toHaveCount(2);
    await expect(search.tagTotal).toContainText('Total (2 expenses)');
    await expect(search.tagTotal).toContainText('16200.00');
  });

  test('should update results when a tag pill is removed', async ({ page }) => {
    await seedApprovedExpenses(page, EXPENSES);
    const search = await openSearch(page);
    await search.openTagsTab();
    await search.selectTag('Wedding');
    await search.selectTag('Travel');

    await page
      .getByTestId('tag-pill')
      .filter({ hasText: 'Travel' })
      .getByTestId('CancelIcon')
      .click();

    await expect(search.rows).toHaveCount(3);
    await expect(search.tagTotal).toContainText('Total (3 expenses)');
    await expect(search.tagTotal).toContainText('17100.00');
  });

  test('should show a no-match message with Clear tags', async ({ page }) => {
    await seedApprovedExpenses(page, EXPENSES);
    const search = await openSearch(page);
    await search.openTagsTab();
    await search.selectTag('Gifts');
    await search.selectTag('Travel');

    await expect(search.tagNoResults).toContainText('No expenses have all of these tags');
    await expect(search.tagTotal).toBeHidden();

    await page.getByRole('button', { name: 'Clear tags' }).click();

    await expect(search.tagNoResults).toBeHidden();
    await expect(page.getByTestId('tag-pill')).toHaveCount(0);
  });

  test('should total ALL matches and keep the total in view when results are paged', async ({
    page,
  }) => {
    const many = Array.from({ length: 60 }, (_, i) =>
      seeded(`m${i}`, `Item ${i}`, 10, '2026-03-10', ['Bulk'])
    );
    await seedApprovedExpenses(page, many);
    const search = await openSearch(page);
    await search.openTagsTab();

    await search.selectTag('Bulk');

    await expect(search.rows).toHaveCount(50);
    await expect(search.showMoreButton()).toContainText('50 of 60');
    await expect(search.tagTotal).toContainText('Total (60 expenses)');
    await expect(search.tagTotal).toContainText('600.00');
    await expect(search.tagTotal).toBeInViewport();

    await search.showMoreButton().click();
    await expect(search.rows).toHaveCount(60);
  });

  test('should open the day detail from a tag result', async ({ page }) => {
    await seedApprovedExpenses(page, EXPENSES);
    const search = await openSearch(page);
    await search.openTagsTab();
    await search.selectTag('Gifts');

    await search.dayButton(0).click();

    await expect(page.getByText('Gift').first()).toBeVisible();
  });
});
