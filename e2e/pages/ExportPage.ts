import { Page, Locator, Download } from '@playwright/test';

/**
 * Page Object Model for the Export Data page (/export)
 */
export class ExportPage {
  readonly page: Page;

  readonly backButton: Locator;
  readonly pageTitle: Locator;
  readonly exportButton: Locator;
  readonly confirmDialog: Locator;
  readonly confirmExportButton: Locator;
  readonly cancelExportButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.backButton = page.getByRole('button', { name: /back/i });
    this.pageTitle = page.getByRole('heading', { name: /export data/i });
    this.exportButton = page.getByRole('button', { name: /^export$/i });
    this.confirmDialog = page.getByRole('dialog');
    this.confirmExportButton = page.getByRole('button', { name: /yes, export/i });
    this.cancelExportButton = page.getByRole('button', { name: /cancel/i });
  }

  async navigate(): Promise<void> {
    await this.page.goto('/export');
  }

  async clickExport(): Promise<void> {
    await this.exportButton.click();
  }

  async confirmExportDialog(): Promise<void> {
    await this.confirmExportButton.click();
  }

  async cancelExportDialog(): Promise<void> {
    await this.cancelExportButton.click();
  }

  /**
   * Waits for a browser download to start, clicks "Yes, export" to trigger it,
   * and returns the Download object for assertions.
   */
  async waitForDownload(): Promise<Download> {
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.confirmExportButton.click(),
    ]);
    return download;
  }

  get exportSuccessAlert(): Locator {
    return this.page.getByRole('alert').filter({ hasText: /export complete/i });
  }
}
