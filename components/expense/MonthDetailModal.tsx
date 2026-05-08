'use client';

import { useState, useEffect } from 'react';
import { Box, Grid } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AddIcon from '@mui/icons-material/Add';
import StandardBottomSheet from '@/components/common/StandardBottomSheet';
import MonthDayTable from './MonthDayTable';
import AddExpenseFab from './AddExpenseFab';
import AddExpenseForm, { ExpenseFormData } from './AddExpenseForm';
import { Expense } from '@/types/expense.types';
import { getExpensesByMonth, subscribeToExpenseChanges, saveExpense } from '@/utils/expenseStorage';

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
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  // SwipeableDrawer keeps children mounted when closed, so AddExpenseForm's useState
  // initializers only run once. Without a key change, reopening the drawer shows stale
  // values from the previous entry. Incrementing this key on each open forces React to
  // unmount and remount AddExpenseForm with a fresh state every time.
  const [addFormKey, setAddFormKey] = useState(0);

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

  function handleAddSave(formData: ExpenseFormData) {
    saveExpense(formData);
    setIsAddFormOpen(false);
  }

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
      <AddExpenseFab viewMode="month" currentDate={new Date(year, month - 1, 1)} onAddExpense={() => { setAddFormKey(k => k + 1); setIsAddFormOpen(true); }} />
      <StandardBottomSheet
        open={isAddFormOpen}
        onClose={() => setIsAddFormOpen(false)}
        title="Add Expense"
        icon={<AddIcon fontSize="small" sx={{ color: 'primary.contrastText' }} />}
      >
        <Box sx={{ p: 2 }}>
          <AddExpenseForm
            key={addFormKey}
            defaultDate={new Date(year, month - 1, 1)}
            viewMode="month"
            onSave={handleAddSave}
            onCancel={() => setIsAddFormOpen(false)}
          />
        </Box>
      </StandardBottomSheet>
    </StandardBottomSheet>
  );
}
