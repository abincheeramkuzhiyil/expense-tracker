'use client';

import { useState, useEffect, useCallback } from 'react';
import { Box, Grid } from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import StandardBottomSheet from '@/components/common/StandardBottomSheet';
import ExpenseList from './ExpenseList';
import AddExpenseFab from './AddExpenseFab';
import { Expense } from '@/types/expense.types';
import { getExpensesByDay } from '@/utils/expenseStorage';

interface DayDetailModalProps {
  open: boolean;
  date: Date;
  onClose: () => void;
}

export default function DayDetailModal({ open, date, onClose }: DayDetailModalProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    if (open) {
      setExpenses(getExpensesByDay(date));
    }
  }, [date, open]);

  const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Stable callback for ExpenseList to trigger a refresh of this day's expenses
  const handleExpensesChanged = useCallback(() => {
    setExpenses(getExpensesByDay(date));
  }, [date]);

  const heading = date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <StandardBottomSheet
      open={open}
      onClose={onClose}
      title={heading}
      icon={<EventIcon fontSize="small" sx={{ color: 'primary.contrastText' }} />}
    >
      <Grid container>
        <Grid item xs={12} md={6} sx={{ margin: '0.5rem' }}>
          <Box sx={{ padding: '1rem', backgroundColor: '#eaeeef' }}>
            <ExpenseList
              expenses={expenses}
              total={total}
              onExpensesChanged={handleExpensesChanged}
            />
          </Box>
        </Grid>
      </Grid>
      <AddExpenseFab viewMode="day" currentDate={date} />
    </StandardBottomSheet>
  );
}
