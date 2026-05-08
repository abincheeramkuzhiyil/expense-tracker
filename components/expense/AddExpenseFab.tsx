'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CircularProgress, Fab } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { ViewMode } from '@/types/expense.types';

interface AddExpenseFabProps {
  viewMode: ViewMode;
  currentDate: Date;
  /** When provided, called instead of navigating to /expenses/add (e.g. inside a modal). */
  onAddExpense?: () => void;
}

export default function AddExpenseFab({ viewMode, currentDate, onAddExpense }: AddExpenseFabProps) {
  const router = useRouter();
  const [navigating, setNavigating] = useState(false);

  useEffect(() => {
    if (!onAddExpense) {
      router.prefetch('/expenses/add');
    }
  }, [router, onAddExpense]);

  const handleAddExpense = () => {
    if (onAddExpense) {
      onAddExpense();
      return;
    }
    setNavigating(true);
    const dateStr = currentDate.toISOString().split('T')[0];
    router.push(`/expenses/add?view=${viewMode}&date=${dateStr}`);
  };

  return (
    <Fab
      color="primary"
      aria-label="add"
      disabled={navigating}
      sx={{
        position: 'fixed',
        bottom: 16,
        right: 16,
      }}
      onClick={handleAddExpense}
    >
      {navigating ? <CircularProgress size={24} color="inherit" /> : <AddIcon />}
    </Fab>
  );
}
