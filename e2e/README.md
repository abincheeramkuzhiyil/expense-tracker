# E2E Testing with Playwright

This directory contains end-to-end tests for the Expense Tracker application using Playwright.

## Overview

The test suite covers all implemented features including:
- Navigation and routing
- Expense viewing with date/view filtering
- Add expense workflow
- Form validation
- Category persistence
- Responsive design across multiple viewports

## Test Structure

```
e2e/
├── fixtures/
│   └── base-fixture.ts          # Custom test fixtures for localStorage
├── pages/
│   ├── HomePage.ts              # Page Object for Home page
│   ├── ExpensesPage.ts          # Page Object for Expenses page
│   ├── AddExpensePage.ts        # Page Object for Add Expense page
│   └── NavigationDrawer.ts      # Page Object for Navigation drawer
├── utils/
│   ├── storage-helper.ts        # localStorage utilities
│   ├── date-helper.ts           # Date manipulation helpers
│   └── test-data.ts             # Test data and fixtures
├── home.spec.ts                 # Home page tests
├── navigation.spec.ts           # Navigation tests
├── expenses-view.spec.ts        # Expense viewing and filtering tests
├── add-expense.spec.ts          # Add expense navigation tests
├── expense-form-validation.spec.ts  # Form validation tests
├── expense-category-persistence.spec.ts  # Category localStorage tests
└── responsive.spec.ts           # Responsive design tests
```

## Running Tests

### Prerequisites

1. Install dependencies:
   ```bash
   npm install
   ```

2. Install Playwright browsers:
   ```bash
   npx playwright install chromium
   ```

### Test Commands

```bash
# Run all tests
npm run test:e2e

# Run tests with UI mode (interactive)
npm run test:e2e:ui

# Run tests in debug mode
npm run test:e2e:debug

# Show test report
npm run test:e2e:report

# Run specific test file
npx playwright test e2e/expenses-view.spec.ts

# Run tests matching a pattern
npx playwright test -g "should filter expenses"

# Run tests in headed mode (see browser)
npx playwright test --headed
```

## Page Object Model

This test suite uses the Page Object Model (POM) pattern for better maintainability:

- **Page Objects** (`e2e/pages/`): Encapsulate page structure and interaction methods
- **Test Files** (`e2e/*.spec.ts`): Focus on test logic using page objects
- **Utilities** (`e2e/utils/`): Shared helpers for common operations

### Example Usage

```typescript
import { test, expect } from './fixtures/base-fixture';
import { ExpensesPage } from './pages/ExpensesPage';
import { SAMPLE_EXPENSES } from './utils/test-data';

test('should display expenses', async ({ page, seedExpenses }) => {
  await seedExpenses(SAMPLE_EXPENSES);
  
  const expensesPage = new ExpensesPage(page);
  await expensesPage.navigate();
  
  const count = await expensesPage.getExpenseCount();
  expect(count).toBeGreaterThan(0);
});
```

## Custom Fixtures

### cleanLocalStorage
Automatically clears localStorage before each test to ensure clean state.

```typescript
// Enabled by default for all tests
test('my test', async ({ page }) => {
  // localStorage is already clean
});
```

### seedExpenses
Seeds localStorage with test expense data and categories.

```typescript
test('test with data', async ({ page, seedExpenses }) => {
  await seedExpenses(SAMPLE_EXPENSES, DEFAULT_CATEGORIES);
  // localStorage now contains test data
});
```

## Test Data

Pre-defined test data is available in `e2e/utils/test-data.ts`:

- `SAMPLE_EXPENSES`: Array of expense objects across different dates
- `FEBRUARY_EXPENSES`: Expenses for February 2026
- `YEAR_2026_EXPENSES`: All 2026 expenses
- `DEFAULT_CATEGORIES`: Default expense categories
- `createTestExpense()`: Helper to create custom expense objects

## Configuration

Test configuration is in `playwright.config.ts`:

- **Browser**: Chromium only (can add Firefox/WebKit later)
- **Base URL**: `http://localhost:3000`
- **Auto WebServer**: Automatically starts Next.js dev server before tests
- **Reporters**: HTML (for detailed reports) and List (for console output)
- **Timeout**: 30 seconds per test
- **Retries**: 2 on CI, 0 locally
- **Screenshots**: Captured on failure
- **Videos**: Recorded on failure

## CI/CD Integration

The test suite is CI-ready:

```bash
# Set CI environment variable
CI=true npm run test:e2e
```

CI mode:
- Runs tests serially (workers: 1)
- Enables retries (2 attempts)
- Fails build on `test.only`
- Doesn't reuse existing dev server

## Troubleshooting

### Tests Fail to Start

**Issue**: "Browser not found" error
**Solution**: Run `npx playwright install chromium`

**Issue**: "Port 3000 already in use"
**Solution**: Stop any running dev servers or set `reuseExistingServer: true` in config

### Tests Are Flaky

**Issue**: Tests pass/fail intermittently
**Solution**: 
- Add `await page.waitForTimeout(500)` after navigation
- Use `waitForSelector` instead of fixed timeouts
- Check for race conditions in async operations

### localStorage Not Persisting

**Issue**: Test data not available in browser
**Solution**: Ensure `seedExpenses` is called before navigation:
```typescript
await seedExpenses(data);
await expensesPage.navigate(); // Navigate AFTER seeding
```

### Selectors Not Found

**Issue**: "Element not found" errors
**Solution**:
- Check if element is in viewport (might need scroll)
- Verify element exists in current application state
- Use more specific selectors or test IDs

### Slow Test Execution

**Issue**: Tests take too long
**Solution**:
- Run specific test files instead of full suite
- Use `test.only()` during development
- Disable video recording for faster runs

## Adding More Browsers

Currently configured for Chromium only. To add more browsers:

1. Install browsers:
   ```bash
   npx playwright install firefox webkit
   ```

2. Update `playwright.config.ts`:
   ```typescript
   projects: [
     { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
     { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
     { name: 'webkit', use: { ...devices['Desktop Safari'] } },
   ],
   ```

3. Run tests:
   ```bash
   npm run test:e2e  # Runs on all browsers
   npx playwright test --project=firefox  # Run on specific browser
   ```

## Best Practices

1. **Use Page Objects**: Keep selectors and interactions in page objects, not test files
2. **Clean State**: Each test should be independent, use fixtures for setup
3. **Descriptive Tests**: Use clear test names that describe expected behavior
4. **Wait Properly**: Use `waitFor` methods instead of arbitrary timeouts
5. **Test Data**: Use predefined test data from `test-data.ts` for consistency
6. **Assertions**: Use specific assertions (`toBe`, `toContain`) over generic ones

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Page Object Model Guide](https://playwright.dev/docs/pom)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Test Fixtures](https://playwright.dev/docs/test-fixtures)

## Current Test Coverage

✅ **Implemented Tests:**
- Home page rendering and navigation
- Drawer navigation on mobile/desktop
- Expense viewing with day/month/year filters
- Date navigation (previous/next/today)
- URL state management and deep linking
- Add expense form navigation and context preservation
- Form validation (required fields, amount validation)
- Category autocomplete and persistence
- Responsive design (mobile/tablet/desktop viewports)

❌ **Not Tested (Features Not Implemented):**
- Edit expense functionality
- Delete expense functionality
- Expense data persistence (form submits but doesn't save to localStorage)
- SMS parsing
- Analytics features
- Budget tracking

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Playwright documentation
3. Check test output and screenshots in `test-results/`
4. Review HTML report with `npm run test:e2e:report`
