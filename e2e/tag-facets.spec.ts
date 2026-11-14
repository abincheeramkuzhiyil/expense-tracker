import type { Page } from '@playwright/test';
import { test, expect } from './fixtures/base-fixture';
import { ExpenseSearchPage } from './pages/ExpenseSearchPage';
import { seedApprovedExpenses } from './utils/storage-helper';

function seeded(
  id: string,
  spentOn: string,
  amount: number,
  date: string,
  tags?: string[],
  category = 'Other'
) {
  return {
    id,
    spentOn,
    category,
    amount,
    date,
    description: '',
    ...(tags ? { tags } : {}),
    source: 'manual',
    createdAt: `${date}T10:00:00.000Z`,
    updatedAt: `${date}T10:00:00.000Z`,
  };
}

// Haircut example: 4 own (untagged), 2 for Son, 1 for Son + Birthday
const HAIRCUTS = [
  seeded('h1', 'Haircut', 300, '2026-03-01', undefined, 'Personal Care'),
  seeded('h2', 'Haircut', 300, '2026-03-02', undefined, 'Personal Care'),
  seeded('h3', 'Haircut', 300, '2026-03-03', undefined, 'Personal Care'),
  seeded('h4', 'Haircut', 300, '2026-03-04', undefined, 'Personal Care'),
  seeded('s1', 'Haircut', 250, '2026-03-05', ['Son'], 'Personal Care'),
  seeded('s2', 'Haircut', 250, '2026-03-06', ['Son'], 'Personal Care'),
  seeded('s3', 'Haircut', 400, '2026-03-07', ['Son', 'Birthday'], 'Personal Care'),
  seeded('l1', 'Lunch', 100, '2026-03-08', undefined, 'Food'),
];

async function openSearch(page: Page, expenses: ReturnType<typeof seeded>[]) {
  await seedApprovedExpenses(page, expenses);
  await page.goto('/expenses');
  const search = new ExpenseSearchPage(page);
  await search.open();
  return search;
}

const tagChip = (page: Page, name: string) =>
  page.getByTestId('tag-facets').getByRole('button', { name, exact: true });
const categoryChip = (page: Page, name: string) =>
  page.getByTestId('category-facets').getByRole('button', { name, exact: true });

