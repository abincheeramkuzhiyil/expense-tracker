'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Container,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Alert,
  AlertTitle,
  Skeleton,
  Link as MuiLink,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddExpenseForm, { ExpenseFormData } from '@/components/expense/AddExpenseForm';
import { ExpenseSource, ExpenseStatus, ParsedSmsResult, ViewMode } from '@/types/expense.types';
import { addNewCategory, getCategories } from '@/utils/expenseCategories';
import { saveExpense } from '@/utils/expenseStorage';
import { parseSms } from '@/utils/smsParser';
import { useSettings } from '@/hooks/useSettings';

type ParseState =
  | { kind: 'idle' }            // No SMS share — regular manual flow.
  | { kind: 'loading' }         // Settings still hydrating, can't parse yet.
  | { kind: 'success'; result: ParsedSmsResult }
  | { kind: 'failure' };

function AddExpensePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { settings, isLoaded } = useSettings();

  // Web Share Target params (text is the SMS body, title may carry sender)
  const sharedText = searchParams.get('shared_text') ?? searchParams.get('text');
  const sharedTitle = searchParams.get('shared_title') ?? searchParams.get('title');
  const combinedSharedText = useMemo(() => {
    if (!sharedText && !sharedTitle) return null;
    return [sharedTitle, sharedText].filter(Boolean).join(' ');
  }, [sharedText, sharedTitle]);

  const viewParam = searchParams.get('view') as ViewMode | null;
  const dateParam = searchParams.get('date');

  const viewMode: ViewMode =
    viewParam && ['day', 'month', 'year'].includes(viewParam) ? viewParam : 'day';

  const defaultDate = calculateDefaultDate(dateParam, viewMode);

  const [parseState, setParseState] = useState<ParseState>(
    combinedSharedText ? { kind: 'loading' } : { kind: 'idle' }
  );

  useEffect(() => {
    if (!combinedSharedText) {
      setParseState({ kind: 'idle' });
      return;
    }
    if (!isLoaded) {
      setParseState({ kind: 'loading' });
      return;
    }
    const result = parseSms(combinedSharedText, settings.parserRules);
    setParseState(result ? { kind: 'success', result } : { kind: 'failure' });
  }, [combinedSharedText, isLoaded, settings.parserRules]);

  function calculateDefaultDate(dateStr: string | null, mode: ViewMode): Date {
    let baseDate = new Date();
    if (dateStr) {
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) {
        baseDate = parsed;
      }
    }
    if (mode === 'month') {
      return new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
    } else if (mode === 'year') {
      return new Date(baseDate.getFullYear(), 0, 1);
    }
    return baseDate;
  }

  function handleBack() {
    const dateStr = dateParam || new Date().toISOString().split('T')[0];
    router.push(`/expenses?view=${viewMode}&date=${dateStr}`);
  }

  function handleCancel() {
    handleBack();
  }

  function handleSave(formData: ExpenseFormData) {
    const existingCategories = getCategories();
    const categoryExists = existingCategories.some(
      (cat) => cat.toLowerCase() === formData.category.toLowerCase()
    );
    if (!categoryExists) {
      addNewCategory(formData.category);
    }

    // SMS-shared expenses save as 'pending' so they show up in the review banner.
    // Manual entries (and SMS that couldn't be parsed) save as approved.
    const source: ExpenseSource = parseState.kind === 'success' ? 'sms' : 'manual';
    const status: ExpenseStatus = parseState.kind === 'success' ? 'pending' : 'approved';

    saveExpense(formData, source, status);
    handleBack();
  }

  const initialValues: Partial<ExpenseFormData> | undefined =
    parseState.kind === 'success'
      ? {
          date: parseState.result.date,
          amount: parseState.result.amount,
          description: parseState.result.description ?? '',
        }
      : undefined;

  const formSource: ExpenseSource = parseState.kind === 'success' ? 'sms' : 'manual';

  return (
    <Box>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={handleBack}
            aria-label="Back to expenses"
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
        {parseState.kind === 'loading' && (
          <Skeleton variant="rounded" height={64} sx={{ mb: 2 }} />
        )}

        {parseState.kind === 'success' && (
          <Alert severity="success" sx={{ mb: 2 }}>
            <AlertTitle>Parsed from SMS</AlertTitle>
            Review the details below and tap Save to record this expense.
          </Alert>
        )}

        {parseState.kind === 'failure' && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <AlertTitle>Couldn&apos;t parse this SMS automatically</AlertTitle>
            Please add the expense details manually.{' '}
            <MuiLink
              component="button"
              type="button"
              onClick={() => router.push('/settings/sms-parser')}
              sx={{ verticalAlign: 'baseline' }}
            >
              Update parser rules →
            </MuiLink>
          </Alert>
        )}

        <Box sx={{ p: 2, mb: 2, bgcolor: 'grey.200' }}>
          {parseState.kind === 'loading' ? (
            <Skeleton variant="rounded" height={400} />
          ) : (
            <AddExpenseForm
              key={parseState.kind === 'success' ? parseState.result.matchedRuleId : 'manual'}
              defaultDate={defaultDate}
              viewMode={viewMode}
              onSave={handleSave}
              onCancel={handleCancel}
              initialValues={initialValues}
              source={formSource}
            />
          )}
        </Box>
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
