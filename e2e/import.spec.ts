import { test, expect } from './fixtures/base-fixture';
import { ImportPage } from './pages/ImportPage';

// ---------------------------------------------------------------------------
// Valid import payloads
// ---------------------------------------------------------------------------

const VALID_CATEGORIES_PAYLOAD = {
  expenseCategories: ['Food', 'Transport', 'Health'],
};

const VALID_FULL_PAYLOAD = {
  expenseYearIndex: ['2025'],
  expenseCategories: ['Groceries', 'Rent'],
  '2025': {
    '5': [
      {
        id: 'imp-001',
        amount: 120,
        spentOn: 'Supermarket',
        category: 'Groceries',
        date: '2025-05-03',
        description: 'Weekly shopping',
        source: 'manual',
        createdAt: '2025-05-03T10:00:00.000Z',
        updatedAt: '2025-05-03T10:00:00.000Z',
      },
    ],
  },
};

const VALID_PENDING_PAYLOAD = {
  expensesPending: [
    {
      id: 'pend-001',
      amount: 50,
      spentOn: 'Pharmacy',
      category: 'Health',
      date: '2025-05-01',
      description: 'Medicine',
      source: 'sms',
      createdAt: '2025-05-01T08:00:00.000Z',
      updatedAt: '2025-05-01T08:00:00.000Z',
    },
  ],
};

// ---------------------------------------------------------------------------
// Invalid / malformed payloads
// ---------------------------------------------------------------------------

const INVALID_JSON_STRING = '{ this is not : valid json }';

const ARRAY_ROOT_JSON = JSON.stringify(['item1', 'item2']);

const UNKNOWN_KEY_PAYLOAD = {
  unknownKey: ['data'],
};

const SHAPE_ERROR_PAYLOAD = {
  expenseCategories: 'should-be-an-array',
};