test.describe('Narrow by tag — Keyword tab', () => {
  test('should not show the chip row when no result has a tag', async ({ page }) => {
    const search = await openSearch(page, HAIRCUTS);

    await search.selectSuggestion('Lunch', /^Lunch\s*\d+$/);

    await expect(search.rows).toHaveCount(1);
    await expect(page.getByTestId('tag-facets')).toBeHidden();
  });

  test('should list chips by count with No tag included', async ({ page }) => {
    const search = await openSearch(page, HAIRCUTS);

    await search.selectSuggestion('Haircut', /^Haircut\s*\d+$/);

    await expect(search.rows).toHaveCount(7);
    const chips = page.getByTestId('tag-facets').getByRole('button');
    await expect(chips).toHaveText(['No tag 4', 'Son 3', 'Birthday 1']);
  });

  test('should narrow to one tag and update the total', async ({ page }) => {
    const search = await openSearch(page, HAIRCUTS);
    await search.selectSuggestion('Haircut', /^Haircut\s*\d+$/);

    await tagChip(page, 'Son 3').click();

    await expect(search.rows).toHaveCount(3);
    await expect(search.total).toContainText('Total (3 expenses)');
    await expect(search.total).toContainText('900.00');
    // No tag cannot combine with Son, so it is gone; Birthday remains
    await expect(tagChip(page, 'No tag 4')).toBeHidden();
    await expect(tagChip(page, 'Birthday 1')).toBeVisible();
  });

  test('should require all selected tags', async ({ page }) => {
    const search = await openSearch(page, HAIRCUTS);
    await search.selectSuggestion('Haircut', /^Haircut\s*\d+$/);

    await tagChip(page, 'Son 3').click();
    await tagChip(page, 'Birthday 1').click();

    await expect(search.rows).toHaveCount(1);
    await expect(search.total).toContainText('400.00');
  });

  test('should show untagged expenses with No tag and hide the real tags', async ({ page }) => {
    const search = await openSearch(page, HAIRCUTS);
    await search.selectSuggestion('Haircut', /^Haircut\s*\d+$/);

    await tagChip(page, 'No tag 4').click();

    await expect(search.rows).toHaveCount(4);
    await expect(search.total).toContainText('1200.00');
    await expect(tagChip(page, 'Son 4')).toBeHidden();
    await expect(page.getByTestId('tag-facets').getByRole('button')).toHaveCount(1);
  });

  test('should remove a chip by tapping it again', async ({ page }) => {
    const search = await openSearch(page, HAIRCUTS);
    await search.selectSuggestion('Haircut', /^Haircut\s*\d+$/);
    await tagChip(page, 'Son 3').click();
    await expect(search.rows).toHaveCount(3);

    await tagChip(page, 'Son 3').click();

    await expect(search.rows).toHaveCount(7);
  });

  test('should reset the chips when a new search is run', async ({ page }) => {
    const search = await openSearch(page, HAIRCUTS);
    await search.selectSuggestion('Haircut', /^Haircut\s*\d+$/);
    await tagChip(page, 'Son 3').click();

    await search.selectSuggestion('haircut', /^Search "haircut" in all text$/);

    await expect(search.rows).toHaveCount(7);
    await expect(tagChip(page, 'No tag 4')).toBeVisible();
  });

  test('should open overflow tags in a bottom sheet behind More…', async ({ page }) => {
    const many = Array.from({ length: 7 }, (_, i) =>
      seeded(`g${i}`, 'Gift', 100, `2026-03-0${i + 1}`, [`Tag${i + 1}`])
    );
    const search = await openSearch(page, many);
    await search.selectSuggestion('Gift', /^Gift\s*\d+$/);

    // 5 inline chips plus More…
    const chips = page.getByTestId('tag-facets').getByRole('button');
    await expect(chips).toHaveCount(6);
    await expect(tagChip(page, 'Tag7 1')).toBeHidden();

    await page.getByTestId('tag-facets').getByRole('button', { name: 'More…' }).click();
    await expect(page.getByRole('heading', { name: 'Narrow by tags' })).toBeVisible();
    await page.getByLabel('Filter tags').fill('tag7');
    await page.getByRole('checkbox', { name: 'Tag7' }).check();
    await page.getByRole('button', { name: 'Ok', exact: true }).click();

    await expect(search.rows).toHaveCount(1);
    await expect(tagChip(page, 'Tag7 1')).toBeVisible();
  });

  test('should discard sheet changes when it is closed without Ok', async ({ page }) => {
    const many = Array.from({ length: 7 }, (_, i) =>
      seeded(`g${i}`, 'Gift', 100, `2026-03-0${i + 1}`, [`Tag${i + 1}`])
    );
    const search = await openSearch(page, many);
    await search.selectSuggestion('Gift', /^Gift\s*\d+$/);

    await page.getByTestId('tag-facets').getByRole('button', { name: 'More…' }).click();
    await page.getByRole('checkbox', { name: 'Tag7' }).check();
    await page.getByRole('button', { name: 'Close', exact: true }).first().click();

    await expect(page.getByRole('heading', { name: 'Narrow by tags' })).toBeHidden();
    await expect(search.rows).toHaveCount(7);
  });
});

test.describe('Result rows — tag caption', () => {
  test('should show the tags under the name, and nothing for untagged rows', async ({ page }) => {
    const search = await openSearch(page, HAIRCUTS);

    await search.selectSuggestion('Haircut', /^Haircut\s*\d+$/);

    const captions = page.getByTestId('search-row-tags');
    await expect(captions).toHaveCount(3);
    await expect(captions.filter({ hasText: 'Son · Birthday' })).toHaveCount(1);
    await expect(search.rows.filter({ hasNot: captions })).toHaveCount(4);
  });

  test('should show at most two tags then +N', async ({ page }) => {
    const search = await openSearch(page, [
      seeded('m1', 'Dress', 500, '2026-03-01', ['Son', 'Gifts', 'Party', 'Kids']),
    ]);

    await search.selectSuggestion('Dress', /^Dress\s*\d+$/);

    await expect(page.getByTestId('search-row-tags')).toHaveText('Son · Gifts +2');
  });

  test('should show captions in the Tags tab too', async ({ page }) => {
    const search = await openSearch(page, HAIRCUTS);
    await search.openTagsTab();

    await search.selectTag('Birthday');

    await expect(page.getByTestId('search-row-tags')).toHaveText('Son · Birthday');
  });
});

