import * as fs from 'fs';
import { test, expect } from './fixtures/base-fixture';
import { ExportPage } from './pages/ExportPage';
import { ImportPage } from './pages/ImportPage';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Export Data Page', () => {
  test.describe('Page rendering', () => {
    test('should display Export Data heading', async ({ page }) => {
      const exportPage = new ExportPage(page);
      await exportPage.navigate();

      await expect(exportPage.pageTitle).toBeVisible();
    });

    test('should display the "What Gets Exported" info card', async ({ page }) => {
      const exportPage = new ExportPage(page);
      await exportPage.navigate();

      await expect(page.getByText(/what gets exported/i)).toBeVisible();
    });

    test('should display the Export button in an enabled state', async ({ page }) => {
      const exportPage = new ExportPage(page);
      await exportPage.navigate();

      await expect(exportPage.exportButton).toBeVisible();
      await expect(exportPage.exportButton).toBeEnabled();
    });

    test('should display the back button', async ({ page }) => {
      const exportPage = new ExportPage(page);
      await exportPage.navigate();

      await expect(exportPage.backButton).toBeVisible();
    });
  });

  test.describe('Confirmation dialog', () => {
    test('should open confirmation dialog when Export is clicked', async ({ page }) => {
      const exportPage = new ExportPage(page);
      await exportPage.navigate();

      await exportPage.clickExport();

      await expect(exportPage.confirmDialog).toBeVisible();
    });

    test('should display financial data warning in confirmation dialog', async ({ page }) => {
      const exportPage = new ExportPage(page);
      await exportPage.navigate();

      await exportPage.clickExport();

      await expect(page.getByText(/export financial data\?/i)).toBeVisible();
      await expect(page.getByText(/sensitive financial/i)).toBeVisible();
    });

    test('should close dialog without triggering download when Cancel is clicked', async ({
      page,
    }) => {
      const exportPage = new ExportPage(page);
      await exportPage.navigate();

      await exportPage.clickExport();
      await exportPage.cancelExportDialog();

      await expect(exportPage.confirmDialog).not.toBeVisible();
      await expect(exportPage.exportSuccessAlert).not.toBeVisible();
    });

    test('should allow re-opening dialog after cancellation', async ({ page }) => {
      const exportPage = new ExportPage(page);
      await exportPage.navigate();

      await exportPage.clickExport();
      await exportPage.cancelExportDialog();
      await exportPage.clickExport();

      await expect(exportPage.confirmDialog).toBeVisible();
    });
  });

  test.describe('Export execution', () => {
    test('should trigger download with correct filename pattern', async ({ page }) => {
      const exportPage = new ExportPage(page);
      await exportPage.navigate();

      await exportPage.clickExport();
      const download = await exportPage.waitForDownload();

      expect(download.suggestedFilename()).toMatch(
        /^expense-tracker-export_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.json$/,
      );
    });

    test('should download a valid JSON file', async ({ page }) => {
      const exportPage = new ExportPage(page);
      await exportPage.navigate();

      await exportPage.clickExport();
      const download = await exportPage.waitForDownload();

      const filePath = await download.path();
      const content = fs.readFileSync(filePath!, 'utf-8');

      expect(() => JSON.parse(content)).not.toThrow();
    });

    test('should show success summary after export is confirmed', async ({ page }) => {
      const exportPage = new ExportPage(page);
      await exportPage.navigate();

      await exportPage.clickExport();
      await exportPage.waitForDownload();

      await expect(exportPage.exportSuccessAlert).toBeVisible();
    });

    test('should display filename in success summary', async ({ page }) => {
      const exportPage = new ExportPage(page);
      await exportPage.navigate();

      await exportPage.clickExport();
      const download = await exportPage.waitForDownload();

      await expect(page.getByText(download.suggestedFilename())).toBeVisible();
    });

    test('should round-trip: exported file imports without validation errors', async ({
      page,
      seedExpenses,
    }) => {
      // Seed some expenses so the export contains real expense data
      await seedExpenses(
        [
          {
            id: 'exp-rt-001',
            amount: 100,
            spentOn: 'Lunch',
            category: 'Food',
            date: new Date('2026-05-17'),
            description: 'Round-trip test expense',
            source: 'manual',
            status: 'approved',
            createdAt: new Date('2026-05-17T10:00:00Z'),
            updatedAt: new Date('2026-05-17T10:00:00Z'),
          },
        ],
        ['Food'],
      );

      // Export
      const exportPage = new ExportPage(page);
      await exportPage.navigate();
      await exportPage.clickExport();
      const download = await exportPage.waitForDownload();

      const filePath = await download.path();
      const content = fs.readFileSync(filePath!, 'utf-8');
      const parsed = JSON.parse(content);

      // Import the exported file — it should pass all validation
      const importPage = new ImportPage(page);
      await importPage.navigate();
      await importPage.uploadJsonFile(download.suggestedFilename(), parsed);

      await expect(importPage.importButton).toBeEnabled();
    });
  });

  test.describe('Navigation', () => {
    test('should navigate away from /export when back button is clicked', async ({ page }) => {
      await page.goto('/');
      const exportPage = new ExportPage(page);
      await exportPage.navigate();

      await exportPage.backButton.click();

      await expect(page).not.toHaveURL(/\/export/);
    });

    test('should be reachable via the nav drawer Export Data item', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('button', { name: /open drawer/i }).click();
      await page.getByRole('button', { name: /export data/i }).click();

      await expect(page).toHaveURL(/\/export/);
    });
  });
});
