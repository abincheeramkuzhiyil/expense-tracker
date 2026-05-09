import { test, expect } from './fixtures/base-fixture';
import { AddExpensePage } from './pages/AddExpensePage';
import { ExpensesPage } from './pages/ExpensesPage';
import { getLocalStorageItem, seedApprovedExpenses } from './utils/storage-helper';

/** Fixed test date to keep tests deterministic */
const TEST_DATE = '2026-05-09';

test.describe('Add Expense — Full Save Flow', () => {
  test('should save a new expense and redirect to expenses page', async ({ page }) => {
    const addPage = new AddExpensePage(page);
    await addPage.navigate({ view: 'day', date: TEST_DATE });

    await addPage.fillForm({
      date: TEST_DATE,
      spentOn: 'Coffee',
      category: 'Food',
      amount: 80,
      description: 'Morning coffee',
    });

    await addPage.clickSave();

    await expect(page).toHaveURL(/\/expenses/);
  });

  test('should persist saved expense to localStorage', async ({ page }) => {
    const addPage = new AddExpensePage(page);
    await addPage.navigate({ view: 'day', date: TEST_DATE });

    await addPage.fillForm({
      date: TEST_DATE,
      spentOn: 'Lunch',
      category: 'Food',
      amount: 150,
    });

    await addPage.clickSave();
    await page.waitForURL(/\/expenses/);

    // Verify it's in the year/month bucket
    const yearData = await getLocalStorageItem(page, '2026');
    const mayExpenses = yearData?.['5']; // May is month 5
    expect(mayExpenses).toBeDefined();
    const saved = mayExpenses.find((e: { spentOn: string }) => e.spentOn === 'Lunch');
    expect(saved).toBeDefined();
    expect(saved.amount).toBe(150);
  });

  test('should display saved expense in the day view after saving', async ({ page }) => {
    const addPage = new AddExpensePage(page);
    await addPage.navigate({ view: 'day', date: TEST_DATE });

    await addPage.fillForm({
      date: TEST_DATE,
      spentOn: 'Dinner',
      category: 'Food',
      amount: 300,
    });

    await addPage.clickSave();
    await page.waitForURL(/\/expenses/);

    // Navigate to the day view for the test date
    const expensesPage = new ExpensesPage(page);
    await expensesPage.navigate({ view: 'day', date: TEST_DATE });

    await expect(page.getByText('Dinner')).toBeVisible();
  });

  test('should update the day total after saving an expense', async ({ page }) => {
    const addPage = new AddExpensePage(page);
    await addPage.navigate({ view: 'day', date: TEST_DATE });

    await addPage.fillForm({
      date: TEST_DATE,
      spentOn: 'Fuel',
      category: 'Travel',
      amount: 500,
    });

    await addPage.clickSave();
    await page.waitForURL(/\/expenses/);

    const expensesPage = new ExpensesPage(page);
    await expensesPage.navigate({ view: 'day', date: TEST_DATE });

    // Total should reflect the saved expense
    await expect(page.getByText('500.00')).toBeVisible();
  });

  test('should preserve view mode and date in redirect URL after save', async ({ page }) => {
    const addPage = new AddExpensePage(page);
    await addPage.navigate({ view: 'month', date: '2026-03-15' });

    await addPage.fillForm({
      // Month view defaults date to first of month
      spentOn: 'Groceries',
      category: 'Food',
      amount: 200,
    });

    await addPage.clickSave();

    // Should redirect back to expenses with the month view
    await expect(page).toHaveURL(/view=month/);
  });

  test('should add a new category to localStorage after saving with a new category', async ({ page }) => {
    const addPage = new AddExpensePage(page);
    await addPage.navigate({ view: 'day', date: TEST_DATE });

    await addPage.fillForm({
      date: TEST_DATE,
      spentOn: 'UniqueItem123',
      category: 'UniqueCategory123',
      amount: 999,
    });

    await addPage.clickSave();
    await page.waitForURL(/\/expenses/);

    const categories = await getLocalStorageItem(page, 'expenseCategories');
    expect(categories).toContain('UniqueCategory123');
  });

  test('should save expense with source set to manual', async ({ page }) => {
    const addPage = new AddExpensePage(page);
    await addPage.navigate({ view: 'day', date: TEST_DATE });

    await addPage.fillForm({
      date: TEST_DATE,
      spentOn: 'Books',
      category: 'Education',
      amount: 450,
    });

    await addPage.clickSave();
    await page.waitForURL(/\/expenses/);

    const yearData = await getLocalStorageItem(page, '2026');
    const mayExpenses = yearData?.['5'];
    const saved = mayExpenses?.find((e: { spentOn: string }) => e.spentOn === 'Books');
    expect(saved?.source).toBe('manual');
  });

  test('should accumulate multiple expenses on the same day', async ({ page }) => {
    // Add first expense
    const addPage = new AddExpensePage(page);
    await addPage.navigate({ view: 'day', date: TEST_DATE });
    await addPage.fillForm({ date: TEST_DATE, spentOn: 'First', category: 'Food', amount: 100 });
    await addPage.clickSave();
    await page.waitForURL(/\/expenses/);

    // Add second expense
    await addPage.navigate({ view: 'day', date: TEST_DATE });
    await addPage.fillForm({ date: TEST_DATE, spentOn: 'Second', category: 'Food', amount: 200 });
    await addPage.clickSave();
    await page.waitForURL(/\/expenses/);

    // Day view should show both
    const expensesPage = new ExpensesPage(page);
    await expensesPage.navigate({ view: 'day', date: TEST_DATE });

    await expect(page.getByText('First')).toBeVisible();
    await expect(page.getByText('Second')).toBeVisible();
    await expect(page.getByText('300.00')).toBeVisible();
  });
});

