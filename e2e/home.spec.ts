import { test, expect } from './fixtures/base-fixture';
import { HomePage } from './pages/HomePage';
import { NavigationDrawer } from './pages/NavigationDrawer';

test.describe('Home Page', () => {
  test('should display greeting message', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.navigate();

    const greeting = await homePage.getGreeting();
    expect(greeting).toBe('Hello User!');
  });

  test('should open navigation drawer and highlight home as active', async ({ page }) => {
    const homePage = new HomePage(page);
    const nav = new NavigationDrawer(page);
    
    await homePage.navigate();
    const isActive = await nav.isActiveRoute('home');
    
    expect(isActive).toBe(true);
  });

  test('should navigate to expenses page via drawer', async ({ page }) => {
    const homePage = new HomePage(page);
    
    await homePage.navigate();
    await homePage.navigateToExpenses();
    
    await expect(page).toHaveURL(/\/expenses/);
    await expect(page.getByRole('heading', { name: /expenses/i })).toBeVisible();
  });
});
