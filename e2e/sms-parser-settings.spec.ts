import { test, expect } from './fixtures/base-fixture';
import { SettingsPage } from './pages/SettingsPage';
import { seedSettings, getLocalStorageItem } from './utils/storage-helper';

test.describe('SMS Parser Settings — Built-in Rules', () => {
  test('should display all four built-in bank rules', async ({ page }) => {
    const settings = new SettingsPage(page);
    await settings.navigateToSmsParser();

    await expect(page.getByText('HDFC Bank').first()).toBeVisible();
    await expect(page.getByText('ICICI Bank').first()).toBeVisible();
    await expect(page.getByText('SBI').first()).toBeVisible();
    await expect(page.getByText('Axis Bank').first()).toBeVisible();
  });

  test('should show amount keyword for each built-in rule', async ({ page }) => {
    const settings = new SettingsPage(page);
    await settings.navigateToSmsParser();

    // HDFC uses INR, ICICI uses Rs
    await expect(page.getByText('INR').first()).toBeVisible();
    await expect(page.getByText('Rs').first()).toBeVisible();
  });

  test('should mark built-in rules with a "Built-in" chip or label', async ({ page }) => {
    const settings = new SettingsPage(page);
    await settings.navigateToSmsParser();

    // Built-in rules should be indicated
    await expect(page.getByText(/built-in/i).first()).toBeVisible();
  });

  test('should show Edit button on built-in rules', async ({ page }) => {
    const settings = new SettingsPage(page);
    await settings.navigateToSmsParser();

    // Should have edit buttons (built-in rules can be overridden)
    const editButtons = page.getByRole('button', { name: /edit/i });
    await expect(editButtons.first()).toBeVisible();
  });

  test('should open override dialog when editing a built-in rule', async ({ page }) => {
    const settings = new SettingsPage(page);
    await settings.navigateToSmsParser();

    // Click edit on first built-in rule (HDFC)
    await page.getByRole('button', { name: /edit/i }).first().click();

    // Dialog should open with the existing values pre-filled
    await expect(settings.ruleFormBankName).toBeVisible();
    await expect(settings.ruleFormBankName).toHaveValue('HDFC Bank');
  });

  test('should show info text about overriding a built-in rule in the dialog', async ({ page }) => {
    const settings = new SettingsPage(page);
    await settings.navigateToSmsParser();

    await page.getByRole('button', { name: /edit/i }).first().click();

    await expect(page.getByText(/override/i)).toBeVisible();
  });

  test('should save built-in rule override and update localStorage', async ({ page }) => {
    const settings = new SettingsPage(page);
    await settings.navigateToSmsParser();

    await page.getByRole('button', { name: /edit/i }).first().click();
    await settings.ruleFormAmountKeyword.fill('RUPEES');
    await settings.saveRule();

    // Check localStorage for the override rule
    const stored = await getLocalStorageItem(page, 'appSettings');
    const overrideRule = stored.parserRules?.find((r: { overrideOf?: string; amountKeyword?: string }) => r.overrideOf === 'builtin-hdfc');
    expect(overrideRule).toBeDefined();
    expect(overrideRule?.amountKeyword).toBe('RUPEES');
  });

  test('should show snackbar after saving a rule override', async ({ page }) => {
    const settings = new SettingsPage(page);
    await settings.navigateToSmsParser();

    await page.getByRole('button', { name: /edit/i }).first().click();
    await settings.ruleFormAmountKeyword.fill('CUSTOM');
    await settings.saveRule();

    await expect(page.getByText(/rule updated/i)).toBeVisible();
  });

  test('should show Restore button on overridden built-in rules', async ({ page }) => {
    // Seed a rule override
    await seedSettings(page, {
      parserRules: [
        {
          id: 'overridden-builtin-hdfc',
          bankName: 'HDFC Bank',
          amountKeyword: 'CUSTOM',
          merchantKeyword: 'to ',
          builtIn: false,
          overrideOf: 'builtin-hdfc',
        },
      ],
    });

    const settings = new SettingsPage(page);
    await settings.navigateToSmsParser();

    await expect(page.getByRole('button', { name: /restore/i })).toBeVisible();
  });

  test('should restore built-in rule to default when clicking Restore', async ({ page }) => {
    await seedSettings(page, {
      parserRules: [
        {
          id: 'overridden-builtin-hdfc',
          bankName: 'HDFC Bank',
          amountKeyword: 'CUSTOM',
          merchantKeyword: 'to ',
          builtIn: false,
          overrideOf: 'builtin-hdfc',
        },
      ],
    });

    const settings = new SettingsPage(page);
    await settings.navigateToSmsParser();

    await page.getByRole('button', { name: /restore/i }).click();

    await expect(page.getByText(/rule restored to default/i)).toBeVisible();
  });
});

