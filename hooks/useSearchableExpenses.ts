'use client';

import { useEffect, useState } from 'react';
import { StoredExpense } from '@/types/expense.types';
import { getAllStoredExpenses, subscribeToExpenseChanges } from '@/utils/expenseStorage';

/** All approved expenses, loaded while `enabled` and kept in sync with storage changes. */
export function useSearchableExpenses(enabled: boolean): StoredExpense[] {
  const [expenses, setExpenses] = useState<StoredExpense[]>([]);

  useEffect(() => {
    if (!enabled) return;
    const refresh = () => setExpenses(getAllStoredExpenses());
    refresh();
    return subscribeToExpenseChanges(refresh);
  }, [enabled]);

  return expenses;
}
