import { test, expect } from './fixtures/base-fixture';
import { ExpensesPage } from './pages/ExpensesPage';
import { seedPendingItems } from './utils/storage-helper';

const NOW = '2026-05-09T10:00:00.000Z';

/** A set of pending expenses used across multiple tests */
const PENDING_ITEMS = [
  {
    id: 'pending-1',
    amount: 1250,
    spentOn: 'Amazon',
    category: 'Shopping',
    date: '2026-05-09',
    description: 'INR 1,250.00 debited from A/c XX1234',
    source: 'sms',
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'pending-2',
    amount: 300,
    spentOn: 'Swiggy',
    category: 'Food',
    date: '2026-05-08',
    description: 'Food order',
    source: 'sms',
    createdAt: NOW,
    updatedAt: NOW,
  },
];

const SINGLE_PENDING = [PENDING_ITEMS[0]];

test.describe('Pending Expense Review — Banner', () => {
  test('should show pending banner when there are pending expenses', async ({ page }) => {
    await seedPendingItems(page, SINGLE_PENDING);

    const expensesPage = new ExpensesPage(page);
    await expensesPage.navigate({ view: 'day', date: '2026-05-09' });

    await expect(expensesPage.pendingBanner).toBeVisible();
    await expect(expensesPage.pendingBanner).toContainText('1 expense to review');
  });

  test('should show plural form for multiple pending expenses', async ({ page }) => {
    await seedPendingItems(page, PENDING_ITEMS);

    const expensesPage = new ExpensesPage(page);
    await expensesPage.navigate({ view: 'day', date: '2026-05-09' });

    await expect(expensesPage.pendingBanner).toContainText('2 expenses to review');
  });

  test('should not show banner when there are no pending expenses', async ({ page }) => {
    const expensesPage = new ExpensesPage(page);
    await expensesPage.navigate({ view: 'day', date: '2026-05-09' });

    await expect(expensesPage.pendingBanner).not.toBeVisible();
  });

  test('should dismiss the banner when clicking the dismiss button', async ({ page }) => {
    await seedPendingItems(page, SINGLE_PENDING);

    const expensesPage = new ExpensesPage(page);
    await expensesPage.navigate({ view: 'day', date: '2026-05-09' });

    await expensesPage.dismissPendingBanner();

    await expect(expensesPage.pendingBanner).not.toBeVisible();
  });

  test('should open review modal when clicking Review button in banner', async ({ page }) => {
    await seedPendingItems(page, SINGLE_PENDING);

    const expensesPage = new ExpensesPage(page);
    await expensesPage.navigate({ view: 'day', date: '2026-05-09' });

    await expensesPage.openPendingReview();

    // Modal should open with "Pending Review" title
    await expect(page.getByText('Pending Review')).toBeVisible();
  });

  test('should auto-open review modal when ?review=1 param is present', async ({ page }) => {
    await seedPendingItems(page, SINGLE_PENDING);

    await page.goto('/expenses?view=day&date=2026-05-09&review=1');

    await expect(page.getByText('Pending Review')).toBeVisible();
  });
});

