import { test, expect } from './fixtures/base-fixture';
import { HomePage } from './pages/HomePage';
import { ExpensesPage } from './pages/ExpensesPage';
import { NavigationDrawer } from './pages/NavigationDrawer';
import { SAMPLE_EXPENSES } from './utils/test-data';

test.describe('Responsive Design', () => {
  test('should show drawer menu button on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    
    const homePage = new HomePage(page);
    await homePage.navigate();
    
    await expect(homePage.menuButton).toBeVisible();
  });

  test('should display expenses list on mobile viewport', async ({ page, seedExpenses }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await seedExpenses(SAMPLE_EXPENSES);
    
    const expensesPage = new ExpensesPage(page);
    await expensesPage.navigate({ view: 'day', date: '2026-03-01' });
    
    await page.waitForTimeout(500);
    
    const count = await expensesPage.getExpenseCount();
    expect(count).toBeGreaterThan(0);
    
    // Expense list should be visible
    await expect(expensesPage.expenseList).toBeVisible();
  });

  test('should be usable on tablet viewport', async ({ page, seedExpenses }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    await seedExpenses(SAMPLE_EXPENSES);
    
    const expensesPage = new ExpensesPage(page);
    await expensesPage.navigate();
    
    // Should be able to change view mode
    await expensesPage.selectViewMode('month');
    await page.waitForTimeout(500);
    
    const urlParams = expensesPage.getUrlParams();
    expect(urlParams.get('view')).toBe('month');
  });

  test('should display full navigation on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 }); // Desktop
    
    const homePage = new HomePage(page);
    await homePage.navigate();
    
    // Navigation should be visible without menu button on large screens
    // or menu button is visible - depends on implementation
    const nav = new NavigationDrawer(page);
    
    // Either drawer is visible by default or menu button exists
    const drawerVisible = await nav.drawer.isVisible();
    const menuVisible = await homePage.menuButton.isVisible();
    
    expect(drawerVisible || menuVisible).toBe(true);
  });

  test('should render expense list properly on desktop', async ({ page, seedExpenses }) => {
    await page.setViewportSize({ width: 1920, height: 1080 }); // Desktop
    await seedExpenses(SAMPLE_EXPENSES);
    
    const expensesPage = new ExpensesPage(page);
    await expensesPage.navigate({ view: 'month', date: '2026-02-01' });
    
    await page.waitForTimeout(500);
    
    // All UI elements should be visible
    await expect(expensesPage.viewModeSelect).toBeVisible();
    await expect(expensesPage.prevButton).toBeVisible();
    await expect(expensesPage.nextButton).toBeVisible();
    await expect(expensesPage.todayButton).toBeVisible();
    await expect(expensesPage.addFab).toBeVisible();
    await expect(expensesPage.totalDisplay).toBeVisible();
  });

  test('should handle small mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 }); // iPhone SE (old)
    
    const homePage = new HomePage(page);
    await homePage.navigate();
    
    // Should still be usable
    await expect(homePage.greeting).toBeVisible();
    await expect(homePage.menuButton).toBeVisible();
  });

  test('should handle viewport changes', async ({ page, seedExpenses }) => {
    await seedExpenses(SAMPLE_EXPENSES);
    
    // Start with mobile
    await page.setViewportSize({ width: 375, height: 667 });
    
    const expensesPage = new ExpensesPage(page);
    await expensesPage.navigate();
    
    await page.waitForTimeout(300);
    
    // Switch to desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(300);
    
    // Should still work
    await expensesPage.selectViewMode('year');
    await page.waitForTimeout(500);
    
    const urlParams = expensesPage.getUrlParams();
    expect(urlParams.get('view')).toBe('year');
  });

  test('should have readable text on all viewports', async ({ page, seedExpenses }) => {
    await seedExpenses(SAMPLE_EXPENSES);
    
    const viewports = [
      { width: 375, height: 667 },   // Mobile
      { width: 768, height: 1024 },  // Tablet
      { width: 1920, height: 1080 }, // Desktop
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      
      const expensesPage = new ExpensesPage(page);
      await expensesPage.navigate({ view: 'day', date: '2026-03-01' });
      await page.waitForTimeout(300);
      
      // Total display should be visible and readable
      await expect(expensesPage.totalDisplay).toBeVisible();
      
      const total = await expensesPage.getTotal();
      expect(total.length).toBeGreaterThan(0);
    }
  });

  test('should position FAB correctly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    
    const expensesPage = new ExpensesPage(page);
    await expensesPage.navigate();
    
    // FAB should be visible and positioned
    await expect(expensesPage.addFab).toBeVisible();
    
    // FAB should be clickable
    await expensesPage.addFab.click();
    await expect(page).toHaveURL(/\/expenses\/add/);
  });
});
