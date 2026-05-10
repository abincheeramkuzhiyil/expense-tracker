import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for the Import Data page (/import)
 */
export class ImportPage {
  readonly page: Page;

  readonly backButton: Locator;
  readonly pageTitle: Locator;
  readonly selectFileButton: Locator;
  readonly fileInput: Locator;
  readonly selectedFileLabel: Locator;
  readonly clearExistingToggle: Locator;
  readonly importButton: Locator;
  readonly confirmDialog: Locator;
  readonly confirmDialogConfirmButton: Locator;
  readonly confirmDialogCancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.backButton = page.getByRole('button', { name: /back/i });
    this.pageTitle = page.getByRole('heading', { name: /import data/i });
    this.selectFileButton = page.getByRole('button', { name: /choose file/i });
    this.fileInput = page.locator('input[type="file"]');
    this.selectedFileLabel = page.getByText(/selected:/i);
    this.clearExistingToggle = page.getByRole('checkbox').first();
    this.importButton = page.getByRole('button', { name: /^import$/i });
    this.confirmDialog = page.getByRole('dialog');
    this.confirmDialogConfirmButton = page.getByRole('button', { name: /confirm|yes|proceed/i });
    this.confirmDialogCancelButton = page.getByRole('button', { name: /cancel/i });
  }

  async navigate(): Promise<void> {
    await this.page.goto('/import');
  }

  /**
   * Upload a JSON file from a string payload.
   * Uses Playwright's setInputFiles with an in-memory buffer.
   */
  async uploadJsonFile(fileName: string, content: object | string): Promise<void> {
    const jsonString = typeof content === 'string' ? content : JSON.stringify(content);
    await this.fileInput.setInputFiles({
      name: fileName,
      mimeType: 'application/json',
      buffer: Buffer.from(jsonString, 'utf-8'),
    });
  }

  /**
   * Toggle the "Clear all existing data before import" switch.
   */
  async toggleClearExisting(): Promise<void> {
    await this.clearExistingToggle.click();
  }

  /**
   * Click the Import button.
   */
  async clickImport(): Promise<void> {
    await this.importButton.click();
  }

  /**
   * Confirm the clear-existing confirmation dialog.
   */
  async confirmClearDialog(): Promise<void> {
    await this.confirmDialogConfirmButton.click();
  }

  /**
   * Cancel the clear-existing confirmation dialog.
   */
  async cancelClearDialog(): Promise<void> {
    await this.confirmDialogCancelButton.click();
  }

  /**
   * Returns the alert element containing parse/validation errors.
   */
  getAlert(severity: 'error' | 'warning' | 'success'): Locator {
    return this.page.locator(`[role="alert"]`).filter({ hasText: /.+/ }).first();
  }

  /**
   * Returns the import success/warning summary alert.
   */
  get importSuccessAlert(): Locator {
    return this.page.getByRole('alert').filter({ hasText: /import complete|import finished/i });
  }

  /**
   * Returns a locator for a key row in the results summary.
   */
  getResultRow(key: string): Locator {
    return this.page.getByRole('listitem').filter({ hasText: key }).first();
  }
}
