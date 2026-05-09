import { test, expect } from './fixtures/base-fixture';
import { SettingsPage } from './pages/SettingsPage';
import { seedSettings } from './utils/storage-helper';

test.describe('Settings Page', () => {
  test('should display all settings sections', async ({ page }) => {
    const settings = new SettingsPage(page);
    await settings.navigateToSettings();

    await expect(page.getByText('View Preferences')).toBeVisible();
    await expect(page.getByText('PWA Preferences')).toBeVisible();
  });

  test('should display Theme, SMS Parser and Notifications items', async ({ page }) => {
    const settings = new SettingsPage(page);
    await settings.navigateToSettings();

    await expect(page.getByText('Theme')).toBeVisible();
    await expect(page.getByText('SMS Parser')).toBeVisible();
    await expect(page.getByText('Notifications')).toBeVisible();
  });

  test('should show built-in rule count in SMS Parser summary', async ({ page }) => {
    const settings = new SettingsPage(page);
    await settings.navigateToSettings();

    // Default has 4 built-in rules
    await expect(page.getByText(/built-in rules/i)).toBeVisible();
  });

  test('should show custom rule count when custom rules exist', async ({ page }) => {
    await seedSettings(page, {
      parserRules: [
        { id: 'custom-1', bankName: 'My Bank', amountKeyword: 'Rs', merchantKeyword: 'to', builtIn: false },
      ],
    });

    const settings = new SettingsPage(page);
    await settings.navigateToSettings();

    await expect(page.getByText(/custom/i)).toBeVisible();
  });

  test('should show notification Off in summary when disabled', async ({ page }) => {
    await seedSettings(page, { notificationEnabled: false });

    const settings = new SettingsPage(page);
    await settings.navigateToSettings();

    await expect(page.getByText('Off')).toBeVisible();
  });

  test('should show daily reminder time in summary when enabled', async ({ page }) => {
    await seedSettings(page, { notificationEnabled: true, notificationTime: '09:00' });

    const settings = new SettingsPage(page);
    await settings.navigateToSettings();

    await expect(page.getByText(/daily at/i)).toBeVisible();
  });

  test('should navigate to SMS Parser settings page', async ({ page }) => {
    const settings = new SettingsPage(page);
    await settings.navigateToSettings();

    await settings.clickSettingsItem('SMS Parser');

    await expect(page).toHaveURL(/\/settings\/sms-parser/);
    await expect(page.getByRole('heading', { name: /SMS Parser/i })).toBeVisible();
  });

  test('should navigate to Notifications settings page', async ({ page }) => {
    const settings = new SettingsPage(page);
    await settings.navigateToSettings();

    await settings.clickSettingsItem('Notifications');

    await expect(page).toHaveURL(/\/settings\/notifications/);
    await expect(page.getByRole('heading', { name: /Notifications/i })).toBeVisible();
  });

  test('should navigate to Theme settings page', async ({ page }) => {
    const settings = new SettingsPage(page);
    await settings.navigateToSettings();

    await settings.clickSettingsItem('Theme');

    await expect(page).toHaveURL(/\/settings\/theme/);
    await expect(page.getByRole('heading', { name: /Theme/i })).toBeVisible();
  });

  test('Theme page should show coming soon message', async ({ page }) => {
    await page.goto('/settings/theme');
    await expect(page.getByText(/coming soon/i)).toBeVisible();
  });

  test('back button on SMS Parser page should navigate away from sub-page', async ({ page }) => {
    const settings = new SettingsPage(page);
    await settings.navigateToSmsParser();

    await settings.backButton.click();
    await page.waitForTimeout(400);

    expect(page.url()).not.toMatch(/\/settings\/sms-parser/);
  });

  test('back button on Notifications page should navigate away from sub-page', async ({ page }) => {
    const settings = new SettingsPage(page);
    await settings.navigateToNotifications();

    await settings.backButton.click();
    await page.waitForTimeout(400);

    expect(page.url()).not.toMatch(/\/settings\/notifications/);
  });

  test('Settings page is accessible via the navigation drawer', async ({ page }) => {
    await page.goto('/');
    // Open nav drawer
    const menuButton = page.getByRole('button', { name: /open drawer/i });
    await menuButton.click();
    await page.locator('.MuiDrawer-paper').waitFor({ state: 'visible' });
    await page.getByRole('button', { name: /settings/i }).click();
    await expect(page).toHaveURL(/\/settings/);
  });
});