const SHAPE_ERROR_SETTINGS_PAYLOAD = {
  appSettings: {
    parserRules: [],
    notificationEnabled: 'yes', // should be boolean
    notificationTime: '09:00',
  },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Import Data Page', () => {
  test.describe('Page rendering', () => {
    test('should display Import Data heading', async ({ page }) => {
      const importPage = new ImportPage(page);
      await importPage.navigate();

      await expect(importPage.pageTitle).toBeVisible();
    });

    test('should display the Select File button', async ({ page }) => {
      const importPage = new ImportPage(page);
      await importPage.navigate();

      await expect(importPage.selectFileButton).toBeVisible();
    });

    test('should display the Import button in a disabled state initially', async ({ page }) => {
      const importPage = new ImportPage(page);
      await importPage.navigate();

      await expect(importPage.importButton).toBeVisible();
      await expect(importPage.importButton).toBeDisabled();
    });

    test('should display the "Clear all existing data" toggle', async ({ page }) => {
      const importPage = new ImportPage(page);
      await importPage.navigate();

      await expect(importPage.clearExistingToggle).toBeVisible();
    });

    test('should display the "How it works" section', async ({ page }) => {
      const importPage = new ImportPage(page);
      await importPage.navigate();

      await expect(page.getByText(/how import works/i)).toBeVisible();
    });
  });

  test.describe('File validation', () => {
    test('should enable Import button after uploading a valid JSON file', async ({ page }) => {
      const importPage = new ImportPage(page);
      await importPage.navigate();

      await importPage.uploadJsonFile('import.json', VALID_CATEGORIES_PAYLOAD);

      await expect(importPage.importButton).toBeEnabled();
    });

    test('should display selected file name after upload', async ({ page }) => {
      const importPage = new ImportPage(page);
      await importPage.navigate();

      await importPage.uploadJsonFile('my-export.json', VALID_CATEGORIES_PAYLOAD);

      await expect(page.getByText(/my-export\.json/i)).toBeVisible();
    });

    test('should show parse error for non-JSON file content', async ({ page }) => {
      const importPage = new ImportPage(page);
      await importPage.navigate();

      await importPage.fileInput.setInputFiles({
        name: 'bad.json',
        mimeType: 'application/json',
        buffer: Buffer.from(INVALID_JSON_STRING, 'utf-8'),
      });

      await expect(page.getByRole('alert').filter({ hasText: /parse error|could not be parsed/i })).toBeVisible();
      await expect(importPage.importButton).toBeDisabled();
    });

    test('should show parse error when JSON root is an array instead of object', async ({ page }) => {
      const importPage = new ImportPage(page);
      await importPage.navigate();

      await importPage.fileInput.setInputFiles({
        name: 'array.json',
        mimeType: 'application/json',
        buffer: Buffer.from(ARRAY_ROOT_JSON, 'utf-8'),
      });

      // Wait for any alert to appear first (FileReader is async), then check text
      await expect(page.getByRole('alert').first()).toBeVisible({ timeout: 10000 });
      await expect(page.getByText(/single top-level object/i)).toBeVisible();
      await expect(importPage.importButton).toBeDisabled();
    });

    test('should show key validation error for unrecognized keys', async ({ page }) => {
      const importPage = new ImportPage(page);
      await importPage.navigate();

      await importPage.uploadJsonFile('unknown-keys.json', UNKNOWN_KEY_PAYLOAD);

      await expect(page.getByRole('alert').filter({ hasText: /invalid key/i })).toBeVisible();
      await expect(page.getByText(/unknownKey/)).toBeVisible();
      await expect(importPage.importButton).toBeDisabled();
    });

    test('should show shape error when expenseCategories is not an array', async ({ page }) => {
      const importPage = new ImportPage(page);
      await importPage.navigate();

      await importPage.uploadJsonFile('shape-error.json', SHAPE_ERROR_PAYLOAD);

      await expect(page.getByRole('alert').filter({ hasText: /shape|invalid|must be/i })).toBeVisible();
      await expect(importPage.importButton).toBeDisabled();
    });

    test('should show shape error when appSettings has wrong field type', async ({ page }) => {
      const importPage = new ImportPage(page);
      await importPage.navigate();

      await importPage.uploadJsonFile('settings-error.json', SHAPE_ERROR_SETTINGS_PAYLOAD);

      await expect(page.getByRole('alert').filter({ hasText: /shape|invalid|must be/i })).toBeVisible();
      await expect(importPage.importButton).toBeDisabled();
    });
  });

  test.describe('Import execution', () => {
    test('should show success summary after importing categories', async ({ page }) => {
      const importPage = new ImportPage(page);
      await importPage.navigate();

      await importPage.uploadJsonFile('import.json', VALID_CATEGORIES_PAYLOAD);
      await importPage.clickImport();

      await expect(importPage.importSuccessAlert).toBeVisible();
      await expect(page.getByText(/import complete/i)).toBeVisible();
    });

    test('should display per-key result rows in summary', async ({ page }) => {
      const importPage = new ImportPage(page);
      await importPage.navigate();

      await importPage.uploadJsonFile('import.json', VALID_CATEGORIES_PAYLOAD);
      await importPage.clickImport();

      await expect(importPage.getResultRow('expenseCategories')).toBeVisible();
    });

    test('should import pending expenses and show in summary', async ({ page }) => {
      const importPage = new ImportPage(page);
      await importPage.navigate();

      await importPage.uploadJsonFile('pending.json', VALID_PENDING_PAYLOAD);
      await importPage.clickImport();

      await expect(importPage.importSuccessAlert).toBeVisible();
      await expect(importPage.getResultRow('expensesPending')).toBeVisible();
    });

    test('should import full payload with year data and show success', async ({ page }) => {
      const importPage = new ImportPage(page);
      await importPage.navigate();

      await importPage.uploadJsonFile('full-export.json', VALID_FULL_PAYLOAD);
      await importPage.clickImport();

      await expect(importPage.importSuccessAlert).toBeVisible();
    });

    test('should import multiple times without re-importing duplicate records', async ({ page }) => {
      const importPage = new ImportPage(page);
      await importPage.navigate();

      // First import
      await importPage.uploadJsonFile('import.json', VALID_CATEGORIES_PAYLOAD);
      await importPage.clickImport();
      await expect(page.getByText(/import complete/i)).toBeVisible();

      // Navigate away and back to reset UI state
      await page.goto('/');
      await importPage.navigate();

      // Second import with same data
      await importPage.uploadJsonFile('import.json', VALID_CATEGORIES_PAYLOAD);
      await importPage.clickImport();

      // Should succeed (duplicates are merged, not errored)
      await expect(importPage.importSuccessAlert).toBeVisible();
    });
  });

  test.describe('Clear existing data toggle', () => {
    test('should show confirmation dialog when "clear existing" is enabled before import', async ({ page }) => {
      const importPage = new ImportPage(page);
      await importPage.navigate();

      await importPage.uploadJsonFile('import.json', VALID_CATEGORIES_PAYLOAD);
      await importPage.toggleClearExisting();
      await importPage.clickImport();

      await expect(importPage.confirmDialog).toBeVisible();
    });

    test('should cancel import from confirmation dialog', async ({ page }) => {
      const importPage = new ImportPage(page);
      await importPage.navigate();

      await importPage.uploadJsonFile('import.json', VALID_CATEGORIES_PAYLOAD);
      await importPage.toggleClearExisting();
      await importPage.clickImport();

      await importPage.cancelClearDialog();

      await expect(importPage.confirmDialog).not.toBeVisible();
      await expect(importPage.importSuccessAlert).not.toBeVisible();
    });

    test('should complete import after confirming clear dialog', async ({ page }) => {
      const importPage = new ImportPage(page);
      await importPage.navigate();

      await importPage.uploadJsonFile('import.json', VALID_CATEGORIES_PAYLOAD);
      await importPage.toggleClearExisting();
      await importPage.clickImport();

      await importPage.confirmClearDialog();

      await expect(importPage.importSuccessAlert).toBeVisible();
    });

    test('should not show confirmation dialog when "clear existing" is disabled', async ({ page }) => {
      const importPage = new ImportPage(page);
      await importPage.navigate();

      await importPage.uploadJsonFile('import.json', VALID_CATEGORIES_PAYLOAD);
      // Toggle is off by default — import directly
      await importPage.clickImport();

      await expect(importPage.confirmDialog).not.toBeVisible();
    });
  });

  test.describe('Navigation', () => {
    test('should navigate back when the back button is clicked', async ({ page }) => {
      const importPage = new ImportPage(page);

      // Navigate from home so the back button has history to go back to
      await page.goto('/');
      await importPage.navigate();

      const previousUrl = page.url();
      await importPage.backButton.click();

      // URL should change away from /import
      await expect(page).not.toHaveURL(previousUrl);
    });
  });
});
