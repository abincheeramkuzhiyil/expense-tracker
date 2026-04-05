import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for the Home page
 */
export class HomePage {
  readonly page: Page;
  readonly greeting: Locator;
  readonly menuButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.greeting = page.getByText('Hello User!');
    this.menuButton = page.getByRole('button', { name: /menu/i });
  }

  /**
   * Navigate to the home page
   */
  async navigate(): Promise<void> {
    await this.page.goto('/');
  }

  /**
   * Get the greeting text
   */
  async getGreeting(): Promise<string> {
    return await this.greeting.textContent() || '';
  }

  /**
   * Navigate to Expenses page via drawer
   */
  async navigateToExpenses(): Promise<void> {
    // Open drawer on mobile
    if (await this.menuButton.isVisible()) {
      await this.menuButton.click();
    }
    await this.page.getByRole('link', { name: /expenses/i }).click();
  }
}
