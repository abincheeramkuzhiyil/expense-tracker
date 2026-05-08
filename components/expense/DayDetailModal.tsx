'use client';

import { useState, useEffect, useCallback } from 'react';
import { Box, Grid } from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import AddIcon from '@mui/icons-material/Add';
import StandardBottomSheet from '@/components/common/StandardBottomSheet';
import ExpenseList from './ExpenseList';
import AddExpenseFab from './AddExpenseFab';
import AddExpenseForm, { ExpenseFormData } from './AddExpenseForm';
import { Expense } from '@/types/expense.types';
import { getExpensesByDay, saveExpense } from '@/utils/expenseStorage';

interface DayDetailModalProps {
  open: boolean;
  date: Date;
  onClose: () => void;
}

export default function DayDetailModal({ open, date, onClose }: DayDetailModalProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  // SwipeableDrawer keeps children mounted when closed, so AddExpenseForm's useState
  // initializers only run once. Without a key change, reopening the drawer shows stale
  // values from the previous entry. Incrementing this key on each open forces React to
  // unmount and remount AddExpenseForm with a fresh state every time.
  const [addFormKey, setAddFormKey] = useState(0);

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

  function handleAddSave(formData: ExpenseFormData) {
    saveExpense(formData);
    setIsAddFormOpen(false);
    setExpenses(getExpensesByDay(date));
  }

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
      <AddExpenseFab viewMode="day" currentDate={date} onAddExpense={() => { setAddFormKey(k => k + 1); setIsAddFormOpen(true); }} />
      <StandardBottomSheet
        open={isAddFormOpen}
        onClose={() => setIsAddFormOpen(false)}
        title="Add Expense"
        icon={<AddIcon fontSize="small" sx={{ color: 'primary.contrastText' }} />}
      >
        <Box sx={{ p: 2 }}>
          <AddExpenseForm
            key={addFormKey}
            defaultDate={date}
            viewMode="day"
            onSave={handleAddSave}
            onCancel={() => setIsAddFormOpen(false)}
          />
        </Box>
      </StandardBottomSheet>
    </StandardBottomSheet>
  );
}
