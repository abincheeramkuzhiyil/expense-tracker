'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CircularProgress, Fab } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { ViewMode } from '@/types/expense.types';

interface AddExpenseFabProps {
  viewMode: ViewMode;
  currentDate: Date;
}

export default function AddExpenseFab({ viewMode, currentDate }: AddExpenseFabProps) {
  const router = useRouter();
  const [navigating, setNavigating] = useState(false);

  useEffect(() => {
    router.prefetch('/expenses/add');
  }, [router]);

  const handleAddExpense = () => {
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
