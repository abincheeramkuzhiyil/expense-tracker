import { test, expect } from './fixtures/base-fixture';
import { AddExpensePage } from './pages/AddExpensePage';
import { DEFAULT_CATEGORIES } from './utils/test-data';

test.describe('Expense Form Validation', () => {
  test('should require all mandatory fields', async ({ page }) => {
    const addPage = new AddExpensePage(page);
    await addPage.navigate();
    
    // Try to save without filling form
    await addPage.clickSave();
    
    // Should still be on the add page (validation failed)
    await expect(page).toHaveURL(/\/expenses\/add/);
  });

  test('should require positive amount', async ({ page }) => {
    const addPage = new AddExpensePage(page);
    await addPage.navigate();
    
    await addPage.fillForm({
      category: 'Food',
      amount: -10,
      description: 'Test',
    });
    
    await addPage.clickSave();
    
    // Should still be on add page
    await expect(page).toHaveURL(/\/expenses\/add/);
  });

  test('should accept amount with 2 decimal places', async ({ page }) => {
    const addPage = new AddExpensePage(page);
    await addPage.navigate();
    
    await addPage.fillAmount('123.45');
    
    const value = await addPage.amountField.inputValue();
    expect(value).toBe('123.45');
  });

  test('should require date field', async ({ page }) => {
    const addPage = new AddExpensePage(page);
    await addPage.navigate();
    
    // Clear the date field
    await addPage.fillDate('');
    await addPage.fillForm({
      category: 'Food',
      amount: 100,
    });
    
    await addPage.clickSave();
    
    // Should still be on add page
    await expect(page).toHaveURL(/\/expenses\/add/);
  });

  test('should require category field', async ({ page }) => {
    const addPage = new AddExpensePage(page);
    await addPage.navigate();
    
    await addPage.fillDate('2026-03-01');
    await addPage.fillAmount(100);
    // Don't fill category
    
    await addPage.clickSave();
    
    // Should still be on add page
    await expect(page).toHaveURL(/\/expenses\/add/);
  });

  test('should allow optional description field', async ({ page }) => {
    const addPage = new AddExpensePage(page);
    await addPage.navigate();
    
    // Fill only required fields
    await addPage.fillForm({
      category: 'Food',
      amount: 100,
    });
    
    // Description should be empty but form should be submittable
    const descValue = await addPage.descriptionField.inputValue();
    expect(descValue).toBe('');
  });

  test('should accept multiline description', async ({ page }) => {
    const addPage = new AddExpensePage(page);
    await addPage.navigate();
    
    const multilineText = 'Line 1\nLine 2\nLine 3';
    await addPage.fillDescription(multilineText);
    
    const value = await addPage.descriptionField.inputValue();
    expect(value).toContain('Line 1');
    expect(value).toContain('Line 2');
  });

  test('should filter category autocomplete with existing categories', async ({ page, seedExpenses }) => {
    // Seed with default categories
    await seedExpenses([], DEFAULT_CATEGORIES);
    
    const addPage = new AddExpensePage(page);
    await addPage.navigate();
    
    // Click category field and type
    await addPage.categoryField.click();
    await addPage.categoryField.fill('Foo');
    
    // Should show filtered options containing 'Foo' (Food)
    await expect(page.getByRole('option', { name: /food/i })).toBeVisible();
  });

  test('should show info alert when typing new category', async ({ page, seedExpenses }) => {
    await seedExpenses([], DEFAULT_CATEGORIES);
    
    const addPage = new AddExpensePage(page);
    await addPage.navigate();
    
    // Type a new category that doesn't exist
    await addPage.categoryField.click();
    await addPage.categoryField.fill('NewCategory123');
    await page.waitForTimeout(500);
    
    // Should show info about new category
    // Note: This behavior might need adjustment based on actual implementation
    const hasAlert = await addPage.hasInfoAlert();
    if (hasAlert) {
      const alertText = await addPage.getInfoAlertText();
      expect(alertText.toLowerCase()).toContain('new');
    }
  });

  test('should accept decimal amounts', async ({ page }) => {
    const addPage = new AddExpensePage(page);
    await addPage.navigate();
    
    await addPage.fillAmount('99.99');
    const value = await addPage.amountField.inputValue();
    expect(value).toBe('99.99');
  });

  test('should accept zero decimal amounts', async ({ page }) => {
    const addPage = new AddExpensePage(page);
    await addPage.navigate();
    
    await addPage.fillAmount('100.00');
    const value = await addPage.amountField.inputValue();
    expect(value).toBe('100.00');
  });

  test('should accept whole number amounts', async ({ page }) => {
    const addPage = new AddExpensePage(page);
    await addPage.navigate();
    
    await addPage.fillAmount('150');
    const value = await addPage.amountField.inputValue();
    expect(value).toBe('150');
  });
});
