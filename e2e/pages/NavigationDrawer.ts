import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for the Navigation Drawer
 */
export class NavigationDrawer {
  readonly page: Page;
  readonly menuButton: Locator;
  readonly drawer: Locator;
  readonly homeLink: Locator;
  readonly expensesLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.menuButton = page.getByRole('button', { name: /menu/i });
    this.drawer = page.getByRole('navigation');
    this.homeLink = page.getByRole('link', { name: /home/i });
    this.expensesLink = page.getByRole('link', { name: /expenses/i });
  }

  /**
   * Open the navigation drawer (on mobile)
   */
  async open(): Promise<void> {
    if (await this.menuButton.isVisible()) {
      await this.menuButton.click();
      await this.drawer.waitFor({ state: 'visible' });
    }
  }

  /**
   * Close the navigation drawer
   */
  async close(): Promise<void> {
    // Click outside the drawer or press Escape
    await this.page.keyboard.press('Escape');
  }

  /**
   * Click Home link
   */
  async clickHome(): Promise<void> {
    await this.open();
    await this.homeLink.click();
  }

  /**
   * Click Expenses link
   */
  async clickExpenses(): Promise<void> {
    await this.open();
    await this.expensesLink.click();
  }

  /**
   * Check if a route is active (highlighted)
   */
  async isActiveRoute(route: 'home' | 'expenses'): Promise<boolean> {
    await this.open();
    const link = route === 'home' ? this.homeLink : this.expensesLink;
    
    // Check if the link has some active styling
    // This might need adjustment based on actual implementation
    const bgColor = await link.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    
    // Active links typically have a different background color
    // Return true if not the default transparent/white
    return bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'rgb(255, 255, 255)';
  }

  /**
   * Check if drawer is visible
   */
  async isVisible(): Promise<boolean> {
    return await this.drawer.isVisible();
  }
}