test.describe('SMS Parser Settings — Custom Rules', () => {
  test('should open Add Rule dialog', async ({ page }) => {
    const settings = new SettingsPage(page);
    await settings.navigateToSmsParser();

    await settings.openAddRuleDialog();

    await expect(settings.ruleFormBankName).toBeVisible();
    await expect(settings.ruleFormAmountKeyword).toBeVisible();
  });

  test('should add a new custom rule and persist it', async ({ page }) => {
    const settings = new SettingsPage(page);
    await settings.navigateToSmsParser();

    await settings.openAddRuleDialog();
    await settings.fillRuleForm({
      bankName: 'Test Bank',
      amountKeyword: 'USD',
      merchantKeyword: 'at',
    });
    await settings.saveRule();

    // Rule should appear in the list
    await expect(page.getByText('Test Bank')).toBeVisible();
  });

  test('should persist new custom rule to localStorage', async ({ page }) => {
    const settings = new SettingsPage(page);
    await settings.navigateToSmsParser();

    await settings.openAddRuleDialog();
    await settings.fillRuleForm({
      bankName: 'Custom Bank',
      amountKeyword: 'EUR',
      merchantKeyword: 'to',
    });
    await settings.saveRule();

    const stored = await getLocalStorageItem(page, 'appSettings');
    const customRule = stored.parserRules?.find((r: { bankName: string }) => r.bankName === 'Custom Bank');
    expect(customRule).toBeDefined();
  });

  test('should show "Rule added" snackbar after adding a new rule', async ({ page }) => {
    const settings = new SettingsPage(page);
    await settings.navigateToSmsParser();

    await settings.openAddRuleDialog();
    await settings.fillRuleForm({ bankName: 'New Bank', amountKeyword: 'INR' });
    await settings.saveRule();

    await expect(page.getByText('Rule added')).toBeVisible();
  });

  test('should validate that bankName is required', async ({ page }) => {
    const settings = new SettingsPage(page);
    await settings.navigateToSmsParser();

    await settings.openAddRuleDialog();
    // Leave bankName empty
    await settings.ruleFormAmountKeyword.fill('INR');
    await settings.saveRule();

    // Dialog should still be open (validation failed)
    await expect(settings.ruleFormBankName).toBeVisible();
    await expect(page.getByText(/bank name is required/i)).toBeVisible();
  });

  test('should validate that amountKeyword is required', async ({ page }) => {
    const settings = new SettingsPage(page);
    await settings.navigateToSmsParser();

    await settings.openAddRuleDialog();
    await settings.ruleFormBankName.fill('Some Bank');
    // Leave amountKeyword empty
    await settings.saveRule();

    await expect(page.getByText(/amount keyword is required/i)).toBeVisible();
  });

  test('should cancel adding a rule without saving', async ({ page }) => {
    const settings = new SettingsPage(page);
    await settings.navigateToSmsParser();

    await settings.openAddRuleDialog();
    await settings.fillRuleForm({ bankName: 'Ghost Bank', amountKeyword: 'GHO' });
    await settings.ruleCancelButton.click();

    // Ghost Bank should not appear in the list
    await expect(page.getByText('Ghost Bank')).not.toBeVisible();
  });

  test('should edit an existing custom rule', async ({ page }) => {
    await seedSettings(page, {
      parserRules: [
        {
          id: 'custom-xyz',
          bankName: 'XYZ Bank',
          amountKeyword: 'OLD',
          merchantKeyword: 'to',
          builtIn: false,
        },
      ],
    });

    const settings = new SettingsPage(page);
    await settings.navigateToSmsParser();

    // Edit the custom rule
    await page.getByRole('button', { name: /edit xyz bank rule/i }).click();
    await settings.ruleFormAmountKeyword.fill('NEW');
    await settings.saveRule();

    await expect(page.getByText(/rule updated/i)).toBeVisible();
  });

  test('should delete a custom rule with soft delete and undo snackbar', async ({ page }) => {
    await seedSettings(page, {
      parserRules: [
        {
          id: 'custom-del',
          bankName: 'Delete Bank',
          amountKeyword: 'DEL',
          merchantKeyword: 'to',
          builtIn: false,
        },
      ],
    });

    const settings = new SettingsPage(page);
    await settings.navigateToSmsParser();

    // Click delete on the custom rule
    await page.getByRole('button', { name: 'Delete Delete Bank rule' }).click();
    // Confirm deletion in the dialog
    await page.getByRole('button', { name: /^delete$/i }).click();

    // Snackbar with undo
    await expect(page.getByText(/rule deleted/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /undo/i })).toBeVisible();
  });

  test('should restore a deleted rule when clicking Undo', async ({ page }) => {
    await seedSettings(page, {
      parserRules: [
        {
          id: 'custom-restore',
          bankName: 'Restore Bank',
          amountKeyword: 'RST',
          merchantKeyword: 'to',
          builtIn: false,
        },
      ],
    });

    const settings = new SettingsPage(page);
    await settings.navigateToSmsParser();

    await page.getByRole('button', { name: 'Delete Restore Bank rule' }).click();
    await page.getByRole('button', { name: /^delete$/i }).click();
    await page.getByRole('button', { name: /undo/i }).click();

    await expect(page.getByText('Restore Bank')).toBeVisible();
  });
});

