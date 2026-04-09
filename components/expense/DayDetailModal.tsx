'use client';

import { useState, useEffect, forwardRef } from 'react';
import {
  Dialog,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Slide,
  Box,
  Grid,
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import CloseIcon from '@mui/icons-material/Close';
import ExpenseList from './ExpenseList';
import AddExpenseFab from './AddExpenseFab';
import { Expense } from '@/types/expense.types';
import { getExpensesByDay } from '@/utils/expenseStorage';

const SlideUpTransition = forwardRef(function SlideUpTransition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

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

  const heading = date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <Dialog fullScreen open={open} onClose={onClose} TransitionComponent={SlideUpTransition}>
      <AppBar sx={{ position: 'fixed' }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {heading}
          </Typography>
          <IconButton edge="end" color="inherit" onClick={onClose} aria-label="close">
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      {/* Spacer to push content below the fixed AppBar */}
      <Toolbar />
      <Grid container>
        <Grid item xs={12} md={6} sx={{ margin: '0.5rem' }}>
          <Box sx={{ padding: '1rem', backgroundColor: '#eaeeef' }}>
            <ExpenseList
              expenses={expenses}
              total={total}
              onEdit={(id) => console.log('Edit:', id)}
              onDelete={(id) => console.log('Delete:', id)}
            />
          </Box>
        </Grid>
      </Grid>
      <AddExpenseFab viewMode="day" currentDate={date} />
    </Dialog>
  );
}
