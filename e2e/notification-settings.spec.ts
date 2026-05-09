import { test, expect } from './fixtures/base-fixture';
import { SettingsPage } from './pages/SettingsPage';
import { seedSettings, getLocalStorageItem } from './utils/storage-helper';

test.describe('Notification Settings Page', () => {
  test('should display the Permission card', async ({ page }) => {
    await page.goto('/settings/notifications');
    await expect(page.getByText('Permission')).toBeVisible();
  });

  test('should display the Daily Review Reminder card', async ({ page }) => {
    await page.goto('/settings/notifications');
    await expect(page.getByText('Daily Review Reminder')).toBeVisible();
  });

  test('should display the reminder toggle', async ({ page }) => {
    const settings = new SettingsPage(page);
    await settings.navigateToNotifications();

    await expect(settings.notificationToggle).toBeVisible();
  });

  test('should display the reminder time field', async ({ page }) => {
    const settings = new SettingsPage(page);
    await settings.navigateToNotifications();

    await expect(settings.reminderTimeField).toBeVisible();
  });

  test('should reflect persisted notification enabled state (ON)', async ({ page }) => {
    await seedSettings(page, { notificationEnabled: true, notificationTime: '08:30' });

    const settings = new SettingsPage(page);
    await settings.navigateToNotifications();

    await expect(settings.notificationToggle).toBeChecked();
  });

  test('should reflect persisted notification enabled state (OFF)', async ({ page }) => {
    await seedSettings(page, { notificationEnabled: false });

    const settings = new SettingsPage(page);
    await settings.navigateToNotifications();

    await expect(settings.notificationToggle).not.toBeChecked();
  });

  test('should reflect persisted reminder time', async ({ page }) => {
    await seedSettings(page, { notificationEnabled: true, notificationTime: '09:30' });

    const settings = new SettingsPage(page);
    await settings.navigateToNotifications();

    await expect(settings.reminderTimeField).toHaveValue('09:30');
  });

  test('should show description text when notifications are enabled', async ({ page }) => {
    await seedSettings(page, { notificationEnabled: true, notificationTime: '21:00' });

    const settings = new SettingsPage(page);
    await settings.navigateToNotifications();

    await expect(page.getByText(/you'll be reminded daily/i)).toBeVisible();
  });

  test('should show "off" description when notifications are disabled', async ({ page }) => {
    await seedSettings(page, { notificationEnabled: false });

    const settings = new SettingsPage(page);
    await settings.navigateToNotifications();

    await expect(page.getByText(/reminder is currently off/i)).toBeVisible();
  });

  test('should persist enabled toggle change to localStorage', async ({ page }) => {
    await seedSettings(page, { notificationEnabled: false });

    const settings = new SettingsPage(page);
    await settings.navigateToNotifications();

    // Enable the toggle
    await settings.notificationToggle.click();

    // Check localStorage
    const stored = await getLocalStorageItem(page, 'appSettings');
    expect(stored.notificationEnabled).toBe(true);
  });

  test('should persist disabled toggle change to localStorage', async ({ page }) => {
    await seedSettings(page, { notificationEnabled: true });

    const settings = new SettingsPage(page);
    await settings.navigateToNotifications();

    // Disable the toggle
    await settings.notificationToggle.click();

    const stored = await getLocalStorageItem(page, 'appSettings');
    expect(stored.notificationEnabled).toBe(false);
  });

  test('should show snackbar feedback after toggling notifications', async ({ page }) => {
    await seedSettings(page, { notificationEnabled: false });

    const settings = new SettingsPage(page);
    await settings.navigateToNotifications();

    await settings.notificationToggle.click();

    await expect(page.getByText('Saved')).toBeVisible();
  });

  test('should disable the reminder time field when notifications are off', async ({ page }) => {
    await seedSettings(page, { notificationEnabled: false });

    const settings = new SettingsPage(page);
    await settings.navigateToNotifications();

    await expect(settings.reminderTimeField).toBeDisabled();
  });

  test('should enable the reminder time field when notifications are on', async ({ page }) => {
    await seedSettings(page, { notificationEnabled: true, notificationTime: '08:00' });

    const settings = new SettingsPage(page);
    await settings.navigateToNotifications();

    await expect(settings.reminderTimeField).toBeEnabled();
  });

  test('should disable "Send test notification" button when permission not granted', async ({ page }) => {
    // In the test browser, Notification permission is not granted by default
    const settings = new SettingsPage(page);
    await settings.navigateToNotifications();

    await expect(settings.testNotificationButton).toBeDisabled();
  });

  test('should display default reminder time of 21:00 when no settings seeded', async ({ page }) => {
    const settings = new SettingsPage(page);
    await settings.navigateToNotifications();

    // Default notification time
    await expect(settings.reminderTimeField).toHaveValue('21:00');
  });
});