test.describe('Add Expense — SMS Web Share Target Pre-fill', () => {
  test('should pre-fill amount from shared HDFC SMS', async ({ page }) => {
    // Simulate Web Share Target URL params
    const sms = 'Dear Customer, INR 1,250.00 debited from A/c XX1234 on 21-Apr-26 to AMAZON. Avl Bal: INR 45,320.00. -HDFC Bank';
    await page.goto(`/expenses/add?view=day&date=${TEST_DATE}&text=${encodeURIComponent(sms)}`);

    // The form should be pre-filled with amount from SMS
    await expect(page.getByLabel(/amount/i)).toHaveValue('1250');
  });

  test('should pre-fill description/merchant from shared SMS', async ({ page }) => {
    const sms = 'Dear Customer, INR 1,250.00 debited from A/c XX1234 on 21-Apr-26 to AMAZON. Avl Bal: INR 45,320.00. -HDFC Bank';
    await page.goto(`/expenses/add?view=day&date=${TEST_DATE}&text=${encodeURIComponent(sms)}`);

    // Description or spentOn should contain merchant name
    await expect(page.getByRole('combobox', { name: /spent on/i })).toHaveValue(/amazon/i);
  });

  test('should show success parse alert when SMS is parsed successfully', async ({ page }) => {
    const sms = 'Dear Customer, INR 500.00 debited from A/c XX1234 on 09-May-26 to SWIGGY. -HDFC Bank';
    await page.goto(`/expenses/add?view=day&date=${TEST_DATE}&text=${encodeURIComponent(sms)}`);

    await expect(page.getByRole('alert').filter({ hasText: /parsed|success|info/i })).toBeVisible();
  });

  test('should show failure alert when SMS cannot be parsed', async ({ page }) => {
    const sms = 'Hello, this is an unrelated message with no financial data.';
    await page.goto(`/expenses/add?view=day&date=${TEST_DATE}&text=${encodeURIComponent(sms)}`);

    await expect(page.getByRole('alert').filter({ hasText: /couldn|parse|invalid|error/i })).toBeVisible();
  });
});

test.describe('Add Expense — Edit & Delete from Day View', () => {
  const SEEDED_EXPENSE = {
    id: 'edit-del-1',
    amount: 750,
    spentOn: 'Shopping',
    category: 'Shopping',
    date: TEST_DATE,
    description: 'Weekend shopping',
    source: 'manual',
    createdAt: '2026-05-09T10:00:00.000Z',
    updatedAt: '2026-05-09T10:00:00.000Z',
  };

  test('should update total when an expense amount is edited', async ({ page }) => {
    await seedApprovedExpenses(page, [SEEDED_EXPENSE]);

    const expensesPage = new ExpensesPage(page);
    await expensesPage.navigate({ view: 'day', date: TEST_DATE });

    await expensesPage.clickEditOnAccordion(0);
    await expect(page.getByRole('button', { name: /save changes/i })).toBeVisible();

    await page.getByLabel(/amount/i).fill('999');
    await page.getByRole('button', { name: /save changes/i }).click();

    await expect(page.getByText('999.00').first()).toBeVisible();
  });

  test('should remove expense from list when deleted', async ({ page }) => {
    await seedApprovedExpenses(page, [SEEDED_EXPENSE]);

    const expensesPage = new ExpensesPage(page);
    await expensesPage.navigate({ view: 'day', date: TEST_DATE });

    await expensesPage.clickDeleteOnAccordion(0);
    await expensesPage.confirmDelete();

    await expect(expensesPage.getExpenseAccordions()).toHaveCount(0);
  });

  test('should persist expense deletion to localStorage', async ({ page }) => {
    await seedApprovedExpenses(page, [SEEDED_EXPENSE]);

    const expensesPage = new ExpensesPage(page);
    await expensesPage.navigate({ view: 'day', date: TEST_DATE });

    await expensesPage.clickDeleteOnAccordion(0);
    await expensesPage.confirmDelete();

    const yearData = await getLocalStorageItem(page, '2026');
    const mayExpenses = yearData?.['5'] ?? [];
    const found = mayExpenses.find((e: { id: string }) => e.id === 'edit-del-1');
    expect(found).toBeUndefined();
  });
});
