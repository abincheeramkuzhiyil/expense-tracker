'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  Autocomplete,
  Button,
  Alert,
  Grid,
} from '@mui/material';
import { ViewMode } from '@/types/expense.types';
import { getCategories } from '@/utils/expenseCategories';

interface AddExpenseFormProps {
  defaultDate: Date;
  viewMode: ViewMode;
  onSave: (formData: ExpenseFormData) => void;
  onCancel: () => void;
}

export interface ExpenseFormData {
  date: string;
  category: string;
  amount: number;
  description: string;
}

export default function AddExpenseForm({
  defaultDate,
  viewMode,
  onSave,
  onCancel,
}: AddExpenseFormProps) {
  const [categories, setCategories] = useState<string[]>([]);
  const [formData, setFormData] = useState<ExpenseFormData>({
    date: formatDateForInput(defaultDate),
    category: '',
    amount: 0,
    description: '',
  });
  const [errors, setErrors] = useState<{
    date?: string;
    category?: string;
    amount?: string;
  }>({});
  const [isNewCategory, setIsNewCategory] = useState(false);

  useEffect(() => {
    setCategories(getCategories());
  }, []);

  // Check if the entered category is new
  useEffect(() => {
    if (formData.category) {
      const exists = categories.some(
        (cat) => cat.toLowerCase() === formData.category.toLowerCase()
      );
      setIsNewCategory(!exists);
    } else {
      setIsNewCategory(false);
    }
  }, [formData.category, categories]);

  function formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function getDateFieldNote(): string | null {
    if (viewMode === 'month') {
      return 'Date defaulted to first day of the month';
    } else if (viewMode === 'year') {
      return 'Date defaulted to first day of the year';
    }
    return null;
  }

  function validate(): boolean {
    const newErrors: typeof errors = {};

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    if (!formData.category || !formData.category.trim()) {
      newErrors.category = 'Category is required';
    }

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (validate()) {
      onSave(formData);
    }
  }

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    // Allow empty string or valid number with up to 2 decimal places
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setFormData({ ...formData, amount: value === '' ? 0 : parseFloat(value) });
    }
  }

  const dateNote = getDateFieldNote();

  return (
    <Paper elevation={2} sx={{ padding: 3 }}>
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {dateNote && (
            <Grid item xs={12}>
              <Alert severity="info">Note: {dateNote}</Alert>
            </Grid>
          )}

          <Grid item xs={12}>
            <TextField
              variant="filled"
              fullWidth
              required
              label="Date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              error={!!errors.date}
              helperText={errors.date}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <Autocomplete
              freeSolo
              options={categories}
              value={formData.category}
              onInputChange={(_, newValue) => {
                setFormData({ ...formData, category: newValue });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="filled"
                  fullWidth
                  required
                  label="Category"
                  error={!!errors.category}
                  helperText={errors.category}
                />
              )}
            />
            {isNewCategory && formData.category && (
              <Alert severity="info" sx={{ mt: 1 }}>
                Note: This will be added as a new category on save of this expense
              </Alert>
            )}
          </Grid>

          <Grid item xs={12}>
            <TextField
              variant="filled"
              fullWidth
              required
              label="Amount"
              type="number"
              value={formData.amount || ''}
              onChange={handleAmountChange}
              error={!!errors.amount}
              helperText={errors.amount}
              inputProps={{
                step: 0.01,
                min: 0,
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              variant="filled"
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button variant="outlined" onClick={onCancel}>
                Cancel
              </Button>
              <Button variant="contained" type="submit">
                Save
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
}
