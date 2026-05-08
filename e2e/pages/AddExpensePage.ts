import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for the Add Expense page
 */
export class AddExpensePage {
  readonly page: Page;
  readonly backButton: Locator;
  readonly pageTitle: Locator;
  readonly dateField: Locator;
  readonly spentOnField: Locator;
  readonly categoryGroupField: Locator;
  readonly amountField: Locator;
  readonly descriptionField: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  readonly infoAlert: Locator;

  constructor(page: Page) {
    this.page = page;
    this.backButton = page.getByRole('button', { name: /back/i }).first();
    this.pageTitle = page.getByRole('heading', { name: /add expense/i });
    this.dateField = page.getByLabel(/date/i);
    this.spentOnField = page.getByLabel(/spent on/i);
    this.categoryGroupField = page.getByLabel(/^category$/i);
    this.amountField = page.getByLabel(/amount/i);
    this.descriptionField = page.getByLabel(/description/i);
    this.saveButton = page.getByRole('button', { name: /save/i });
    this.cancelButton = page.getByRole('button', { name: /cancel/i });
    this.infoAlert = page.getByRole('alert');
  }

  /**
   * Navigate to the add expense page
   */
  async navigate(queryParams?: { view?: string; date?: string }): Promise<void> {
    let url = '/expenses/add';
    if (queryParams) {
      const params = new URLSearchParams();
      if (queryParams.view) params.append('view', queryParams.view);
      if (queryParams.date) params.append('date', queryParams.date);
      if (params.toString()) url += `?${params.toString()}`;
    }
    await this.page.goto(url);
  }

  /**
   * Fill the date field
   */
  async fillDate(date: string): Promise<void> {
    await this.dateField.fill(date);
  }

  /**
   * Select or type a Spent On value
   */
  async selectSpentOn(spentOn: string): Promise<void> {
    await this.spentOnField.click();
    await this.spentOnField.fill(spentOn);
    try {
      await this.page.getByRole('option', { name: spentOn, exact: true }).click({ timeout: 1000 });
    } catch {
      await this.spentOnField.press('Enter');
    }
  }

  /**
   * Select or type a Category group value (only visible for new Spent On values or in edit mode)
   */
  async selectCategoryGroup(category: string): Promise<void> {
    await this.categoryGroupField.click();
    await this.categoryGroupField.fill(category);
    try {
      await this.page.getByRole('option', { name: category, exact: true }).click({ timeout: 1000 });
    } catch {
      await this.categoryGroupField.press('Enter');
    }
  }

  /**
   * Fill the amount field
   */
  async fillAmount(amount: string | number): Promise<void> {
    await this.amountField.fill(String(amount));
  }

  /**
   * Fill the description field
   */
  async fillDescription(description: string): Promise<void> {
    await this.descriptionField.fill(description);
  }

  /**
   * Click save button
   */
  async clickSave(): Promise<void> {
    await this.saveButton.click();
  }

  /**
   * Click cancel button
   */
  async clickCancel(): Promise<void> {
    await this.cancelButton.click();
  }

  /**
   * Click back button
   */
  async clickBack(): Promise<void> {
    await this.backButton.click();
  }

  /**
   * Get the value of the date field
   */
  async getDateValue(): Promise<string> {
    return await this.dateField.inputValue();
  }

  /**
   * Check if info alert is visible
   */
  async hasInfoAlert(): Promise<boolean> {
    return await this.infoAlert.isVisible();
  }

  /**
   * Get info alert text
   */
  async getInfoAlertText(): Promise<string> {
    return await this.infoAlert.textContent() || '';
  }

  /**
   * Get current URL
   */
  getCurrentUrl(): string {
    return this.page.url();
  }

  /**
   * Get URL search params
   */
  getUrlParams(): URLSearchParams {
    const url = new URL(this.page.url());
    return url.searchParams;
  }

  /**
   * Check if field has error
   */
  async hasFieldError(fieldLabel: string): Promise<boolean> {
    const field = this.page.getByLabel(new RegExp(fieldLabel, 'i'));
    const ariaInvalid = await field.getAttribute('aria-invalid');
    return ariaInvalid === 'true';
  }

  /**
   * Fill complete form
   */
  async fillForm(data: {
    date?: string;
    spentOn: string;
    category?: string;
    amount: string | number;
    description?: string;
  }): Promise<void> {
    if (data.date) {
      await this.fillDate(data.date);
    }
    await this.selectSpentOn(data.spentOn);
    // Category group is auto-resolved for known Spent On values.
    // Only fill it if explicitly provided (new Spent On scenario).
    if (data.category) {
      try {
        await this.selectCategoryGroup(data.category);
      } catch {
        // Category may already be resolved as a pill — ignore
      }
    }
    await this.fillAmount(data.amount);
    if (data.description) {
      await this.fillDescription(data.description);
    }
  }
}
