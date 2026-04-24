'use client';

import { useEffect } from 'react';
import { migrateLegacyPendingExpenses } from '@/utils/expenseStorage';

/**
 * Runs one-time data migrations on app startup. Renders nothing.
 *
 * Currently handles:
 * - Moving legacy pending expenses (stored inside year/month buckets with
 *   `status: 'pending'`) into the dedicated `expense-tracker-pending` queue.
 */
export default function MigrationProvider() {
  useEffect(() => {
    migrateLegacyPendingExpenses();
  }, []);

  return null;
}
