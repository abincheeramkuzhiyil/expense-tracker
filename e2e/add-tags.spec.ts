import { Page } from '@playwright/test';
import { test, expect } from './fixtures/base-fixture';
import { AddExpensePage } from './pages/AddExpensePage';
import { ImportPage } from './pages/ImportPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { getLocalStorageItem, seedApprovedExpenses } from './utils/storage-helper';

const TEST_DATE = '2026-05-09';

/** Seeds the tag lists. Registered after the base fixture's storage clear, so it runs after it. */
async function seedTags(page: Page, tags: string[], recent: string[]): Promise<void> {
  await page.addInitScript(
    (data) => {
      localStorage.setItem('expenseTags', JSON.stringify(data.tags));
      localStorage.setItem('expenseTagsRecent', JSON.stringify(data.recent));
    },
    { tags, recent }
  );
}

test.describe('Add Tags — Add Expense form', () => {
  test('should show only the Add tag button when no tags are selected', async ({ page }) => {
    const addPage = new AddExpensePage(page);
    await addPage.navigate({ view: 'day', date: TEST_DATE });

    await expect(addPage.addTagButton).toBeVisible();
    await expect(addPage.tagPills).toHaveCount(0);
  });

  test('should open the Add Tags sheet with help text', async ({ page }) => {
    const addPage = new AddExpensePage(page);
    await addPage.navigate({ view: 'day', date: TEST_DATE });
    await addPage.openTagSheet();

    await expect(
      page.getByText(/Tags group your expenses across categories, for example by event, trip or person/)
    ).toBeVisible();
    await expect(page.getByText(/You can add up to 10 tags per expense/)).toBeVisible();
    await expect(page.getByText('No tags selected')).toBeVisible();
  });

  test('should show the new-tag note once a brand-new tag is selected', async ({ page }) => {
    const addPage = new AddExpensePage(page);
    await addPage.navigate({ view: 'day', date: TEST_DATE });
    await addPage.openTagSheet();

    const note = page.getByText('Note: This will be added as a new Tag when you save the expense');
    await addPage.tagInput.fill('Trip');
    await expect(page.getByRole('option', { name: /Create "Trip"/ })).toBeVisible();
    await expect(note).toBeHidden();

    await page.getByRole('option').first().click();
    await expect(note).toBeVisible();
  });

  test('should show tags as pills on the form after tapping Ok', async ({ page }) => {
    const addPage = new AddExpensePage(page);
    await addPage.navigate({ view: 'day', date: TEST_DATE });

    await addPage.addTags(['Trip', 'Gifts']);

    await expect(addPage.tagPills).toHaveCount(2);
    await expect(addPage.tagPills.filter({ hasText: 'Trip' })).toBeVisible();
    await expect(addPage.tagPills.filter({ hasText: 'Gifts' })).toBeVisible();
  });

  test('should discard sheet changes when the sheet is closed without Ok', async ({ page }) => {
    const addPage = new AddExpensePage(page);
    await addPage.navigate({ view: 'day', date: TEST_DATE });

    await addPage.openTagSheet();
    await addPage.addTagInSheet('Trip');
    await page.getByRole('button', { name: 'Close' }).click();
    await addPage.tagSheetHeading.waitFor({ state: 'hidden' });

    await expect(addPage.tagPills).toHaveCount(0);
  });

  test('should remove a tag from the form with its pill delete button', async ({ page }) => {
    const addPage = new AddExpensePage(page);
    await addPage.navigate({ view: 'day', date: TEST_DATE });
    await addPage.addTags(['Trip', 'Gifts']);

    await addPage.tagPills.filter({ hasText: 'Trip' }).getByTestId('CancelIcon').click();

    await expect(addPage.tagPills).toHaveCount(1);
    await expect(addPage.tagPills.filter({ hasText: 'Gifts' })).toBeVisible();
  });

  test('should reject a tag longer than 30 characters', async ({ page }) => {
    const addPage = new AddExpensePage(page);
    await addPage.navigate({ view: 'day', date: TEST_DATE });
    await addPage.openTagSheet();

    await addPage.tagInput.fill('x'.repeat(31));

    await expect(page.getByText('A tag can be at most 30 characters.')).toBeVisible();
    await expect(page.getByRole('option')).toHaveCount(0);
  });

  test('should allow at most 10 tags per expense', async ({ page }) => {
    const addPage = new AddExpensePage(page);
    await addPage.navigate({ view: 'day', date: TEST_DATE });
    await addPage.openTagSheet();

    for (let i = 1; i <= 10; i++) {
      await addPage.addTagInSheet(`Tag ${i}`);
    }

    await expect(page.getByText('Selected (10/10)')).toBeVisible();
    await expect(page.getByText('You can add up to 10 tags to an expense.')).toBeVisible();
    await expect(addPage.tagInput).toBeDisabled();
  });
});

