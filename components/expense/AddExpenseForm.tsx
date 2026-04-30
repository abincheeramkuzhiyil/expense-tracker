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
  Chip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import SmsIcon from '@mui/icons-material/Sms';
import { ExpenseSource, ViewMode } from '@/types/expense.types';
import { getCategories } from '@/utils/expenseCategories';
import { formatDateForInput } from '@/utils/dateFormatter';

interface AddExpenseFormProps {
  defaultDate: Date;
  viewMode: ViewMode;
  onSave: (formData: ExpenseFormData) => void;
  onCancel: () => void;
  /** Pre-fill values (e.g. from an SMS share). */
  initialValues?: Partial<ExpenseFormData>;
  /** Visual indicator that the form was populated from an SMS. */
  source?: ExpenseSource;
  /** Override the default Save button label. */
  saveLabel?: string;
  /**
   * When provided, a "Save as Draft" button is rendered.
   * Clicking it runs full validation then calls this handler with the form data.
   * The caller decides the status (pending) — the form is status-agnostic.
   */
  onSaveDraft?: (formData: ExpenseFormData) => void;
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
  initialValues,
  source = 'manual',
  saveLabel = 'Save',
  onSaveDraft,
}: AddExpenseFormProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [categories, setCategories] = useState<string[]>(() => getCategories());
  const [formData, setFormData] = useState<ExpenseFormData>({
    date: initialValues?.date ?? formatDateForInput(defaultDate),
    category: initialValues?.category ?? '',
    amount: initialValues?.amount ?? 0,
    description: initialValues?.description ?? '',
  });
  const [errors, setErrors] = useState<{
    date?: string;
    category?: string;
    amount?: string;
  }>({});
  const [isNewCategory, setIsNewCategory] = useState(false);

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

  function handleSaveDraft(e: React.MouseEvent) {
    e.preventDefault();
    if (validate()) {
      onSaveDraft!(formData);
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
          {source === 'sms' && (
            <Grid item xs={12}>
              <Chip
                icon={<SmsIcon />}
                label="Parsed from SMS"
                color="info"
                size="small"
                aria-label="This expense was parsed from an SMS message"
              />
            </Grid>
          )}

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
                inputMode: 'decimal',
                'aria-label': 'Expense amount',
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
            {isMobile && onSaveDraft ? (
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Button variant="contained" color="black" fullWidth onClick={onCancel}>
                    Cancel
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button variant="contained" fullWidth type="submit">
                    {saveLabel}
                  </Button>
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={handleSaveDraft}
                    aria-label="Save as draft for later review"
                  >
                    Save as Draft
                  </Button>
                </Grid>
              </Grid>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button variant="text" onClick={onCancel}>
                  Cancel
                </Button>
                {onSaveDraft && (
                  <Button
                    variant="outlined"
                    onClick={handleSaveDraft}
                    aria-label="Save as draft for later review"
                  >
                    Save as Draft
                  </Button>
                )}
                <Button variant="contained" type="submit">
                  {saveLabel}
                </Button>
              </Box>
            )}
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
}
