import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for the Expenses page
 */
export class ExpensesPage {
  readonly page: Page;
  readonly viewModeSelect: Locator;
  readonly prevButton: Locator;
  readonly nextButton: Locator;
  readonly todayButton: Locator;
  readonly addFab: Locator;
  readonly totalDisplay: Locator;
  readonly expenseList: Locator;

  constructor(page: Page) {
    this.page = page;
    this.viewModeSelect = page.getByRole('combobox', { name: /view mode/i });
    this.prevButton = page.getByRole('button', { name: /previous/i });
    this.nextButton = page.getByRole('button', { name: /next/i });
    this.todayButton = page.getByRole('button', { name: /today/i });
    this.addFab = page.getByRole('button', { name: /add/i }).last(); // FAB is usually last
    this.totalDisplay = page.getByText(/Total:/i);
    this.expenseList = page.getByRole('list').first();
  }

  /**
   * Navigate to the expenses page
   */
  async navigate(queryParams?: { view?: string; date?: string }): Promise<void> {
    let url = '/expenses';
    if (queryParams) {
      const params = new URLSearchParams();
      if (queryParams.view) params.append('view', queryParams.view);
      if (queryParams.date) params.append('date', queryParams.date);
      if (params.toString()) url += `?${params.toString()}`;
    }
    await this.page.goto(url);
  }

  /**
   * Select view mode (day, month, year)
   */
  async selectViewMode(mode: 'day' | 'month' | 'year'): Promise<void> {
    await this.viewModeSelect.click();
    await this.page.getByRole('option', { name: new RegExp(mode, 'i') }).click();
  }

  /**
   * Click previous date button
   */
  async clickPrevious(): Promise<void> {
    await this.prevButton.click();
  }

  /**
   * Click next date button
   */
  async clickNext(): Promise<void> {
    await this.nextButton.click();
  }

  /**
   * Click today button
   */
  async clickToday(): Promise<void> {
    await this.todayButton.click();
  }

  /**
   * Click the add expense FAB
   */
  async clickAddFab(): Promise<void> {
    await this.addFab.click();
  }

  /**
   * Get the number of expense items displayed
   */
  async getExpenseCount(): Promise<number> {
    const items = await this.page.getByRole('button', { name: /₹/i }).all();
    // Filter out header and footer rows
    return items.length > 2 ? items.length - 2 : 0;
  }

  /**
   * Get the total amount displayed
   */
  async getTotal(): Promise<string> {
    const text = await this.totalDisplay.textContent();
    return text?.replace('Total:', '').trim() || '0';
  }

  /**
   * Get expense at specific index
   */
  async getExpenseByIndex(index: number): Promise<Locator> {
    const items = await this.page.getByRole('button', { name: /₹/i }).all();
    // Skip header row (index 0)
    return items[index + 1];
  }

  /**
   * Click edit button for expense
   */
  async clickEdit(id: string): Promise<void> {
    await this.page.getByTestId(`edit-${id}`).click();
  }

  /**
   * Click delete button for expense
   */
  async clickDelete(id: string): Promise<void> {
    await this.page.getByTestId(`delete-${id}`).click();
  }

  /**
   * Check if today button is disabled
   */
  async isTodayButtonDisabled(): Promise<boolean> {
    return await this.todayButton.isDisabled();
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

  // ─── Accordion helpers (day view) ─────────────────────────────────────────

  /**
   * Returns locators for expense accordion items (excludes the non-interactive
   * header and footer rows that have no expand icon).
   */
  getExpenseAccordions() {
    return this.page
      .locator('.MuiAccordion-root')
      .filter({ has: this.page.locator('.MuiAccordionSummary-expandIconWrapper') });
  }

  /**
   * Expands the expense accordion at the given 0-based index.
   */
  async expandAccordionAt(index: number): Promise<void> {
    await this.getExpenseAccordions().nth(index).click();
  }

  /**
   * Expands the accordion at `index` then clicks its Delete button.
   */
  async clickDeleteOnAccordion(index: number): Promise<void> {
    await this.expandAccordionAt(index);
    await this.getExpenseAccordions()
      .nth(index)
      .getByRole('button', { name: /delete/i })
      .click();
  }

  /**
   * Expands the accordion at `index` then clicks its Edit button.
   */
  async clickEditOnAccordion(index: number): Promise<void> {
    await this.expandAccordionAt(index);
    await this.getExpenseAccordions()
      .nth(index)
      .getByRole('button', { name: /edit/i })
      .click();
  }

  /**
   * Clicks the "Confirm delete expense" button in the delete confirmation dialog.
   */
  async confirmDelete(): Promise<void> {
    await this.page.getByRole('button', { name: 'Confirm delete expense' }).click();
  }

  /**
   * Clicks the "Cancel delete" button in the delete confirmation dialog.
   */
  async cancelDelete(): Promise<void> {
    await this.page.getByRole('button', { name: 'Cancel delete' }).click();
  }
}