const EVENT = [
  seeded('w1', 'Train', 4200, '2026-03-10', ['Wedding'], 'Travel'),
  seeded('w2', 'Hotel', 12000, '2026-03-11', ['Wedding'], 'Stay'),
  seeded('w3', 'Gift', 900, '2026-03-12', ['Wedding'], 'Gifts'),
  seeded('w4', 'Taxi', 600, '2026-03-13', ['Wedding'], 'Travel'),
];

test.describe('Narrow by category and keyword — Tags tab', () => {
  test('should show category chips with amounts, highest first', async ({ page }) => {
    const search = await openSearch(page, EVENT);
    await search.openTagsTab();

    await search.selectTag('Wedding');

    await expect(page.getByTestId('category-facets').getByRole('button')).toHaveText([
      'Stay 12,000',
      'Travel 4,800',
      'Gifts 900',
      '',
    ]);
  });

  test('should narrow by category, update the total and clear on second tap', async ({ page }) => {
    const search = await openSearch(page, EVENT);
    await search.openTagsTab();
    await search.selectTag('Wedding');

    await categoryChip(page, 'Travel 4,800').click();

    await expect(search.rows).toHaveCount(2);
    await expect(search.total).toContainText('Total (2 expenses)');
    await expect(search.total).toContainText('4800.00');

    await categoryChip(page, 'Travel 4,800').click();
    await expect(search.rows).toHaveCount(4);
  });

  test('should expand an optional keyword field from the search icon', async ({ page }) => {
    const search = await openSearch(page, EVENT);
    await search.openTagsTab();
    await search.selectTag('Wedding');
    const field = page.getByLabel('Spent On or keyword (optional)');
    await expect(field).toBeHidden();

    await page.getByRole('button', { name: 'Search within results' }).click();
    await field.fill('train');

    await expect(search.rows).toHaveCount(1);
    await expect(search.total).toContainText('4200.00');
    await expect(categoryChip(page, 'Travel 4,200')).toBeVisible();
  });

  test('should keep the search icon after the chips and offer Clear filters on no match', async ({
    page,
  }) => {
    const search = await openSearch(page, EVENT);
    await search.openTagsTab();
    await search.selectTag('Wedding');
    await page.getByRole('button', { name: 'Search within results' }).click();

    await page.getByLabel('Spent On or keyword (optional)').fill('zzz');

    await expect(search.tagNoResults).toContainText('No expenses match these filters');
    await page.getByRole('button', { name: 'Clear filters' }).click();
    await expect(search.rows).toHaveCount(4);
    await expect(page.getByLabel('Spent On or keyword (optional)')).toBeHidden();
  });

  test('should reset the category when the selected tags change', async ({ page }) => {
    const search = await openSearch(page, [
      ...EVENT,
      seeded('w5', 'Cab', 300, '2026-03-14', ['Wedding', 'Trip'], 'Travel'),
    ]);
    await search.openTagsTab();
    await search.selectTag('Wedding');
    await categoryChip(page, 'Stay 12,000').click();
    await expect(search.rows).toHaveCount(1);

    await search.selectTag('Trip');

    await expect(search.rows).toHaveCount(1);
    await expect(search.total).toContainText('300.00');
  });

  test('should open overflow categories in a bottom sheet behind More…', async ({ page }) => {
    const many = Array.from({ length: 6 }, (_, i) =>
      seeded(`c${i}`, `Item ${i}`, (6 - i) * 100, `2026-03-0${i + 1}`, ['Big'], `Cat${i + 1}`)
    );
    const search = await openSearch(page, many);
    await search.openTagsTab();
    await search.selectTag('Big');

    await expect(categoryChip(page, 'Cat6 100')).toBeHidden();
    await page.getByTestId('category-facets').getByRole('button', { name: 'More…' }).click();
    await expect(page.getByRole('heading', { name: 'Narrow by category' })).toBeVisible();
    await page.getByRole('radio', { name: 'Cat6' }).check();
    await page.getByRole('button', { name: 'Ok', exact: true }).click();

    await expect(search.rows).toHaveCount(1);
    await expect(search.total).toContainText('100.00');
  });
});
