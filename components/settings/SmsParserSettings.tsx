'use client';

import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import SettingsBackupRestoreIcon from '@mui/icons-material/SettingsBackupRestore';
import { v4 as uuidv4 } from 'uuid';
import { ParsedSmsResult, SmsParserRule } from '@/types/expense.types';
import { useSettings } from '@/hooks/useSettings';
import { testParserRule } from '@/utils/smsParser';

const SAMPLE_SMS =
  'Dear Customer, INR 1,250.00 debited from A/c XX1234 on 21-Apr-26 to AMAZON. Avl Bal: INR 45,320.00. -HDFC Bank';

interface RuleFormState {
  id: string;
  bankName: string;
  amountKeyword: string;
  merchantKeyword: string;
  currency: string;
  overridingBuiltInId?: string;
}

const EMPTY_RULE_FORM: RuleFormState = {
  id: '',
  bankName: '',
  amountKeyword: '',
  merchantKeyword: '',
  currency: '₹',
  overridingBuiltInId: undefined,
};

interface SnackbarState {
  open: boolean;
  message: string;
  /** Optional restore action for soft delete. */
  undo?: () => void;
}

export default function SmsParserSettings() {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const { settings, updateSettings, isLoaded } = useSettings();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorForm, setEditorForm] = useState<RuleFormState>(EMPTY_RULE_FORM);
  const [editorErrors, setEditorErrors] = useState<Partial<Record<keyof RuleFormState, string>>>({});
  const [editorMode, setEditorMode] = useState<'add' | 'edit'>('add');

  const [confirmDelete, setConfirmDelete] = useState<SmsParserRule | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, message: '' });

  // Test panel state
  const [testText, setTestText] = useState(SAMPLE_SMS);
  const [testRuleId, setTestRuleId] = useState<string>('');

  const selectedTestRule = useMemo(() => {
    if (!testRuleId) return settings.parserRules[0];
    return settings.parserRules.find((r) => r.id === testRuleId) ?? settings.parserRules[0];
  }, [testRuleId, settings.parserRules]);

  const testResult: ParsedSmsResult | null = useMemo(() => {
    if (!selectedTestRule || !testText.trim()) return null;
    return testParserRule(testText, selectedTestRule);
  }, [selectedTestRule, testText]);

  function openAddEditor() {
    setEditorMode('add');
    setEditorForm({ ...EMPTY_RULE_FORM, id: uuidv4() });
    setEditorErrors({});
    setEditorOpen(true);
  }

  function openEditEditor(rule: SmsParserRule) {
    setEditorMode('edit');
    const builtInOriginId = rule.builtIn ? rule.id : rule.overrideOf;
    setEditorForm({
      id: rule.id,
      bankName: rule.bankName,
      amountKeyword: rule.amountKeyword,
      merchantKeyword: rule.merchantKeyword,
      currency: rule.currency,
      overridingBuiltInId: builtInOriginId,
    });
    setEditorErrors({});
    setEditorOpen(true);
  }

  function validateEditor(): boolean {
    const errs: Partial<Record<keyof RuleFormState, string>> = {};
    if (!editorForm.bankName.trim()) errs.bankName = 'Bank name is required';
    if (!editorForm.amountKeyword.trim()) errs.amountKeyword = 'Amount keyword is required';
    setEditorErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSaveRule() {
    if (!validateEditor()) return;

    if (editorForm.overridingBuiltInId) {
      const overrideRule: SmsParserRule = {
        id: `overridden-${editorForm.overridingBuiltInId}`,
        bankName: editorForm.bankName.trim(),
        amountKeyword: editorForm.amountKeyword.trim(),
        merchantKeyword: editorForm.merchantKeyword.trim(),
        currency: editorForm.currency.trim() || '₹',
        builtIn: false,
        overrideOf: editorForm.overridingBuiltInId,
      };
      updateSettings((prev) => {
        // Remove any existing override for this built-in, then add the new one.
        const withoutPrevOverride = prev.parserRules.filter((r) => r.overrideOf !== editorForm.overridingBuiltInId);
        return { ...prev, parserRules: [...withoutPrevOverride, overrideRule] };
      });
    } else {
      const trimmed: SmsParserRule = {
        id: editorForm.id,
        bankName: editorForm.bankName.trim(),
        amountKeyword: editorForm.amountKeyword.trim(),
        merchantKeyword: editorForm.merchantKeyword.trim(),
        currency: editorForm.currency.trim() || '₹',
        builtIn: false,
      };
      updateSettings((prev) => {
        const existingIdx = prev.parserRules.findIndex((r) => r.id === trimmed.id);
        const next = [...prev.parserRules];
        if (existingIdx >= 0) {
          next[existingIdx] = trimmed;
        } else {
          next.push(trimmed);
        }
        return { ...prev, parserRules: next };
      });
    }

    setEditorOpen(false);
    setSnackbar({ open: true, message: editorMode === 'add' ? 'Rule added' : 'Rule updated' });
  }

  /**
   * Removes the user override for a built-in rule, causing `getSettings()` to
   * fall back to the original hardcoded built-in values on the next read.
   */
  function handleRestoreBuiltIn(builtInId: string) {
    updateSettings((prev) => ({
      ...prev,
      parserRules: prev.parserRules.filter((r) => r.overrideOf !== builtInId),
    }));
    setSnackbar({ open: true, message: 'Rule restored to default' });
  }

  function handleDeleteRule(rule: SmsParserRule) {
    // Capture for restore
    const restored = rule;
    updateSettings((prev) => ({
      ...prev,
      parserRules: prev.parserRules.filter((r) => r.id !== rule.id),
    }));
    setConfirmDelete(null);
    setSnackbar({
      open: true,
      message: 'Rule deleted',
      undo: () => {
        updateSettings((prev) => ({
          ...prev,
          parserRules: [...prev.parserRules, restored],
        }));
        setSnackbar({ open: true, message: 'Rule restored' });
      },
    });
  }

  if (!isLoaded) {
    return (
      <Stack spacing={2}>
        <Skeleton variant="rounded" height={120} />
        <Skeleton variant="rounded" height={120} />
        <Skeleton variant="rounded" height={300} />
      </Stack>
    );
  }

  const userRules = settings.parserRules.filter((r) => !r.builtIn && !r.overrideOf);

  return (
    <>
      <Stack spacing={3}>
        {/* Rules list */}
        <Box>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="h6">Your Rules</Typography>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={openAddEditor}
            >
              Add Rule
            </Button>
          </Stack>

          {userRules.length === 0 && (
            <Alert severity="info" sx={{ mb: 2 }}>
              No custom rules yet — built-in rules below cover common Indian banks.
              Add a custom rule to support your bank&apos;s SMS format.
            </Alert>
          )}

          <Stack spacing={2}>
            {settings.parserRules.map((rule) => {
              const isOverride = !!rule.overrideOf;
              const isBuiltInOrItsOverride = !!rule.builtIn || isOverride;
              return (
                <Card key={rule.id} variant="outlined">
                  <CardContent sx={{ pb: 1 }}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                      <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        {rule.bankName}
                      </Typography>
                      {isBuiltInOrItsOverride && <Chip label="Built-in" size="small" color="default" />}
                      {isOverride && <Chip label="Modified" size="small" color="warning" />}
                      {isOverride && (
                        <Tooltip title="Restore to default">
                          <IconButton
                            size="small"
                            aria-label={`Restore ${rule.bankName} rule to default`}
                            onClick={() => handleRestoreBuiltIn(rule.overrideOf!)}
                          >
                            <SettingsBackupRestoreIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      Amount keyword: <strong>{rule.amountKeyword}</strong>
                      {rule.merchantKeyword && (
                        <>
                          {' '}· Merchant keyword: <strong>{rule.merchantKeyword}</strong>
                        </>
                      )}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'flex-end' }}>
                    <Button
                      size="small"
                      startIcon={<PlayArrowIcon />}
                      onClick={() => setTestRuleId(rule.id)}
                    >
                      Test
                    </Button>
                    <Tooltip title={isBuiltInOrItsOverride ? 'Edit built-in rule (saves as override)' : 'Edit rule'}>
                      <IconButton
                        size="small"
                        aria-label={`Edit ${rule.bankName} rule`}
                        onClick={() => openEditEditor(rule)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {!isBuiltInOrItsOverride && (
                      <Tooltip title="Delete rule">
                        <IconButton
                          size="small"
                          color="error"
                          aria-label={`Delete ${rule.bankName} rule`}
                          onClick={() => setConfirmDelete(rule)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </CardActions>
                </Card>
              );
            })}
          </Stack>
        </Box>

        {/* Test panel */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Test a Rule
            </Typography>

            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel id="test-rule-label">Rule</InputLabel>
              <Select
                labelId="test-rule-label"
                label="Rule"
                value={selectedTestRule?.id ?? ''}
                onChange={(e) => setTestRuleId(e.target.value)}
              >
                {settings.parserRules.map((rule) => (
                  <MenuItem key={rule.id} value={rule.id}>
                    {rule.bankName}
                    {rule.builtIn ? ' (Built-in)' : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Sample SMS"
              fullWidth
              multiline
              rows={4}
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              sx={{ mb: 2 }}
              helperText='Paste a sample bank SMS to see what the selected rule extracts.'
            />

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Extracted:
              </Typography>
              <ExtractedRow
                label="Amount"
                value={
                  testResult?.amount !== undefined
                    ? `${selectedTestRule?.currency ?? ''} ${testResult.amount.toFixed(2)}`
                    : null
                }
              />
              <ExtractedRow label="Merchant" value={testResult?.description ?? null} />
              <ExtractedRow label="Date" value={testResult?.date ?? null} />
            </Box>
          </CardContent>
        </Card>
      </Stack>

      {/* Add/Edit dialog */}
      <Dialog open={editorOpen} onClose={() => setEditorOpen(false)} fullScreen={fullScreen} fullWidth maxWidth="sm">
        <DialogTitle>
          {editorMode === 'add'
            ? 'Add Parser Rule'
            : editorForm.overridingBuiltInId ? 'Edit Built-in Rule' : 'Edit Parser Rule'}
        </DialogTitle>
        {editorForm.overridingBuiltInId && (
          <Box sx={{ px: 3, pb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Your changes will be saved as a custom override. Use Restore to default to revert.
            </Typography>
          </Box>
        )}
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <TextField
                autoFocus
                required
                fullWidth
                label="Bank Name"
                value={editorForm.bankName}
                onChange={(e) => setEditorForm({ ...editorForm, bankName: e.target.value })}
                error={!!editorErrors.bankName}
                helperText={editorErrors.bankName}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Currency"
                value={editorForm.currency}
                onChange={(e) => setEditorForm({ ...editorForm, currency: e.target.value })}
                helperText="Display only"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Amount Keyword"
                value={editorForm.amountKeyword}
                onChange={(e) => setEditorForm({ ...editorForm, amountKeyword: e.target.value })}
                error={!!editorErrors.amountKeyword}
                helperText={editorErrors.amountKeyword ?? 'Word that appears immediately before the amount, e.g. "INR" or "Rs."'}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Merchant Keyword"
                value={editorForm.merchantKeyword}
                onChange={(e) => setEditorForm({ ...editorForm, merchantKeyword: e.target.value })}
                helperText='Word that appears immediately before the merchant name, e.g. "at " or "to "'
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditorOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveRule}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)}>
        <DialogTitle>Delete this rule?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            The rule for <strong>{confirmDelete?.bankName}</strong> will be removed.
            You can undo this immediately after.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => confirmDelete && handleDeleteRule(confirmDelete)}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        action={
          snackbar.undo && (
            <Button
              color="secondary"
              size="small"
              onClick={() => {
                snackbar.undo!();
              }}
            >
              UNDO
            </Button>
          )
        }
      />
    </>
  );
}

function ExtractedRow({ label, value }: { label: string; value: string | null }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1} sx={{ py: 0.5 }}>
      {value ? (
        <CheckCircleIcon color="success" fontSize="small" />
      ) : (
        <CancelIcon color="error" fontSize="small" />
      )}
      <Typography variant="body2" sx={{ minWidth: 80, color: 'text.secondary' }}>
        {label}:
      </Typography>
      <Typography variant="body2">
        {value ?? <span style={{ fontStyle: 'italic', opacity: 0.6 }}>not extracted</span>}
      </Typography>
    </Stack>
  );
}
