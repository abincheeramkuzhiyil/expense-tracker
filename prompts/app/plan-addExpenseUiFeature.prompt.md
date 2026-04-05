# Plan: Add Expense UI Feature

This plan implements a standalone Add Expense page with a reusable form component. The page will capture expense details (date, category, amount, description) with smart defaults based on the current view mode, using URL search params to preserve navigation context. Category management will use a filterable autocomplete with localStorage for persistence, and all navigation will maintain the user's view state.

## Steps

### 1. Create expense categories utility at `utils/expenseCategories.ts`
- Export `DEFAULT_CATEGORIES` array: `['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Healthcare', 'Education', 'Other']`
- Export `getCategories()` function to fetch from localStorage (key: `'expenseCategories'`), fallback to defaults
- Export `saveCategories(categories: string[])` function to persist to localStorage
- Export `addNewCategory(category: string)` function to append and save unique category

### 2. Create AddExpenseForm component at `components/expense/AddExpenseForm.tsx`
- Accept props: `defaultDate: Date`, `viewMode: ViewMode`, `onSave: (formData) => void`, `onCancel: () => void`
- Use MUI `TextField`, `Autocomplete`, `Button` components
- **Date field**: Required, use `TextField` with `type="date"`, default to `defaultDate` prop formatted as YYYY-MM-DD
- Show conditional note above date field when `viewMode === 'month'` or `viewMode === 'year'` using `Alert` severity="info" with appropriate message
- **Category field**: Required, use `Autocomplete` with `freeSolo={true}`, load categories via `getCategories()`, show helper note when user types new category
- **Amount field**: Required, use `TextField` with `type="number"`, `inputProps={{ step: 0.01, min: 0 }}` for 2 decimals
- **Description field**: Optional, use `TextField` with `multiline rows={3}`
- Add form validation: check required fields, amount > 0
- **Action buttons**: Cancel (outlined variant) and Save (contained variant) right-aligned in ButtonGroup
- On Save: validate, call `onSave` with form data including category persistence check
- Style with Paper elevation={2}, padding, and consistent spacing using MUI Grid

### 3. Update FAB button navigation in `components/expense/AddExpenseFab.tsx`
- Import `useRouter` from `next/navigation`
- Replace `handleAddExpense` to call `router.push('/expenses/add?view=${viewMode}&date=${currentDate.toISOString().split('T')[0]}')`
- Accept props: `viewMode: ViewMode`, `currentDate: Date` from parent

### 4. Update Expenses page at `app/expenses/page.tsx`
- Import `useSearchParams` from `next/navigation` to read `view` and `date` from URL
- Initialize `viewMode` and `currentDate` from search params if present, otherwise use defaults
- Pass `viewMode` and `currentDate` props to `AddExpenseFab` component
- Update view mode and date change handlers to use `router.push` with search params to update URL

### 5. Create Add Expense page at `app/expenses/add/page.tsx`
- Mark as client component with `'use client'`
- Import `useSearchParams`, `useRouter` from `next/navigation`
- Extract `view` and `date` from search params (with fallback defaults: `view='day'`, `date=today`)
- Parse `viewMode` and calculate `defaultDate` based on view:
  - `day`: Use URL date as-is
  - `month`: First day of URL date's month
  - `year`: First day of URL date's year
- **Page layout**: Container with AppBar containing back IconButton (left) and "Add Expense" Typography (h5), then AddExpenseForm component
- **Back button**: Navigate to `/expenses?view=${view}&date=${date}` to preserve state
- **onCancel**: Same navigation as back button
- **onSave**: Call `addNewCategory()` if new category detected, then navigate back (NO data persistence yet - just validation and category storage)

### 6. Update Expenses page search params in `app/expenses/page.tsx`
- Wrap page in Suspense boundary due to `useSearchParams` usage
- When view mode dropdown changes, call `router.push('/expenses?view=${newMode}&date=${currentDate.toISOString().split('T')[0]}')`
- When date navigation (prev/next/today) changes, call `router.push('/expenses?view=${viewMode}&date=${newDate.toISOString().split('T')[0]}')`
- Ensure DateNavigation component receives current values

## Verification

1. Navigate to expenses page, select different view modes (Day/Month/Year) and dates
2. Click Add Expense FAB - should navigate to `/expenses/add` with correct search params
3. Verify date field defaults correctly for each view mode
4. Verify note appears for month/year views about date defaulting
5. Test category autocomplete: filter existing, type new category
6. Verify new category note appears when typing non-existent category
7. Enter amount with decimals (should allow 2 decimal places only)
8. Enter description (optional, multiline)
9. Click Cancel or Back - should return to expenses page with preserved view mode and date
10. Click Save with validation errors - should show error states
11. Click Save with valid data - should persist new category to localStorage and navigate back
12. Return to expenses page - verify view mode and date are preserved in URL and UI

## Decisions

- **Route structure**: Using `/expenses/add` with search params for clean separation and RESTful conventions
- **Component separation**: AddExpenseForm as reusable component enables future dialog/modal implementation without code duplication
- **Category storage**: localStorage with key `'expenseCategories'` as array, separate from expense data
- **URL search params schema**: `view` (day|month|year) and `date` (YYYY-MM-DD format) for consistent date handling
- **Date defaulting logic**: Calculated in Add Expense page based on view mode to keep form component simpler
- **Form validation**: Client-side only for now, no backend validation needed
- **MUI Autocomplete**: Using `freeSolo` prop allows typing new categories while providing suggestions
