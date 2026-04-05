# Plan: Playwright E2E Testing Implementation

Comprehensive end-to-end test suite using Playwright for the expense tracker application. Tests will cover all implemented features including navigation, expense viewing with date/view filtering, add expense workflow, form validation, and localStorage integration. Setup includes TypeScript configuration, test utilities for localStorage seeding, custom fixtures for common operations, and Page Object Model pattern for maintainability. Tests will run in Chromium only for faster execution during initial development.

## Steps

### 1. Install Playwright and dependencies
- Add `@playwright/test` and `@types/node` as dev dependencies in `package.json`
- Add test scripts: `test:e2e` (run tests), `test:e2e:ui` (UI mode), `test:e2e:debug` (debug mode), `test:e2e:report` (show report)
- Run `npx playwright install chromium` to install only Chromium browser

### 2. Create Playwright configuration at root `playwright.config.ts`
- Use TypeScript for type safety
- Set `testDir: './e2e'` for test files location
- Configure 1 project: Chromium only
- Set `baseURL: 'http://localhost:3000'` for development server
- Enable `webServer` to auto-start Next.js dev server before tests
- Set `use.storageState` to handle localStorage seeding
- Configure reporters: HTML and list (for CI compatibility)
- Set reasonable timeouts (30s test timeout, 60s for server start)
- Enable screenshot/video on failure for debugging

### 3. Create test utilities directory `e2e/utils/`
- **`storage-helper.ts`**: Export `seedLocalStorage()` function to inject localStorage data (expenses array, categories array) into browser context
- **`date-helper.ts`**: Export `formatDate()`, `getFirstOfMonth()`, `getFirstOfYear()` functions for consistent date formatting across tests
- **`test-data.ts`**: Export sample expense objects with various dates/categories matching seedData structure, export default category list

### 4. Create Page Object Models in `e2e/pages/`
- **`HomePage.ts`**: Class with constructor accepting `page: Page`, methods: `navigate()`, `getGreeting()`, `navigateToExpenses()` via drawer
- **`ExpensesPage.ts`**: Class with methods: `navigate()`, `selectViewMode(mode)`, `clickPrevious()`, `clickNext()`, `clickToday()`, `clickAddFab()`, `getExpenseCount()`, `getTotal()`, `getExpenseByIndex(index)`, `clickEdit(id)`, `clickDelete(id)`
- **`AddExpensePage.ts`**: Class with methods: `navigate()`, `fillDate(date)`, `selectCategory(category)`, `fillAmount(amount)`, `fillDescription(text)`, `clickSave()`, `clickCancel()`, `clickBack()`, `getDateValue()`, `hasInfoAlert()`
- **`NavigationDrawer.ts`**: Class with methods: `open()`, `close()`, `clickHome()`, `clickExpenses()`, `isActiveRoute(route)`

### 5. Create test fixtures in `e2e/fixtures/`
- **`base-fixture.ts`**: Custom Playwright fixture extending base test with `cleanLocalStorage` fixture that clears localStorage before each test, `seedExpenses` fixture that pre-loads test expense data
- Export typed `test` and `expect` objects for use in all test files

### 6. Write test suite `e2e/home.spec.ts`
- Test: navigate to home page displays greeting
- Test: navigation drawer opens and highlights home as active
- Test: navigate to expenses via drawer updates URL and page content

### 7. Write test suite `e2e/navigation.spec.ts`
- Test: drawer menu opens on mobile viewport
- Test: clicking home/expenses navigates correctly
- Test: active route highlighting works
- Test: drawer closes after navigation on mobile

### 8. Write test suite `e2e/expenses-view.spec.ts`
- Test: loads expenses from localStorage on page load
- Test: empty state displays when no expenses
- Test: changing view mode (day/month/year) filters correctly
- Test: date navigation (prev/next/today) updates display
- Test: total calculation displays correctly
- Test: URL params sync with view mode and date changes
- Test: direct URL navigation with params initializes state correctly (e.g., `/expenses?view=month&date=2026-01-15`)
- Test: today button disabled when viewing current date

