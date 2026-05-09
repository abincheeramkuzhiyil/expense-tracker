import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for the Settings pages
 */
export class SettingsPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ─── Settings index (/settings) ───────────────────────────────────────────

  async navigateToSettings(): Promise<void> {
    await this.page.goto('/settings');
  }

  async clickSettingsItem(name: string): Promise<void> {
    await this.page.getByRole('listitem').filter({ hasText: name }).click();
  }

  getSettingsSummary(key: string): Locator {
    return this.page.getByRole('listitem').filter({ hasText: key });
  }

  // ─── Notification settings (/settings/notifications) ─────────────────────

  async navigateToNotifications(): Promise<void> {
    await this.page.goto('/settings/notifications');
  }

  /** Toggle element for "Enable reminder" */
  get notificationToggle(): Locator {
    return this.page.getByRole('checkbox', { name: /enable daily review reminder/i });
  }

  /** Time input field */
  get reminderTimeField(): Locator {
    return this.page.getByLabel(/reminder time/i);
  }

  /** "Send test notification" button */
  get testNotificationButton(): Locator {
    return this.page.getByRole('button', { name: /send test notification/i });
  }

  /** "Enable Notifications" permission button (shown when permission is 'default') */
  get enableNotificationsButton(): Locator {
    return this.page.getByRole('button', { name: /enable notifications/i });
  }

  async setNotificationEnabled(enabled: boolean): Promise<void> {
    const isChecked = await this.notificationToggle.isChecked();
    if (isChecked !== enabled) {
      await this.notificationToggle.click();
    }
  }

  async setReminderTime(time: string): Promise<void> {
    await this.reminderTimeField.fill(time);
    await this.reminderTimeField.press('Tab'); // Trigger change event
  }

  // ─── SMS Parser settings (/settings/sms-parser) ───────────────────────────

  async navigateToSmsParser(): Promise<void> {
    await this.page.goto('/settings/sms-parser');
  }

  /** "Add Rule" button */
  get addRuleButton(): Locator {
    return this.page.getByRole('button', { name: /add rule/i });
  }

  /** Bank name field in the add/edit dialog */
  get ruleFormBankName(): Locator {
    return this.page.getByLabel(/bank name/i);
  }

  /** Amount keyword field in the add/edit dialog */
  get ruleFormAmountKeyword(): Locator {
    return this.page.getByLabel(/amount keyword/i);
  }

  /** Merchant keyword field in the add/edit dialog */
  get ruleFormMerchantKeyword(): Locator {
    return this.page.getByLabel(/merchant keyword/i);
  }

  /** Save button inside the rule add/edit dialog */
  get ruleSaveButton(): Locator {
    return this.page.getByRole('button', { name: /^save$/i });
  }

  /** Cancel button inside the rule add/edit dialog */
  get ruleCancelButton(): Locator {
    return this.page.getByRole('button', { name: /^cancel$/i });
  }

  async openAddRuleDialog(): Promise<void> {
    await this.addRuleButton.click();
  }

  async fillRuleForm(rule: { bankName: string; amountKeyword: string; merchantKeyword?: string }): Promise<void> {
    await this.ruleFormBankName.fill(rule.bankName);
    await this.ruleFormAmountKeyword.fill(rule.amountKeyword);
    if (rule.merchantKeyword !== undefined) {
      await this.ruleFormMerchantKeyword.fill(rule.merchantKeyword);
    }
  }

  async saveRule(): Promise<void> {
    await this.ruleSaveButton.click();
  }

  /** Returns cards for a named bank rule. */
  getRuleCard(bankName: string): Locator {
    return this.page.getByText(bankName).first();
  }

  // ─── Theme settings (/settings/theme) ─────────────────────────────────────

  async navigateToTheme(): Promise<void> {
    await this.page.goto('/settings/theme');
  }

  // ─── Shared helpers ────────────────────────────────────────────────────────

  /** Back button (AppBar back arrow) on sub-pages */
  get backButton(): Locator {
    return this.page.getByRole('button', { name: /back to settings/i });
  }
}
