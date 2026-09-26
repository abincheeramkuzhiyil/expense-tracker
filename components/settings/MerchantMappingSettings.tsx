'use client';

import { useMemo, useState } from 'react';
import {
  Alert,
  Autocomplete,
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
  Grid,
  IconButton,
  Skeleton,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ScienceIcon from '@mui/icons-material/Science';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import SettingsBackupRestoreIcon from '@mui/icons-material/SettingsBackupRestore';
import { v4 as uuidv4 } from 'uuid';
import { MerchantMatchResult, MerchantRule } from '@/types/expense.types';
import { useMerchantRules } from '@/hooks/useMerchantRules';
import { matchMerchant, normalizeKeywords } from '@/utils/merchantMapping';
import { getCategories } from '@/utils/expenseCategories';
import { getSpentOnSuggestions } from '@/utils/spentOnMapping';
import MerchantMappingTestPanel from './MerchantMappingTestPanel';
import StandardBottomSheet from '@/components/common/StandardBottomSheet';

const SAMPLE_SMS =
  'Dear Customer, Rs.450.00 debited from A/c XX1234 on 21-Apr-26 to Zomato. Avl Bal: Rs.12,000.00. -HDFC Bank';

interface RuleFormState {
  id: string;
  label: string;
  keywords: string[];
  category: string;
  spentOn: string;
  overridingBuiltInId?: string;
}

const EMPTY_RULE_FORM: RuleFormState = {
  id: '',
  label: '',
  keywords: [],
  category: '',
  spentOn: '',
  overridingBuiltInId: undefined,
};

interface SnackbarState {
  open: boolean;
  message: string;
  undo?: () => void;
}

export default function MerchantMappingSettings() {
  const { rules, updateRules, isLoaded } = useMerchantRules();

  const categoryOptions = useMemo(() => getCategories(), []);
  const spentOnOptions = useMemo(() => getSpentOnSuggestions(), []);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorForm, setEditorForm] = useState<RuleFormState>(EMPTY_RULE_FORM);
  const [editorErrors, setEditorErrors] = useState<Partial<Record<keyof RuleFormState, string>>>({});
  const [editorMode, setEditorMode] = useState<'add' | 'edit'>('add');

  const [confirmDelete, setConfirmDelete] = useState<MerchantRule | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, message: '' });

  const [testText, setTestText] = useState(SAMPLE_SMS);
  const [testDrawerOpen, setTestDrawerOpen] = useState(false);

  const testResult: MerchantMatchResult | null = useMemo(() => {
    if (!testText.trim()) return null;
    return matchMerchant(testText, rules);
  }, [testText, rules]);

  const matchedTestRule = useMemo(
    () => rules.find((r) => r.id === testResult?.matchedMerchantRuleId),
    [rules, testResult]
  );

  function openAddEditor() {
    setEditorMode('add');
    setEditorForm({ ...EMPTY_RULE_FORM, id: uuidv4() });
    setEditorErrors({});
    setEditorOpen(true);
  }

  function openEditEditor(rule: MerchantRule) {
    setEditorMode('edit');
    const builtInOriginId = rule.builtIn ? rule.id : rule.overrideOf;
    setEditorForm({
      id: rule.id,
      label: rule.label,
      keywords: [...rule.keywords],
      category: rule.category,
      spentOn: rule.spentOn ?? '',
      overridingBuiltInId: builtInOriginId,
    });
    setEditorErrors({});
    setEditorOpen(true);
  }

  function validateEditor(): boolean {
    const errs: Partial<Record<keyof RuleFormState, string>> = {};
    if (!editorForm.label.trim()) errs.label = 'Label is required';
    if (normalizeKeywords(editorForm.keywords).length === 0) {
      errs.keywords = 'Add at least one keyword';
    }
    if (!editorForm.category.trim()) errs.category = 'Category is required';
    setEditorErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSaveRule() {
    if (!validateEditor()) return;

    const keywords = normalizeKeywords(editorForm.keywords);
    const label = editorForm.label.trim();
    const category = editorForm.category.trim();
    const spentOn = editorForm.spentOn.trim() || undefined;

    if (editorForm.overridingBuiltInId) {
      const overrideRule: MerchantRule = {
        id: `overridden-${editorForm.overridingBuiltInId}`,
        label,
        keywords,
        category,
        spentOn,
        builtIn: false,
        overrideOf: editorForm.overridingBuiltInId,
      };
      updateRules((prev) => {
        const withoutPrev = prev.filter((r) => r.overrideOf !== editorForm.overridingBuiltInId);
        return [...withoutPrev, overrideRule];
      });
    } else {
      const rule: MerchantRule = {
        id: editorForm.id,
        label,
        keywords,
        category,
        spentOn,
        builtIn: false,
      };
      updateRules((prev) => {
        const idx = prev.findIndex((r) => r.id === rule.id);
        const next = [...prev];
        if (idx >= 0) next[idx] = rule;
        else next.push(rule);
        return next;
      });
    }

    setEditorOpen(false);
    setSnackbar({ open: true, message: editorMode === 'add' ? 'Rule added' : 'Rule updated' });
  }

  function handleRestoreBuiltIn(builtInId: string) {
    updateRules((prev) => prev.filter((r) => r.overrideOf !== builtInId));
    setSnackbar({ open: true, message: 'Rule restored to default' });
  }

  function handleDeleteRule(rule: MerchantRule) {
    const restored = rule;
    updateRules((prev) => prev.filter((r) => r.id !== rule.id));
    setConfirmDelete(null);
    setSnackbar({
      open: true,
      message: 'Rule deleted',
      undo: () => {
        updateRules((prev) => [...prev, restored]);
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

  const userRules = rules.filter((r) => !r.builtIn && !r.overrideOf);

  return (
    <>
      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
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

            <Alert severity="info" sx={{ mb: 2 }}>
              When you share an SMS, the first rule whose keyword appears in the message
              auto-fills the Category and Spent On. Put more specific rules above generic ones.
            </Alert>

            {userRules.length === 0 && (
              <Alert severity="info" sx={{ mb: 2 }}>
                No custom rules yet — the built-in rules below cover common merchants.
                Add a custom rule for merchants you use.
              </Alert>
            )}

            <Stack spacing={2}>
              {rules.map((rule) => {
                const isOverride = !!rule.overrideOf;
                const isBuiltInOrItsOverride = !!rule.builtIn || isOverride;
                return (
                  <Card key={rule.id} variant="outlined">
                    <CardContent sx={{ pb: 1 }}>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                          {rule.label}
                        </Typography>
                        {isBuiltInOrItsOverride && <Chip label="Built-in" size="small" />}
                        {isOverride && <Chip label="Modified" size="small" color="warning" />}
                        {isOverride && (
                          <Tooltip title="Restore to default">
                            <IconButton
                              size="small"
                              aria-label={`Restore ${rule.label} rule to default`}
                              onClick={() => handleRestoreBuiltIn(rule.overrideOf!)}
                            >
                              <SettingsBackupRestoreIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>

                      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
                        {rule.keywords.map((k) => (
                          <Chip key={k} label={k} size="small" variant="outlined" />
                        ))}
                      </Stack>

                      <Typography variant="body2" color="text.secondary">
                        Category: <strong>{rule.category}</strong>
                        {rule.spentOn ? (
                          <>
                            {' '}· Spent On: <strong>{rule.spentOn}</strong>
                          </>
                        ) : (
                          <>
                            {' '}· Spent On: <em>you choose</em>
                          </>
                        )}
                      </Typography>
                    </CardContent>
                    <CardActions sx={{ justifyContent: 'flex-end' }}>
                      <Button
                        size="small"
                        startIcon={<PlayArrowIcon />}
                        onClick={() => {
                          setTestText(`Rs.450.00 to ${rule.keywords[0] ?? ''}`);
                          setTestDrawerOpen(true);
                        }}
                      >
                        Test
                      </Button>
                      <Tooltip
                        title={isBuiltInOrItsOverride ? 'Edit built-in rule (saves as override)' : 'Edit rule'}
                      >
                        <IconButton
                          size="small"
                          aria-label={`Edit ${rule.label} rule`}
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
                            aria-label={`Delete ${rule.label} rule`}
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
        </Grid>
      </Grid>

      {/* Test panel bottom sheet */}
      <StandardBottomSheet
        open={testDrawerOpen}
        onClose={() => setTestDrawerOpen(false)}
        title="Test a Message"
        icon={<ScienceIcon fontSize="small" sx={{ color: 'primary.contrastText' }} />}
      >
        <Box sx={{ px: 2, pt: 2, pb: 4 }}>
          <MerchantMappingTestPanel
            testText={testText}
            onTestTextChange={setTestText}
            result={testResult}
            matchedRule={matchedTestRule}
          />
        </Box>
      </StandardBottomSheet>

      {/* Add/Edit dialog */}
      <StandardBottomSheet
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        title={
          editorMode === 'add'
            ? 'Add Merchant Rule'
            : editorForm.overridingBuiltInId
            ? 'Edit Built-in Rule'
            : 'Edit Merchant Rule'
        }
        icon={<LocalOfferIcon fontSize="small" sx={{ color: 'primary.contrastText' }} />}
      >
        {editorForm.overridingBuiltInId && (
          <Box sx={{ px: 3, pt: 2, pb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Your changes will be saved as a custom override. Use Restore to default to revert.
            </Typography>
          </Box>
        )}
        <Box sx={{ px: 3, pt: editorForm.overridingBuiltInId ? 1 : 2, pb: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                autoFocus
                required
                fullWidth
                label="Label"
                value={editorForm.label}
                onChange={(e) => setEditorForm({ ...editorForm, label: e.target.value })}
                error={!!editorErrors.label}
                helperText={editorErrors.label ?? 'A friendly name, e.g. "Food & Dining"'}
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                multiple
                freeSolo
                options={[]}
                value={editorForm.keywords}
                onChange={(_, newValue) =>
                  setEditorForm({ ...editorForm, keywords: newValue as string[] })
                }
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => {
                    const { key, ...chipProps } = getTagProps({ index });
                    return <Chip key={key} label={option} size="small" {...chipProps} />;
                  })
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Keywords"
                    placeholder="Type a keyword and press Enter"
                    error={!!editorErrors.keywords}
                    helperText={
                      editorErrors.keywords ??
                      'Matched if the SMS contains any of these (case-insensitive)'
                    }
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                freeSolo
                options={categoryOptions}
                value={editorForm.category}
                onInputChange={(_, newValue) =>
                  setEditorForm({ ...editorForm, category: newValue })
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    required
                    label="Category"
                    error={!!editorErrors.category}
                    helperText={editorErrors.category ?? 'Existing or new'}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                freeSolo
                options={spentOnOptions}
                value={editorForm.spentOn}
                onInputChange={(_, newValue) =>
                  setEditorForm({ ...editorForm, spentOn: newValue })
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Spent On"
                    error={!!editorErrors.spentOn}
                    helperText={editorErrors.spentOn ?? 'Optional — leave blank if it varies'}
                  />
                )}
              />
            </Grid>
          </Grid>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
            <Button onClick={() => setEditorOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleSaveRule}>
              Save
            </Button>
          </Box>
        </Box>
      </StandardBottomSheet>

      {/* Delete confirmation */}
      <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)}>
        <DialogTitle>Delete this rule?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            The rule <strong>{confirmDelete?.label}</strong> will be removed.
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
            <Button color="secondary" size="small" onClick={() => snackbar.undo!()}>
              UNDO
            </Button>
          )
        }
      />
    </>
  );
}