### 9. Write test suite `e2e/add-expense.spec.ts`
- Test: FAB navigation preserves view mode and date in URL
- Test: form displays with correct default date for each view mode (day/month/year)
- Test: info alert appears for month/year views about date defaulting
- Test: back button returns to expenses page with preserved context
- Test: cancel button returns to expenses page with preserved context

### 10. Write test suite `e2e/expense-form-validation.spec.ts`
- Test: empty form shows validation errors on save attempt
- Test: amount field requires positive number
- Test: amount field accepts 2 decimal places
- Test: date field is required
- Test: category field is required
- Test: category autocomplete filters existing categories
- Test: typing new category shows info alert about new category
- Test: description field is optional and accepts multiline

### 11. Write test suite `e2e/expense-category-persistence.spec.ts`
- Test: new category persists to localStorage after form save
- Test: new category appears in autocomplete on next add
- Test: localStorage categories merge with defaults correctly

### 12. Write test suite `e2e/responsive.spec.ts`
- Test: mobile viewport (375px) - drawer menu button visible
- Test: tablet viewport (768px) - layout adjusts properly
- Test: desktop viewport (1920px) - full navigation visible
- Test: expense list readable on all viewports

### 13. Create test documentation `e2e/README.md`
- Document how to run tests (npm scripts)
- Explain test structure and Page Object Model pattern
- List environment requirements
- Describe CI/CD integration points
- Add troubleshooting section for common issues
- Note Chromium-only setup with instructions for adding more browsers later

### 14. Add `.gitignore` entries for Playwright
- Add `/test-results/` for test output
- Add `/playwright-report/` for HTML reports
- Add `/playwright/.cache/` for browser binaries cache

### 15. Update `skills/skill.md`
- Update "Testing Strategy" section with Playwright implementation details
- Mark E2E testing as implemented in appropriate section
- Add reference to test documentation

## Verification

1. Run `npm install` to install Playwright dependencies
2. Run `npx playwright install chromium` to install Chromium browser
3. Run `npm run test:e2e` - all tests should pass in Chromium
4. Run `npm run test:e2e:ui` - Playwright UI should open showing test tree
5. Verify test runs only in Chromium browser
6. Check test report with `npm run test:e2e:report` - HTML report should open
7. Intentionally break a feature (e.g., comment out FAB button) - tests should fail appropriately
8. Verify screenshots/videos captured on failure in `test-results/` directory
9. Test in CI environment simulation: run with `CI=true npm run test:e2e`
10. Verify TypeScript compilation: `npx tsc --noEmit` on test files
11. Run specific test file: `npx playwright test e2e/expenses-view.spec.ts` - should execute only that suite
12. Verify webServer auto-starts Next.js before running tests

## Decisions

- **Test directory structure**: `/e2e` at root level (separate from `/app`) for clear separation between application and test code, following common Playwright convention
- **Page Object Model**: Improves maintainability and reduces duplication when selectors or page structure changes
- **Custom fixtures**: Provides reusable localStorage seeding to avoid repetitive setup in every test, ensures clean state
- **TypeScript for tests**: Matches project standards from `skills/skill.md`, provides type safety and autocomplete
- **Chromium-only testing**: Single browser for faster test execution during initial development, can easily add Firefox and WebKit later by adding projects to config
- **Auto webServer**: Playwright auto-starts/stops Next.js dev server, eliminating manual server management
- **Test data separation**: Centralized in `e2e/utils/test-data.ts` for consistency, reuses patterns from `utils/seedData.ts`
- **No edit/delete tests**: These features only console.log per research findings, will add tests when functionality implemented
- **No expense save persistence tests**: Form validation works but actual expense saving not implemented yet (per research)
- **HTML + list reporters**: HTML for detailed local debugging, list for clean CI output
- **Storage state approach**: Using custom fixtures instead of `storageState` file for dynamic test data injection per test needs
