'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import DateNavigation from '@/components/expense/DateNavigation';
import ExpenseList from '@/components/expense/ExpenseList';
import AddExpenseFab from '@/components/expense/AddExpenseFab';
import { Expense, ViewMode } from '@/types/expense.types';

export default function ExpensesPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Load expenses from localStorage
  useEffect(() => {
    const storedExpenses = localStorage.getItem('expenses');
    if (storedExpenses) {
      const parsed = JSON.parse(storedExpenses);
      setExpenses(
        parsed.map((exp: any) => ({
          ...exp,
          date: new Date(exp.date),
          createdAt: new Date(exp.createdAt),
          updatedAt: new Date(exp.updatedAt),
        }))
      );
    }
  }, []);

  const handleViewChange = (event: SelectChangeEvent) => {
    setViewMode(event.target.value as ViewMode);
  };

  const handleDateChange = (newDate: Date) => {
    setCurrentDate(newDate);
  };

  const handleAddExpense = () => {
    // TODO: Implement add expense dialog
    console.log('Add expense clicked');
  };

  // Filter expenses based on current date and view mode
  const filteredExpenses = expenses.filter((expense: Expense) => {
    const expenseDate = new Date(expense.date);
    if (viewMode === 'day') {
      return expenseDate.toDateString() === currentDate.toDateString();
    } else if (viewMode === 'month') {
      return (
        expenseDate.getMonth() === currentDate.getMonth() &&
        expenseDate.getFullYear() === currentDate.getFullYear()
      );
    } else {
      return expenseDate.getFullYear() === currentDate.getFullYear();
    }
  });

  const total = filteredExpenses.reduce((sum: number, exp: Expense) => sum + exp.amount, 0);

  return (
    <Box sx={{ marginY: '0.5rem' }}>
      <Container maxWidth="lg">
        <Grid container spacing={2}>
          <Grid item xs={6} md={3}>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', marginTop: '0.8rem' }}>
              Expenses
            </Typography>
          </Grid>
          <Grid item xs={6} md={3} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <FormControl variant="standard">
              <InputLabel id="view-select-label">View</InputLabel>
              <Select
                labelId="view-select-label"
                id="view-select"
                value={viewMode}
                onChange={handleViewChange}
                label="View"
              >
                <MenuItem value="day">Day</MenuItem>
                <MenuItem value="month">Month</MenuItem>
                <MenuItem value="year">Year</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={12} md={6}>
            <Box sx={{ padding: '1rem', backgroundColor: '#eaeeef' }}>
              <DateNavigation
                currentDate={currentDate}
                viewMode={viewMode}
                onDateChange={handleDateChange}
                total={total}
              />
              <br />
              <ExpenseList
                expenses={filteredExpenses}
                total={total}
                onEdit={(id) => console.log('Edit:', id)}
                onDelete={(id) => console.log('Delete:', id)}
              />
            </Box>
          </Grid>
        </Grid>

        <AddExpenseFab onClick={handleAddExpense} />
      </Container>
    </Box>
  );
}
