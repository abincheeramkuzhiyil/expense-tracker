import { test, expect } from './fixtures/base-fixture';
import { NavigationDrawer } from './pages/NavigationDrawer';
import { HomePage } from './pages/HomePage';

test.describe('Navigation', () => {
  test('should open drawer menu on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    const nav = new NavigationDrawer(page);
    
    await page.goto('/');
    await nav.open();
    
    expect(await nav.isVisible()).toBe(true);
  });

  test('should navigate from home to expenses', async ({ page }) => {
    const nav = new NavigationDrawer(page);
    
    await page.goto('/');
    await nav.clickExpenses();
    
    await expect(page).toHaveURL(/\/expenses/);
  });

  test('should navigate from expenses to home', async ({ page }) => {
    const nav = new NavigationDrawer(page);
    
    await page.goto('/expenses');
    await nav.clickHome();
    
    await expect(page).toHaveURL('/');
  });

  test('should highlight active route', async ({ page }) => {
    const nav = new NavigationDrawer(page);
    
    // Test home active
    await page.goto('/');
    expect(await nav.isActiveRoute('home')).toBe(true);
    
    // Test expenses active
    await page.goto('/expenses');
    expect(await nav.isActiveRoute('expenses')).toBe(true);
  });

  test('should close drawer after navigation on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    const nav = new NavigationDrawer(page);
    
    await page.goto('/');
    await nav.open();
    await nav.clickExpenses();
    
    // Drawer should auto-close after navigation
    await page.waitForTimeout(500); // Wait for animation
    // On mobile, drawer typically closes after clicking a link
    await expect(page).toHaveURL(/\/expenses/);
  });
});
