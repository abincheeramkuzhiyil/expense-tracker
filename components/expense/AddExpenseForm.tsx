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
  Switch,
  FormControlLabel,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import SmsIcon from '@mui/icons-material/Sms';
import CategoryIcon from '@mui/icons-material/Category';
import DrawerField from '@/components/common/DrawerField';
import { ExpenseSource, ViewMode } from '@/types/expense.types';
import { getCategories, addNewCategory } from '@/utils/expenseCategories';
import { formatDateForInput } from '@/utils/dateFormatter';
import {
  getSpentOnSuggestions,
  resolveCategory,
  setSpentOnCategory,
} from '@/utils/spentOnMapping';

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
  /** Specific item the money was spent on, e.g. "Breakfast", "Fuel" */
  spentOn: string;
  /** High-level group category, e.g. "Food", "Travel" */
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
  onSaveDraft
}: AddExpenseFormProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [categoryGroups, setCategoryGroups] = useState<string[]>(() => getCategories());
  const [spentOnSuggestions, setSpentOnSuggestions] = useState<string[]>(() =>
    getSpentOnSuggestions()
  );

  const [formData, setFormData] = useState<ExpenseFormData>({
    date: initialValues?.date ?? formatDateForInput(defaultDate),
    spentOn: initialValues?.spentOn ?? '',
    category: initialValues?.category ?? '',
    amount: initialValues?.amount ?? 0,
    description: initialValues?.description ?? '',
  });

  const [errors, setErrors] = useState<{
    date?: string;
    spentOn?: string;
    category?: string;
    amount?: string;
  }>({});

  // true when the current spentOn value has no entry in the mapping
  const [isNewSpentOn, setIsNewSpentOn] = useState(false);
  // true when the current category group is not in the saved groups list
  const [isNewCategoryGroup, setIsNewCategoryGroup] = useState(false);
  // true when the user has manually set the category via the drawer
  const [categoryManuallySet, setCategoryManuallySet] = useState(false);

  // Category drawer state
  const [categoryDrawerOpen, setCategoryDrawerOpen] = useState(false);
  const [draftCategory, setDraftCategory] = useState('');
  const [draftPrefillMapping, setDraftPrefillMapping] = useState(true);
  const [prefillMapping, setPrefillMapping] = useState(true);

  useEffect(() => {
    if (formData.spentOn.trim()) {
      const resolved = resolveCategory(formData.spentOn);
      setIsNewSpentOn(resolved === null);

      // Auto-fill category when the mapping resolves and user hasn't manually chosen one
      if (resolved && !categoryManuallySet) {
        setFormData((prev) => ({ ...prev, category: resolved }));
      }
    } else {
      setIsNewSpentOn(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.spentOn]);

  useEffect(() => {
    if (formData.category.trim()) {
      const exists = categoryGroups.some(
        (g) => g.toLowerCase() === formData.category.trim().toLowerCase()
      );
      setIsNewCategoryGroup(!exists);
    } else {
      setIsNewCategoryGroup(false);
    }
  }, [formData.category, categoryGroups]);

  // Tracks whether the draft category in the drawer is a new (unsaved) group
  const isDraftNewCategory =
    draftCategory.trim().length > 0 &&
    !categoryGroups.some((g) => g.toLowerCase() === draftCategory.trim().toLowerCase());

  function getDateFieldNote(): string | null {
    if (viewMode === 'month') return 'Date defaulted to first day of the month';
    if (viewMode === 'year') return 'Date defaulted to first day of the year';
    return null;
  }

  function validate(): boolean {
    const newErrors: typeof errors = {};

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }
    if (!formData.spentOn.trim()) {
      newErrors.spentOn = 'Spent On is required';
    }
    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }
    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function persistMappingAndCategories() {
    // Save the Spent On → Category mapping only when user opted in
    if (prefillMapping) {
      setSpentOnCategory(formData.spentOn, formData.category);
    }
    // Persist a new category group if needed
    if (isNewCategoryGroup) {
      addNewCategory(formData.category);
      setCategoryGroups(getCategories());
    }
    // Refresh Spent On suggestions in case a new entry was added
    setSpentOnSuggestions(getSpentOnSuggestions());
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validate()) {
      persistMappingAndCategories();
      onSave(formData);
    }
  }

  function handleSaveDraft(e: React.MouseEvent) {
    e.preventDefault();
    if (validate()) {
      persistMappingAndCategories();
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

  function handleOpenCategoryDrawer() {
    setDraftCategory(formData.category);
    setDraftPrefillMapping(prefillMapping);
    setCategoryDrawerOpen(true);
  }

  function handleCategoryDrawerClose() {
    // Discard draft — formData.category and prefillMapping unchanged
    setCategoryDrawerOpen(false);
  }

  function handleCategoryDrawerConfirm() {
    setFormData((prev) => ({ ...prev, category: draftCategory }));
    setPrefillMapping(draftPrefillMapping);
    if (draftCategory.trim()) {
      setCategoryManuallySet(true);
    }
    setCategoryDrawerOpen(false);
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
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* ── Spent On ─────────────────────────────────────────────────── */}
          <Grid item xs={12}>
            <Autocomplete
              freeSolo
              options={spentOnSuggestions}
              value={formData.spentOn}
              onInputChange={(_, newValue) => {
                setFormData((prev) => ({ ...prev, spentOn: newValue }));
                setCategoryManuallySet(false);
                // If user clears the field, also clear the category
                if (!newValue.trim()) {
                  setFormData((prev) => ({ ...prev, spentOn: newValue, category: '' }));
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="filled"
                  fullWidth
                  required
                  label="Spent On"
                  error={!!errors.spentOn}
                  helperText={errors.spentOn}
                />
              )}
            />
            {isNewSpentOn && formData.spentOn.trim() && (
              <Alert severity="info" sx={{ mt: 1 }}>
                Note: This will be added as a new Spent On item
              </Alert>
            )}
          </Grid>

          {/* ── Category (DrawerField) ───────────────────────────────────── */}
          <Grid item xs={12}>
            <DrawerField
              label="Category"
              value={formData.category}
              placeholder="Tap to select category"
              required
              error={!!errors.category}
              helperText={errors.category}
              open={categoryDrawerOpen}
              onOpen={handleOpenCategoryDrawer}
              onClose={handleCategoryDrawerClose}
              onConfirm={handleCategoryDrawerConfirm}
              drawerTitle="Select Category"
              drawerIcon={<CategoryIcon fontSize="small" sx={{ color: 'primary.contrastText' }} />}
            >
              <Autocomplete
                freeSolo
                options={categoryGroups}
                value={draftCategory}
                onInputChange={(_, newValue) => setDraftCategory(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="filled"
                    fullWidth
                    label="Category"
                  />
                )}
              />
              {isDraftNewCategory && (
                <Alert severity="info" sx={{ mt: 1 }}>
                  Note: This will be added as a new Category group
                </Alert>
              )}
              <FormControlLabel
                sx={{ mt: 2 }}
                control={
                  <Switch
                    checked={draftPrefillMapping}
                    onChange={(e) => setDraftPrefillMapping(e.target.checked)}
                  />
                }
                label="Use this to prefill next time"
              />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                When ON, Spent On → Category mapping is saved for future auto-fill
              </Typography>
            </DrawerField>
          </Grid>

          {/* ── Amount ───────────────────────────────────────────────────── */}
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
