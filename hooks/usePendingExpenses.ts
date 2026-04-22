'use client';

import { useCallback, useEffect, useState } from 'react';
import { Expense } from '@/types/expense.types';
import {
  approveAllPending,
  approveExpense,
  getPendingExpenses,
  rejectExpense,
  subscribeToExpenseChanges,
} from '@/utils/expenseStorage';

interface UsePendingExpensesResult {
  pending: Expense[];
  approve: (id: string) => void;
  reject: (id: string) => void;
  approveAll: () => number;
  isLoaded: boolean;
}

/**
 * React hook giving the live list of expenses awaiting user review.
 *
 * Subscribes to the storage change emitter so the list stays in sync
 * across all consumers (banner, modal, list pages) without prop drilling.
 */
export function usePendingExpenses(): UsePendingExpensesResult {
  const [pending, setPending] = useState<Expense[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const refresh = useCallback(() => {
    setPending(getPendingExpenses());
  }, []);

  useEffect(() => {
    refresh();
    setIsLoaded(true);
    const unsubscribe = subscribeToExpenseChanges(refresh);
    return () => {
      unsubscribe();
    };
  }, [refresh]);

  const approve = useCallback((id: string) => {
    approveExpense(id);
  }, []);

  const reject = useCallback((id: string) => {
    rejectExpense(id);
  }, []);

  const approveAll = useCallback(() => approveAllPending(), []);

  return { pending, approve, reject, approveAll, isLoaded };
}
