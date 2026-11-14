import { Page, Locator, expect } from '@playwright/test';

/** Page Object Model for the Search Expenses bottom sheet on the Expenses page. */
export class ExpenseSearchPage {
  readonly page: Page;
  readonly openButton: Locator;
  readonly heading: Locator;
  readonly input: Locator;
  readonly rows: Locator;
  readonly noResults: Locator;
  readonly keywordTab: Locator;
  readonly tagsTab: Locator;
  readonly tagInput: Locator;
  readonly tagTotal: Locator;
  readonly total: Locator;
  readonly tagNoResults: Locator;

  constructor(page: Page) {
    this.page = page;
    this.keywordTab = page.getByRole('tab', { name: 'Keyword' });
    this.tagsTab = page.getByRole('tab', { name: 'Tags' });
    this.tagInput = page.getByRole('combobox', { name: 'Select tags' });
    // Both tabs stay mounted, so only look at the total row of the visible tab
    this.total = page.getByTestId('search-total').locator('visible=true');
    this.tagTotal = this.total;
    this.tagNoResults = page.getByTestId('tag-no-results');
    this.openButton = page.getByRole('button', { name: 'Search expenses', exact: true });
    this.heading = page.getByRole('heading', { name: 'Search Expenses', exact: true });
    this.input = page.getByRole('combobox', { name: 'Spent On or keyword' });
    this.rows = page.getByTestId('search-result-row');
    this.noResults = page.getByTestId('search-no-results');
  }

  async open(): Promise<void> {
    // A click that lands before React hydrates is dropped, so retry until the sheet shows.
    await expect(async () => {
      if (!(await this.heading.isVisible())) {
        await this.openButton.click({ timeout: 2000 });
      }
      await expect(this.heading).toBeVisible({ timeout: 3000 });
    }).toPass({ timeout: 20000 });
  }

  /** Types into the search box without selecting anything. */
  async type(text: string): Promise<void> {
    await this.input.fill(text);
  }

  option(name: string | RegExp): Locator {
    return this.page.getByRole('option', { name });
  }

  /** Types `text` and picks the matching suggestion. */
  async selectSuggestion(text: string, optionName: string | RegExp): Promise<void> {
    await this.type(text);
    await this.option(optionName).click();
  }

  chip(label: string): Locator {
    return this.page.getByRole('button', { name: label, exact: true });
  }

  showMoreButton(): Locator {
    return this.page.getByRole('button', { name: /^Show more/ });
  }

  dayButton(rowIndex: number): Locator {
    return this.rows.nth(rowIndex).getByRole('button', { name: /^View expenses on/ });
  }

  /** Switches to the Tags tab. */
  async openTagsTab(): Promise<void> {
    await this.tagsTab.click();
    await expect(this.tagInput).toBeVisible();
  }

  /** Opens the tag list and picks one tag by its exact name (option text is "<name><count>"). */
  async selectTag(name: string): Promise<void> {
    await this.tagInput.click();
    await this.page.getByRole('option', { name: new RegExp(`^${name}\\s*\\d+$`) }).click();
  }

  /** Closes the topmost open sheet; lower sheets are aria-hidden, and its header Close precedes any snackbar Close. */
  async closeTopSheet(): Promise<void> {
    await this.page.getByRole('button', { name: 'Close', exact: true }).first().click();
  }
}
