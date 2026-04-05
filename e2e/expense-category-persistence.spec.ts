import { test, expect } from './fixtures/base-fixture';
import { AddExpensePage } from './pages/AddExpensePage';
import { DEFAULT_CATEGORIES } from './utils/test-data';
import { getLocalStorageItem } from './utils/storage-helper';

test.describe('Expense Category Persistence', () => {
  test('should persist new category to localStorage after form save', async ({ page, seedExpenses }) => {
    await seedExpenses([], DEFAULT_CATEGORIES);
    
    const addPage = new AddExpensePage(page);
    await addPage.navigate();
    
    // Fill form with a new category
    await addPage.fillForm({
      category: 'CustomCategory',
      amount: 100,
      description: 'Test expense',
    });
    
    await addPage.clickSave();
    
    // Wait for navigation
    await page.waitForURL(/\/expenses/);
    
    // Check localStorage for the new category
    const categories = await getLocalStorageItem(page, 'expenseCategories');
    expect(categories).toContain('CustomCategory');
  });

  test('should not duplicate categories in localStorage', async ({ page, seedExpenses }) => {
    await seedExpenses([], DEFAULT_CATEGORIES);
    
    const addPage = new AddExpensePage(page);
    
    // Add the same category twice
    await addPage.navigate();
    await addPage.fillForm({
      category: 'NewCategory',
      amount: 100,
    });
    await addPage.clickSave();
    await page.waitForURL(/\/expenses/);
    
    // Go back and add same category again
    await page.goto('/expenses/add');
    await addPage.fillForm({
      category: 'NewCategory',
      amount: 50,
    });
    await addPage.clickSave();
    await page.waitForURL(/\/expenses/);
    
    // Check that category appears only once
    const categories = await getLocalStorageItem(page, 'expenseCategories');
    const count = categories.filter((cat: string) => cat === 'NewCategory').length;
    expect(count).toBe(1);
  });

  test('should show new category in autocomplete on next add', async ({ page, seedExpenses }) => {
    await seedExpenses([], DEFAULT_CATEGORIES);
    
    const addPage = new AddExpensePage(page);
    
    // First, add a new category
    await addPage.navigate();
    await addPage.fillForm({
      category: 'Groceries',
      amount: 200,
    });
    await addPage.clickSave();
    await page.waitForURL(/\/expenses/);
    
    // Navigate back to add page
    await page.goto('/expenses/add');
    
    // Open category dropdown
    await addPage.categoryField.click();
    await page.waitForTimeout(300);
    
    // New category should appear in options
    // Type part of it to filter
    await addPage.categoryField.fill('Groc');
    await expect(page.getByRole('option', { name: /groceries/i })).toBeVisible();
  });

  test('should merge new categories with defaults', async ({ page, seedExpenses }) => {
    await seedExpenses([], DEFAULT_CATEGORIES);
    
    const addPage = new AddExpensePage(page);
    await addPage.navigate();
    
    // Add a new category
    await addPage.fillForm({
      category: 'Investment',
      amount: 5000,
    });
    
    await addPage.clickSave();
    await page.waitForURL(/\/expenses/);
    
    // Get categories from localStorage
    const categories = await getLocalStorageItem(page, 'expenseCategories');
    
    // Should contain both defaults and new category
    expect(categories).toContain('Food'); // Default
    expect(categories).toContain('Transport'); // Default
    expect(categories).toContain('Investment'); // New
  });

  test('should load categories from localStorage on page load', async ({ page, seedExpenses }) => {
    const customCategories = [...DEFAULT_CATEGORIES, 'CustomCat1', 'CustomCat2'];
    await seedExpenses([], customCategories);
    
    const addPage = new AddExpensePage(page);
    await addPage.navigate();
    
    // Open category dropdown
    await addPage.categoryField.click();
    await page.waitForTimeout(300);
    
    // Custom categories should be available
    await addPage.categoryField.fill('Custom');
    await expect(page.getByRole('option', { name: /customcat1/i })).toBeVisible();
  });

  test('should handle empty categories array in localStorage', async ({ page }) => {
    const addPage = new AddExpensePage(page);
    await addPage.navigate();
    
    // With no seeded categories, should fall back to defaults
    await addPage.categoryField.click();
    await page.waitForTimeout(300);
    
    // Should still have default categories available
    await addPage.categoryField.fill('Foo');
    await expect(page.getByRole('option', { name: /food/i })).toBeVisible();
  });
});
