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
    this.menuButton = page.getByRole('button', { name: /open drawer/i });
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
    // Open drawer
    await this.menuButton.click();
    // Wait for the MUI Drawer paper to be visible
    await this.page.locator('.MuiDrawer-paper').waitFor({ state: 'visible' });
    await this.page.getByRole('button', { name: /expenses/i }).click();
  }
}