test.describe('Add Tags — persistence', () => {
  test('should save tags with the expense and add them to the tag list', async ({ page }) => {
    const addPage = new AddExpensePage(page);
    await addPage.navigate({ view: 'day', date: TEST_DATE });

    await addPage.addTags(['Trip', 'Gifts']);
    await addPage.fillForm({ date: TEST_DATE, spentOn: 'Lunch', amount: 150 });
    await addPage.clickSave();
    await page.waitForURL(/\/expenses/);

    const yearData = await getLocalStorageItem(page, '2026');
    const saved = yearData['5'].find((e: { spentOn: string }) => e.spentOn === 'Lunch');
    expect(saved.tags).toEqual(['Trip', 'Gifts']);

    const tags = await getLocalStorageItem(page, 'expenseTags');
    expect(tags.sort()).toEqual(['Gifts', 'Trip']);
    const recent = await getLocalStorageItem(page, 'expenseTagsRecent');
    expect(recent).toEqual(['Trip', 'Gifts']);
  });

  test('should not persist a new tag until the expense is saved', async ({ page }) => {
    const addPage = new AddExpensePage(page);
    await addPage.navigate({ view: 'day', date: TEST_DATE });

    await addPage.addTags(['Trip']);

    expect(await getLocalStorageItem(page, 'expenseTags')).toBeNull();
  });

  test('should not store a tags field on an expense saved without tags', async ({ page }) => {
    const addPage = new AddExpensePage(page);
    await addPage.navigate({ view: 'day', date: TEST_DATE });

    await addPage.fillForm({ date: TEST_DATE, spentOn: 'Lunch', amount: 90 });
    await addPage.clickSave();
    await page.waitForURL(/\/expenses/);

    const yearData = await getLocalStorageItem(page, '2026');
    expect(yearData['5'][0].tags).toBeUndefined();
  });

  test('should offer saved tags alphabetically and reuse their spelling', async ({ page }) => {
    await seedTags(page, ['Zoo', 'Alpha'], []);
    const addPage = new AddExpensePage(page);
    await addPage.navigate({ view: 'day', date: TEST_DATE });
    await addPage.openTagSheet();
    await addPage.tagInput.click();
    const options = await page.getByRole('option').allTextContents();
    expect(options).toEqual(['Alpha', 'Zoo']);

    await addPage.tagInput.fill('zoo');
    await page.getByRole('option', { name: 'Zoo', exact: true }).click();
    await expect(page.getByText('Selected (1/10)')).toBeVisible();
    await expect(page.getByTestId('tag-pill').filter({ hasText: 'Zoo' })).toBeVisible();
  });

  test('should add a tag in one tap from the recently used chips', async ({ page }) => {
    await seedTags(page, ['Trip'], ['Trip']);
    const addPage = new AddExpensePage(page);
    await addPage.navigate({ view: 'day', date: TEST_DATE });
    await addPage.openTagSheet();
    await page.getByText('Recently used').waitFor();
    await page.getByRole('button', { name: 'Trip' }).click();

    await expect(page.getByText('Selected (1/10)')).toBeVisible();
  });
});

test.describe('Add Tags — expense list and edit', () => {
  const seeded = {
    id: 'tagged-1',
    spentOn: 'Dinner',
    category: 'Food',
    amount: 300,
    date: TEST_DATE,
    description: 'Dinner out',
    tags: ['Trip', 'Gifts'],
    source: 'manual',
    createdAt: '2026-05-09T10:00:00.000Z',
    updatedAt: '2026-05-09T10:00:00.000Z',
  };

  test('should show tag pills in the expense list details', async ({ page }) => {
    await seedApprovedExpenses(page, [seeded]);
    const expensesPage = new ExpensesPage(page);
    await expensesPage.navigate({ view: 'day', date: TEST_DATE });

    await expensesPage.expandAccordionAt(0);

    const pills = expensesPage.getExpenseAccordions().nth(0).getByTestId('tag-pill');
    await expect(pills).toHaveCount(2);
    await expect(pills.filter({ hasText: 'Trip' })).toBeVisible();
  });

  test('should pre-fill tags on edit and save the changed tags', async ({ page }) => {
    await seedApprovedExpenses(page, [seeded]);
    const expensesPage = new ExpensesPage(page);
    await expensesPage.navigate({ view: 'day', date: TEST_DATE });

    await expensesPage.clickEditOnAccordion(0);
    const addPage = new AddExpensePage(page);
    await expect(addPage.tagPills).toHaveCount(2);

    await addPage.tagPills.filter({ hasText: 'Gifts' }).getByTestId('CancelIcon').click();
    await addPage.addTags(['Work']);
    await page.getByRole('button', { name: 'Save Changes' }).click();

    await expect
      .poll(async () => (await getLocalStorageItem(page, '2026'))?.['5']?.[0]?.tags)
      .toEqual(['Trip', 'Work']);
    expect((await getLocalStorageItem(page, 'expenseTags')).sort()).toEqual(['Trip', 'Work']);
  });
});

test.describe('Add Tags — import', () => {
  test('should import tag keys and tags used by imported expenses', async ({ page }) => {
    const importPage = new ImportPage(page);
    await importPage.navigate();

    await importPage.uploadJsonFile('tags.json', {
      expenseTags: ['Trip'],
      expenseTagsRecent: ['Trip'],
      expenseYearIndex: ['2025'],
      '2025': {
        '5': [
          {
            id: 'imp-tag-1',
            amount: 10,
            spentOn: 'Lunch',
            category: 'Food',
            date: '2025-05-03',
            description: '',
            tags: ['Gifts'],
            source: 'manual',
            createdAt: '2025-05-03T10:00:00.000Z',
            updatedAt: '2025-05-03T10:00:00.000Z',
          },
        ],
      },
    });
    await importPage.importButton.click();

    await expect
      .poll(async () => (await getLocalStorageItem(page, 'expenseTags'))?.slice().sort())
      .toEqual(['Gifts', 'Trip']);
    expect(await getLocalStorageItem(page, 'expenseTagsRecent')).toEqual(['Trip']);
  });
});
