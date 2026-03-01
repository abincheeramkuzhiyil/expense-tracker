'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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

function ExpensesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize from URL search params or defaults
  const viewParam = searchParams.get('view') as ViewMode | null;
  const dateParam = searchParams.get('date');

  const [viewMode, setViewMode] = useState<ViewMode>(
    viewParam && ['day', 'month', 'year'].includes(viewParam) ? viewParam : 'day'
  );
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    if (dateParam) {
      const parsed = new Date(dateParam);
      return isNaN(parsed.getTime()) ? new Date() : parsed;
    }
    return new Date();
  });
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

  // Sync state with URL params on mount and when params change
  useEffect(() => {
    if (viewParam && ['day', 'month', 'year'].includes(viewParam)) {
      setViewMode(viewParam);
    }
    if (dateParam) {
      const parsed = new Date(dateParam);
      if (!isNaN(parsed.getTime())) {
        setCurrentDate(parsed);
      }
    }
  }, [viewParam, dateParam]);

  const handleViewChange = (event: SelectChangeEvent) => {
    const newMode = event.target.value as ViewMode;
    setViewMode(newMode);
    const dateStr = currentDate.toISOString().split('T')[0];
    router.push(`/expenses?view=${newMode}&date=${dateStr}`);
  };

  const handleDateChange = (newDate: Date) => {
    setCurrentDate(newDate);
    const dateStr = newDate.toISOString().split('T')[0];
    router.push(`/expenses?view=${viewMode}&date=${dateStr}`);
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

        <AddExpenseFab viewMode={viewMode} currentDate={currentDate} />
      </Container>
    </Box>
  );
}

export default function ExpensesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ExpensesPageContent />
    </Suspense>
  );
}
