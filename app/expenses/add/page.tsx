'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Container,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddExpenseForm, { ExpenseFormData } from '@/components/expense/AddExpenseForm';
import { ViewMode } from '@/types/expense.types';
import { addNewCategory, getCategories } from '@/utils/expenseCategories';

function AddExpensePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Extract view and date from search params with fallback defaults
  const viewParam = searchParams.get('view') as ViewMode | null;
  const dateParam = searchParams.get('date');

  const viewMode: ViewMode =
    viewParam && ['day', 'month', 'year'].includes(viewParam) ? viewParam : 'day';

  // Calculate default date based on view mode
  const defaultDate = calculateDefaultDate(dateParam, viewMode);

  function calculateDefaultDate(dateStr: string | null, mode: ViewMode): Date {
    let baseDate = new Date();

    if (dateStr) {
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) {
        baseDate = parsed;
      }
    }

    // Adjust date based on view mode
    if (mode === 'month') {
      // First day of the month
      return new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
    } else if (mode === 'year') {
      // First day of the year
      return new Date(baseDate.getFullYear(), 0, 1);
    } else {
      // Day view - use the date as-is
      return baseDate;
    }
  }

  function handleBack() {
    const dateStr = dateParam || new Date().toISOString().split('T')[0];
    router.push(`/expenses?view=${viewMode}&date=${dateStr}`);
  }

  function handleCancel() {
    handleBack();
  }

  function handleSave(formData: ExpenseFormData) {
    // Check if the category is new and add it to localStorage
    const existingCategories = getCategories();
    const categoryExists = existingCategories.some(
      (cat) => cat.toLowerCase() === formData.category.toLowerCase()
    );

    if (!categoryExists) {
      addNewCategory(formData.category);
    }

    // TODO: Add expense data persistence (not implemented yet)
    console.log('Expense data to save:', formData);

    // Navigate back to expenses page
    handleBack();
  }

  return (
    <Box>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={handleBack}
            aria-label="back"
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" component="h1">
            Add Expense
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 3 }}>
        <AddExpenseForm
          defaultDate={defaultDate}
          viewMode={viewMode}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </Container>
    </Box>
  );
}

export default function AddExpensePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AddExpensePageContent />
    </Suspense>
  );
}
