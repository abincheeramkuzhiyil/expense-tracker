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
  Snackbar,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddExpenseForm, { ExpenseFormData } from '@/components/expense/AddExpenseForm';
import PasteSmsPanel from '@/components/expense/PasteSmsPanel';
import { ExpenseSource, ParsedSmsResult, ViewMode } from '@/types/expense.types';
import { addNewCategory, getCategories } from '@/utils/expenseCategories';
import { saveExpense } from '@/utils/expenseStorage';
import { parseSms } from '@/utils/smsParser';
import { getMerchantRules, matchMerchant } from '@/utils/merchantMapping';
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

  // "Add from clipboard" shortcut (?source=clipboard). We try to read the
  // clipboard automatically on arrival; Android Chrome blocks silent reads
  // without a user gesture, so PasteSmsPanel is shown as a one-tap fallback.
  const isClipboardFlow = searchParams.get('source') === 'clipboard';
  const [clipboardText, setClipboardText] = useState<string | null>(null);
  const [clipboardTried, setClipboardTried] = useState(false);
  const [manualSkip, setManualSkip] = useState(false);

  // SMS body to parse — from the Web Share Target, or the clipboard shortcut.
  const effectiveText = combinedSharedText ?? clipboardText;

  // Merchant classification runs independently of parserRules — it matches
  // keywords against the full SMS text to auto-fill Category and Spent On.
  const merchantMatch = useMemo(() => {
    if (!effectiveText) return null;
    return matchMerchant(effectiveText, getMerchantRules());
  }, [effectiveText]);

  const viewParam = searchParams.get('view') as ViewMode | null;
  const dateParam = searchParams.get('date');

  const viewMode: ViewMode =
    viewParam && ['day', 'month', 'year'].includes(viewParam) ? viewParam : 'day';

  const defaultDate = calculateDefaultDate(dateParam, viewMode);

  const [parseState, setParseState] = useState<ParseState>(
    combinedSharedText || isClipboardFlow ? { kind: 'loading' } : { kind: 'idle' }
  );
  const [draftSnackbarOpen, setDraftSnackbarOpen] = useState(false);

  // Best-effort automatic clipboard read for the "Add from clipboard" shortcut.
  useEffect(() => {
    if (!isClipboardFlow || combinedSharedText || clipboardText || clipboardTried) return;
    let cancelled = false;
    (async () => {
      try {
        if (!navigator.clipboard?.readText) throw new Error('clipboard-unavailable');
        const text = await navigator.clipboard.readText();
        if (!cancelled && text.trim()) setClipboardText(text.trim());
      } catch {
        // Gesture required (Android Chrome) or permission denied — fall back to
        // the one-tap PasteSmsPanel rendered below.
      } finally {
        if (!cancelled) setClipboardTried(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isClipboardFlow, combinedSharedText, clipboardText, clipboardTried]);

  useEffect(() => {
    // Still waiting for the clipboard auto-read attempt to finish.
    if (isClipboardFlow && !effectiveText && !clipboardTried) {
      setParseState({ kind: 'loading' });
      return;
    }
    if (!effectiveText) {
      setParseState({ kind: 'idle' });
      return;
    }
    if (!isLoaded) {
      setParseState({ kind: 'loading' });
      return;
    }
    const result = parseSms(effectiveText, settings.parserRules);
    setParseState(result ? { kind: 'success', result } : { kind: 'failure' });
  }, [effectiveText, isClipboardFlow, clipboardTried, isLoaded, settings.parserRules]);

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

    // Status is always 'approved' — the user explicitly chose Save over Save as Draft.
    const source: ExpenseSource = parseState.kind === 'success' ? 'sms' : 'manual';
    saveExpense(formData, source, 'approved');
    handleBack();
  }

  function handleSaveDraft(formData: ExpenseFormData) {
    const existingCategories = getCategories();
    const categoryExists = existingCategories.some(
      (cat) => cat.toLowerCase() === formData.category.toLowerCase()
    );
    if (!categoryExists) {
      addNewCategory(formData.category);
    }

    // Status is always 'pending' — the user explicitly chose Save as Draft.
    const source: ExpenseSource = parseState.kind === 'success' ? 'sms' : 'manual';
    saveExpense(formData, source, 'pending');

    setDraftSnackbarOpen(true);
    // Navigate back after a brief delay so the snackbar is readable.
    setTimeout(() => handleBack(), 1500);
  }

  const initialValues: Partial<ExpenseFormData> | undefined =
    parseState.kind === 'success'
      ? {
          date: parseState.result.date,
          amount: parseState.result.amount,
          ...(merchantMatch
            ? {
                category: merchantMatch.category,
                ...(merchantMatch.spentOn ? { spentOn: merchantMatch.spentOn } : {}),
              }
            : {}),
        }
      : undefined;

  const formSource: ExpenseSource = parseState.kind === 'success' ? 'sms' : 'manual';

  const matchedRuleName = useMemo(() => {
    if (parseState.kind !== 'success') return null;
    return (
      settings.parserRules.find((r) => r.id === parseState.result.matchedRuleId)?.bankName ??
      'unknown rule'
    );
  }, [parseState, settings.parserRules]);

  // Fallback UI: only when the clipboard auto-read was attempted but produced
  // no text (e.g. Android Chrome blocked the silent read) and the user hasn't
  // chosen to enter the expense manually.
  const showPastePanel = isClipboardFlow && clipboardTried && !effectiveText && !manualSkip;

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
        {showPastePanel ? (
          <PasteSmsPanel
            onText={(t) => setClipboardText(t)}
            onSkip={() => setManualSkip(true)}
          />
        ) : (
          <>
            {parseState.kind === 'loading' && (
              <Skeleton variant="rounded" height={64} sx={{ mb: 2 }} />
            )}

            {parseState.kind === 'success' && (
              <Alert severity="success" sx={{ mb: 2 }}>
                <AlertTitle>Parsed from SMS</AlertTitle>
                Parsed using the <strong>{matchedRuleName}</strong> rule. Review the details below and tap Save to record this expense.
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
                  onSaveDraft={handleSaveDraft}
                  onCancel={handleCancel}
                  initialValues={initialValues}
                  source={formSource}
                />
              )}
            </Box>
          </>
        )}
      </Container>

      <Snackbar
        open={draftSnackbarOpen}
        autoHideDuration={4000}
        onClose={() => setDraftSnackbarOpen(false)}
        message="Saved as draft. Open Pending Review to complete and approve."
      />
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
