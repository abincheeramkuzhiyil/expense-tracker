/**
 * Sample Expense Data Seeder
 * 
 * This utility provides sample expense data for testing and development.
 * Usage: Import and call seedExpenses() to populate localStorage with sample data.
 */

import { Expense } from '@/types/expense.types';

export const sampleExpenses: Expense[] = [
  {
    id: '1',
    amount: 1001.00,
    category: 'test',
    date: new Date('2026-02-15'),
    description: 'www',
    source: 'manual',
    createdAt: new Date('2026-02-15T10:00:00'),
    updatedAt: new Date('2026-02-15T10:00:00'),
  },
  {
    id: '2',
    amount: 250.50,
    category: 'Groceries',
    date: new Date('2026-02-15'),
    description: 'Weekly grocery shopping',
    source: 'manual',
    createdAt: new Date('2026-02-15T11:00:00'),
    updatedAt: new Date('2026-02-15T11:00:00'),
  },
  {
    id: '3',
    amount: 45.00,
    category: 'Transportation',
    date: new Date('2026-02-14'),
    description: 'Uber ride to office',
    source: 'sms',
    createdAt: new Date('2026-02-14T09:00:00'),
    updatedAt: new Date('2026-02-14T09:00:00'),
  },
  {
    id: '4',
    amount: 120.00,
    category: 'Dining',
    date: new Date('2026-02-14'),
    description: 'Dinner at restaurant',
    source: 'manual',
    createdAt: new Date('2026-02-14T20:00:00'),
    updatedAt: new Date('2026-02-14T20:00:00'),
  },
  {
    id: '5',
    amount: 500.00,
    category: 'Entertainment',
    date: new Date('2026-02-13'),
    description: 'Concert tickets',
    source: 'manual',
    createdAt: new Date('2026-02-13T15:00:00'),
    updatedAt: new Date('2026-02-13T15:00:00'),
  },
];

/**
 * Seeds the localStorage with sample expense data
 * Warning: This will overwrite existing expense data
 */
export const seedExpenses = (): void => {
  try {
    localStorage.setItem('expenses', JSON.stringify(sampleExpenses));
    console.log('✅ Sample expenses seeded successfully!');
    console.log(`📊 Added ${sampleExpenses.length} sample expenses`);
  } catch (error) {
    console.error('❌ Error seeding expenses:', error);
  }
};

/**
 * Clears all expense data from localStorage
 */
export const clearExpenses = (): void => {
  try {
    localStorage.removeItem('expenses');
    console.log('🗑️ All expenses cleared from storage');
  } catch (error) {
    console.error('❌ Error clearing expenses:', error);
  }
};

/**
 * Gets the current number of expenses in storage
 */
export const getExpenseCount = (): number => {
  try {
    const stored = localStorage.getItem('expenses');
    if (!stored) return 0;
    const expenses = JSON.parse(stored);
    return Array.isArray(expenses) ? expenses.length : 0;
  } catch (error) {
    console.error('❌ Error counting expenses:', error);
    return 0;
  }
};

// For browser console access (development only)
if (typeof window !== 'undefined') {
  (window as any).expenseSeeder = {
    seed: seedExpenses,
    clear: clearExpenses,
    count: getExpenseCount,
    samples: sampleExpenses,
  };
}