test.describe('Pending Expense Review — Modal Actions', () => {
  test('should display all pending expense cards in the modal', async ({ page }) => {
    await seedPendingItems(page, PENDING_ITEMS);

    const expensesPage = new ExpensesPage(page);
    await expensesPage.navigate({ view: 'day', date: '2026-05-09' });
    await expensesPage.openPendingReview();

    // Both pending items should appear (matched by amount or spentOn)
    await expect(page.getByText('Amazon')).toBeVisible();
    await expect(page.getByText('Swiggy')).toBeVisible();
  });

  test('should show pending count in the modal', async ({ page }) => {
    await seedPendingItems(page, PENDING_ITEMS);

    const expensesPage = new ExpensesPage(page);
    await expensesPage.navigate({ view: 'day', date: '2026-05-09' });
    await expensesPage.openPendingReview();

    await expect(page.getByText(/2 expenses pending/i)).toBeVisible();
  });

  test('should approve an individual expense and show snackbar', async ({ page }) => {
    await seedPendingItems(page, SINGLE_PENDING);

    const expensesPage = new ExpensesPage(page);
    await expensesPage.navigate({ view: 'day', date: '2026-05-09' });
    await expensesPage.openPendingReview();

    // Click the approve button for the first pending expense
    await page.getByRole('button', { name: /approve/i }).first().click();

    await expect(page.getByText(/approved/i)).toBeVisible();
  });

  test('should remove expense card from list after approving', async ({ page }) => {
    await seedPendingItems(page, SINGLE_PENDING);

    const expensesPage = new ExpensesPage(page);
    await expensesPage.navigate({ view: 'day', date: '2026-05-09' });
    await expensesPage.openPendingReview();

    await page.getByRole('button', { name: /approve/i }).first().click();

    // Amazon card should be gone from the pending review list; empty state should appear
    await expect(page.getByText(/no pending/i)).toBeVisible();
  });

  test('should reject an expense and show undo snackbar', async ({ page }) => {
    await seedPendingItems(page, SINGLE_PENDING);

    const expensesPage = new ExpensesPage(page);
    await expensesPage.navigate({ view: 'day', date: '2026-05-09' });
    await expensesPage.openPendingReview();

    await page.getByRole('button', { name: /reject/i }).first().click();

    await expect(page.getByText(/rejected/i)).toBeVisible();
  });

  test('should show Approve All button when multiple pending items exist', async ({ page }) => {
    await seedPendingItems(page, PENDING_ITEMS);

    const expensesPage = new ExpensesPage(page);
    await expensesPage.navigate({ view: 'day', date: '2026-05-09' });
    await expensesPage.openPendingReview();

    await expect(page.getByRole('button', { name: /approve all/i })).toBeVisible();
  });

  test('should not show Approve All button for a single pending item', async ({ page }) => {
    await seedPendingItems(page, SINGLE_PENDING);

    const expensesPage = new ExpensesPage(page);
    await expensesPage.navigate({ view: 'day', date: '2026-05-09' });
    await expensesPage.openPendingReview();

    await expect(page.getByRole('button', { name: /approve all/i })).not.toBeVisible();
  });

  test('should approve all expenses (small batch — no confirmation dialog)', async ({ page }) => {
    await seedPendingItems(page, PENDING_ITEMS);

    const expensesPage = new ExpensesPage(page);
    await expensesPage.navigate({ view: 'day', date: '2026-05-09' });
    await expensesPage.openPendingReview();

    await page.getByRole('button', { name: /approve all/i }).click();

    // No confirmation dialog for ≤ 5 items; snackbar should appear
    await expect(page.getByText(/approved 2 expenses/i)).toBeVisible();
  });

  test('should show empty state after all expenses are handled', async ({ page }) => {
    await seedPendingItems(page, SINGLE_PENDING);

    const expensesPage = new ExpensesPage(page);
    await expensesPage.navigate({ view: 'day', date: '2026-05-09' });
    await expensesPage.openPendingReview();

    await page.getByRole('button', { name: /approve/i }).first().click();

    // Empty state message (catches up state)
    await expect(page.getByText(/all caught up/i)).toBeVisible();
  });

  test('should open edit sheet when clicking Edit on a pending expense', async ({ page }) => {
    await seedPendingItems(page, SINGLE_PENDING);

    const expensesPage = new ExpensesPage(page);
    await expensesPage.navigate({ view: 'day', date: '2026-05-09' });
    await expensesPage.openPendingReview();

    await page.getByRole('button', { name: /edit/i }).first().click();

    // Edit bottom sheet should appear (contains the form)
    await expect(page.getByText('Edit Expense')).toBeVisible();
    await expect(page.getByLabel(/amount/i)).toBeVisible();
  });

  test('should close the pending review modal', async ({ page }) => {
    await seedPendingItems(page, SINGLE_PENDING);

    const expensesPage = new ExpensesPage(page);
    await expensesPage.navigate({ view: 'day', date: '2026-05-09' });
    await expensesPage.openPendingReview();

    // Close via Escape or close button
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);

    await expect(page.getByText('Pending Review')).not.toBeVisible();
  });
});

test.describe('Pending Expense Review — Approve All Confirmation', () => {
  /** Build 6 pending items to trigger the confirmation dialog (threshold is 5). */
  function buildManyPendingItems(count: number) {
    return Array.from({ length: count }, (_, i) => ({
      id: `pending-bulk-${i}`,
      amount: 100 + i,
      spentOn: `Item ${i}`,
      category: 'Shopping',
      date: '2026-05-09',
      description: `Expense ${i}`,
      source: 'sms' as const,
      createdAt: NOW,
      updatedAt: NOW,
    }));
  }

  test('should show confirmation dialog when approving more than 5 at once', async ({ page }) => {
    await seedPendingItems(page, buildManyPendingItems(6));

    const expensesPage = new ExpensesPage(page);
    await expensesPage.navigate({ view: 'day', date: '2026-05-09' });
    await expensesPage.openPendingReview();

    await page.getByRole('button', { name: /approve all/i }).click();

    await expect(page.getByText(/approve all pending expenses/i)).toBeVisible();
  });

  test('should approve all after confirming in the dialog', async ({ page }) => {
    await seedPendingItems(page, buildManyPendingItems(6));

    const expensesPage = new ExpensesPage(page);
    await expensesPage.navigate({ view: 'day', date: '2026-05-09' });
    await expensesPage.openPendingReview();

    await page.getByRole('button', { name: /approve all/i }).click();
    // Confirm in dialog
    await page.getByRole('button', { name: /approve all/i }).last().click();

    await expect(page.getByText(/approved 6 expenses/i)).toBeVisible();
  });

  test('should cancel Approve All confirmation and keep expenses', async ({ page }) => {
    await seedPendingItems(page, buildManyPendingItems(6));

    const expensesPage = new ExpensesPage(page);
    await expensesPage.navigate({ view: 'day', date: '2026-05-09' });
    await expensesPage.openPendingReview();

    await page.getByRole('button', { name: /approve all/i }).click();
    await page.getByRole('button', { name: /^cancel$/i }).click();

    // Expenses should still be listed
    await expect(page.getByText('Item 0')).toBeVisible();
  });
});
