'use client';

import { useState, useEffect } from 'react';
import { Box, Grid } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import StandardBottomSheet from '@/components/common/StandardBottomSheet';
import MonthDayTable from './MonthDayTable';
import AddExpenseFab from './AddExpenseFab';
import { Expense } from '@/types/expense.types';
import { getExpensesByMonth, subscribeToExpenseChanges } from '@/utils/expenseStorage';

const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

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

  // Re-fetch whenever any expense changes while this modal is open (e.g. edit/delete in DayDetailModal)
  useEffect(() => {
    return subscribeToExpenseChanges(() => {
      if (open) {
        setExpenses(getExpensesByMonth(year, month));
      }
    });
  }, [open, year, month]);

  const heading = `${SHORT_MONTHS[month - 1]} ${year}`;

  return (
    <StandardBottomSheet
      open={open}
      onClose={onClose}
      title={heading}
      icon={<CalendarMonthIcon fontSize="small" sx={{ color: 'primary.contrastText' }} />}
    >
      <Grid container>
        <Grid item xs={12} md={6} sx={{ margin: '0.5rem' }}>
          <Box sx={{ padding: '1rem', backgroundColor: '#eaeeef' }}>
            <MonthDayTable year={year} month={month} expenses={expenses} />
          </Box>
        </Grid>
      </Grid>
      <AddExpenseFab viewMode="month" currentDate={new Date(year, month - 1, 1)} />
    </StandardBottomSheet>
  );
}
