import { test, expect } from './fixtures/base-fixture';
import { ExpenseSearchPage } from './pages/ExpenseSearchPage';
import { seedApprovedExpenses } from './utils/storage-helper';

const EXPENSES = [
  {
    id: 'k1',
    spentOn: 'Train',
    category: 'Other',
    amount: 100,
    date: '2026-03-10',
    description: '',
    tags: ['Trip'],
    source: 'manual',
    createdAt: '2026-03-10T10:00:00.000Z',
    updatedAt: '2026-03-10T10:00:00.000Z',
  },
];

async function openSearch(page: import('@playwright/test').Page) {
  await seedApprovedExpenses(page, EXPENSES);
  await page.goto('/expenses');
  const search = new ExpenseSearchPage(page);
  await search.open();
  return search;
}

test.describe('Search — keyboard on touch devices', () => {
  test.use({ viewport: { width: 412, height: 915 }, hasTouch: true, isMobile: true });

  test('should close the keyboard after picking a Spent On suggestion', async ({ page }) => {
    const search = await openSearch(page);
    await search.input.click();
    await expect(search.input).toBeFocused();

    await search.selectSuggestion('Train', /^Train\s*\d+$/);

    await expect(search.rows).toHaveCount(1);
    await expect(search.input).not.toBeFocused();
  });

  test('should close the keyboard after searching all text', async ({ page }) => {
    const search = await openSearch(page);

    await search.selectSuggestion('Train', /^Search "Train" in all text$/);

    await expect(search.rows).toHaveCount(1);
    await expect(search.input).not.toBeFocused();
  });

  test('should close the keyboard after picking a tag', async ({ page }) => {
    const search = await openSearch(page);
    await search.openTagsTab();

    await search.selectTag('Trip');

    await expect(search.rows).toHaveCount(1);
    await expect(search.tagInput).not.toBeFocused();
  });

  test('should keep the keyboard open while typing', async ({ page }) => {
    const search = await openSearch(page);

    await search.type('Tra');

    await expect(search.input).toBeFocused();
  });
});

test.describe('Search — focus on desktop', () => {
  test('should keep focus in the keyword field after picking a suggestion', async ({ page }) => {
    const search = await openSearch(page);

    await search.selectSuggestion('Train', /^Train\s*\d+$/);

    await expect(search.rows).toHaveCount(1);
    await expect(search.input).toBeFocused();
  });

  test('should keep focus in the tag field after picking a tag', async ({ page }) => {
    const search = await openSearch(page);
    await search.openTagsTab();

    await search.selectTag('Trip');

    await expect(search.rows).toHaveCount(1);
    await expect(search.tagInput).toBeFocused();
  });
});
