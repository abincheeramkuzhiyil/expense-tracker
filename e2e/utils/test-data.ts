import { Expense } from '../../types/expense.types';

/**
 * Default categories for testing
 */
export const DEFAULT_CATEGORIES = [
  'Food',
  'Transport',
  'Shopping',
  'Entertainment',
  'Bills',
  'Healthcare',
  'Education',
  'Other',
];

/**
 * Sample expense data for testing
 */
export const SAMPLE_EXPENSES: Expense[] = [
  {
    id: '1',
    amount: 250.50,
    category: 'Food',
    date: new Date('2026-03-01'),
    description: 'Grocery shopping at supermarket',
    source: 'manual',
    status: 'approved',
    createdAt: new Date('2026-03-01T10:00:00'),
    updatedAt: new Date('2026-03-01T10:00:00'),
  },
  {
    id: '2',
    amount: 45.00,
    category: 'Transport',
    date: new Date('2026-03-01'),
    description: 'Taxi to office',
    source: 'manual',
    status: 'approved',
    createdAt: new Date('2026-03-01T09:00:00'),
    updatedAt: new Date('2026-03-01T09:00:00'),
  },
  {
    id: '3',
    amount: 120.75,
    category: 'Entertainment',
    date: new Date('2026-02-28'),
    description: 'Movie tickets and dinner',
    source: 'manual',
    status: 'approved',
    createdAt: new Date('2026-02-28T20:00:00'),
    updatedAt: new Date('2026-02-28T20:00:00'),
  },
  {
    id: '4',
    amount: 1500.00,
    category: 'Bills',
    date: new Date('2026-02-15'),
    description: 'Monthly rent payment',
    source: 'manual',
    status: 'approved',
    createdAt: new Date('2026-02-15T10:00:00'),
    updatedAt: new Date('2026-02-15T10:00:00'),
  },
  {
    id: '5',
    amount: 89.99,
    category: 'Shopping',
    date: new Date('2026-01-20'),
    description: 'New running shoes',
    source: 'manual',
    status: 'approved',
    createdAt: new Date('2026-01-20T15:30:00'),
    updatedAt: new Date('2026-01-20T15:30:00'),
  },
  {
    id: '6',
    amount: 350.00,
    category: 'Healthcare',
    date: new Date('2025-12-10'),
    description: 'Dental checkup',
    source: 'manual',
    status: 'approved',
    createdAt: new Date('2025-12-10T14:00:00'),
    updatedAt: new Date('2025-12-10T14:00:00'),
  },
];

/**
 * Today's expenses for current day testing (March 1, 2026)
 */
export const TODAY_EXPENSES: Expense[] = SAMPLE_EXPENSES.filter(
  (expense) => expense.date.toISOString().split('T')[0] === '2026-03-01'
);

/**
 * February 2026 expenses for month view testing
 */
export const FEBRUARY_EXPENSES: Expense[] = SAMPLE_EXPENSES.filter(
  (expense) => {
    const expenseDate = expense.date;
    return expenseDate.getFullYear() === 2026 && expenseDate.getMonth() === 1; // February is month 1
  }
);

/**
 * 2026 expenses for year view testing
 */
export const YEAR_2026_EXPENSES: Expense[] = SAMPLE_EXPENSES.filter(
  (expense) => expense.date.getFullYear() === 2026
);

/**
 * Creates a new expense object for testing
 */
export function createTestExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: Math.random().toString(36).substr(2, 9),
    amount: 100.00,
    category: 'Food',
    date: new Date(),
    description: 'Test expense',
    source: 'manual',
    status: 'approved',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}
