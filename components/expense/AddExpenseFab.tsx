'use client';

import { useRouter } from 'next/navigation';
import { Fab } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { ViewMode } from '@/types/expense.types';

interface AddExpenseFabProps {
  viewMode: ViewMode;
  currentDate: Date;
}

export default function AddExpenseFab({ viewMode, currentDate }: AddExpenseFabProps) {
  const router = useRouter();

  const handleAddExpense = () => {
    const dateStr = currentDate.toISOString().split('T')[0];
    router.push(`/expenses/add?view=${viewMode}&date=${dateStr}`);
  };

  return (
    <Fab
      color="primary"
      aria-label="add"
      sx={{
        position: 'fixed',
        bottom: 16,
        right: 16,
      }}
      onClick={handleAddExpense}
    >
      <AddIcon />
    </Fab>
  );
}