test.describe('SMS Parser Settings — Test Panel', () => {
  test('should display the test SMS input panel on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const settings = new SettingsPage(page);
    await settings.navigateToSmsParser();

    // Click the "Test" button on the first built-in rule (HDFC)
    await page.getByRole('button', { name: 'Test' }).first().click();

    // Test panel bottom sheet should open
    await expect(page.getByLabel('Sample SMS')).toBeVisible();
  });

  test('should display parsed result for the default HDFC sample SMS', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const settings = new SettingsPage(page);
    await settings.navigateToSmsParser();

    // Open the test panel for the HDFC rule
    await page.getByRole('button', { name: 'Test' }).first().click();
    await page.locator('.MuiDrawer-paper').waitFor({ state: 'visible' });

    // Default SMS is a HDFC message with amount 1,250.00
    // Result section should show something with 1250
    await expect(page.getByText('1250.00').first()).toBeVisible();
  });

  test('should show no result when the SMS text is cleared', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const settings = new SettingsPage(page);
    await settings.navigateToSmsParser();

    await page.getByRole('button', { name: 'Test' }).first().click();
    await page.locator('.MuiDrawer-paper').waitFor({ state: 'visible' });

    const smsInput = page.getByLabel('Sample SMS');
    await smsInput.fill('');
    await page.waitForTimeout(300);

    // No amount should appear in the result
    await expect(page.getByText('1250.00')).not.toBeVisible();
  });

  test('should show "Test" buttons on each rule card to open test panel', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const settings = new SettingsPage(page);
    await settings.navigateToSmsParser();

    // Each rule card has a Test button
    const testButtons = page.getByRole('button', { name: 'Test' });
    await expect(testButtons.first()).toBeVisible();
  });
});
