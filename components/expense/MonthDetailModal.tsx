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
import MonthDayTable from './MonthDayTable';
import AddExpenseFab from './AddExpenseFab';
import { Expense } from '@/types/expense.types';
import { getExpensesByMonth } from '@/utils/expenseStorage';

const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const SlideUpTransition = forwardRef(function SlideUpTransition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface MonthDetailModalProps {
  open: boolean;
  year: number;
  month: number; // 1-12
  onClose: () => void;
}

export default function MonthDetailModal({ open, year, month, onClose }: MonthDetailModalProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    if (open) {
      setExpenses(getExpensesByMonth(year, month));
    }
  }, [year, month, open]);

  const heading = `${SHORT_MONTHS[month - 1]} ${year}`;

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
            <MonthDayTable year={year} month={month} expenses={expenses} />
          </Box>
        </Grid>
      </Grid>
      <AddExpenseFab viewMode="month" currentDate={new Date(year, month - 1, 1)} />
    </Dialog>
  );
}
