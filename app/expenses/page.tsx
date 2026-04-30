'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Alert,
  Badge,
  Box,
  Button,
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
import MonthDayTable from '@/components/expense/MonthDayTable';
import YearSummaryTable from '@/components/expense/YearSummaryTable';
import AddExpenseFab from '@/components/expense/AddExpenseFab';
import PendingExpenseReview from '@/components/expense/PendingExpenseReview';
import { Expense, ViewMode } from '@/types/expense.types';
import { getExpensesByDay, getExpensesByMonth, getExpensesByYear, subscribeToExpenseChanges } from '@/utils/expenseStorage';
import { usePendingExpenses } from '@/hooks/usePendingExpenses';

function ExpensesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { pending } = usePendingExpenses();
  const [reviewOpen, setReviewOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Initialize from URL search params or defaults
  const viewParam = searchParams.get('view') as ViewMode | null;
  const dateParam = searchParams.get('date');
  const reviewParam = searchParams.get('review');

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

  // Load expenses for the current view mode and date
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    if (viewMode === 'day') {
      setExpenses(getExpensesByDay(currentDate));
    } else if (viewMode === 'month') {
      setExpenses(getExpensesByMonth(year, month));
    } else {
      setExpenses(getExpensesByYear(year));
    }
  }, [viewMode, currentDate]);

  // Re-fetch whenever any expense is created, edited, or deleted (e.g. from DayDetailModal)
  useEffect(() => {
    return subscribeToExpenseChanges(() => {
      if (typeof window === 'undefined') return;
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      if (viewMode === 'day') {
        setExpenses(getExpensesByDay(currentDate));
      } else if (viewMode === 'month') {
        setExpenses(getExpensesByMonth(year, month));
      } else {
        setExpenses(getExpensesByYear(year));
      }
    });
  }, [viewMode, currentDate]);

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

  // Auto-open the review modal when navigated from a notification (?review=1)
  useEffect(() => {
    if (reviewParam === '1') {
      setReviewOpen(true);
    }
  }, [reviewParam]);

  // Re-show the banner whenever new pending items arrive after the user dismissed it.
  const previousCount = useRef(pending.length);
  useEffect(() => {
    if (pending.length > previousCount.current) {
      setBannerDismissed(false);
    }
    previousCount.current = pending.length;
  }, [pending.length]);

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

  const total = expenses.reduce((sum: number, exp: Expense) => sum + exp.amount, 0);

  // Stable callback for ExpenseList to trigger a day-view refresh
  const handleExpensesChanged = useCallback(() => {
    setExpenses(getExpensesByDay(currentDate));
  }, [currentDate]);

  return (
    <Box sx={{ marginY: '0.5rem' }}>
      <Container maxWidth="lg">
        {/* Pending review banner */}
        {pending.length > 0 && !bannerDismissed && (
          <Alert
            severity="info"
            sx={{ mb: 2 }}
            icon={<Badge badgeContent={pending.length} color="primary" />}
            action={
              <>
                <Button color="inherit" size="small" onClick={() => setReviewOpen(true)}>
                  Review
                </Button>
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => setBannerDismissed(true)}
                  aria-label="Dismiss banner"
                >
                  ✕
                </Button>
              </>
            }
          >
            You have {pending.length} expense{pending.length === 1 ? '' : 's'} to review and approve.
          </Alert>
        )}

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
              {viewMode === 'day' && (
                <ExpenseList
                  expenses={expenses}
                  total={total}
                  onExpensesChanged={handleExpensesChanged}
                />
              )}
              {viewMode === 'month' && (
                <MonthDayTable
                  year={currentDate.getFullYear()}
                  month={currentDate.getMonth() + 1}
                  expenses={expenses}
                />
              )}
              {viewMode === 'year' && (
                <YearSummaryTable
                  year={currentDate.getFullYear()}
                  expenses={expenses}
                />
              )}
            </Box>
          </Grid>
        </Grid>

        <AddExpenseFab viewMode={viewMode} currentDate={currentDate} />
      </Container>

      <PendingExpenseReview open={reviewOpen} onClose={() => setReviewOpen(false)} />
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
