'use client';

import { useEffect, useState } from 'react';
import { Alert, Autocomplete, Box, Button, TextField, Typography } from '@mui/material';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import StandardBottomSheet from '@/components/common/StandardBottomSheet';
import TagPills from '@/components/expense/TagPills';
import {
  MAX_TAGS_PER_EXPENSE,
  findTag,
  getRecentTags,
  getTags,
  normalizeTag,
  validateNewTag,
} from '@/utils/expenseTags';

export interface TagPickerSheetProps {
  open: boolean;
  /** Tags currently committed on the expense. */
  selected: string[];
  /** Called on swipe/close — the draft is discarded. */
  onClose: () => void;
  /** Called when the user taps "Ok" with the final tag list. */
  onConfirm: (tags: string[]) => void;
}

interface TagOption {
  label: string;
  isNew: boolean;
}

/**
 * Bottom sheet for choosing tags. Works on a draft copy (same pattern as the Category drawer):
 * "Ok" commits, dismissing discards. New tags are only persisted when the expense is saved.
 */
export default function TagPickerSheet({ open, selected, onClose, onConfirm }: TagPickerSheetProps) {
  const [draft, setDraft] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [allTags, setAllTags] = useState<string[]>([]);
  const [recentTags, setRecentTags] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setDraft(selected);
    setInputValue('');
    setAllTags(getTags());
    setRecentTags(getRecentTags());
    // Only re-initialise when the sheet opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const typed = normalizeTag(inputValue);
  const inputError = validateNewTag(typed, draft);
  const isNewTypedTag =
    typed.length > 0 && !inputError && !findTag(allTags, typed) && !findTag(draft, typed);
  const hasNewDraftTag = draft.some((t) => !findTag(allTags, t));
  const limitReached = draft.length >= MAX_TAGS_PER_EXPENSE;

  function addTag(raw: string) {
    const name = normalizeTag(raw);
    if (!name) return;
    if (findTag(draft, name)) {
      setInputValue('');
      return;
    }
    if (validateNewTag(name, draft)) return;
    // Reuse the stored spelling when the tag already exists
    setDraft((prev) => [...prev, findTag(allTags, name) ?? name]);
    setInputValue('');
  }

  function removeTag(tag: string) {
    setDraft((prev) => prev.filter((t) => t !== tag));
  }

  function filterOptions(options: TagOption[]): TagOption[] {
    const needle = typed.toLowerCase();
    const matches = options.filter(
      (o) => !findTag(draft, o.label) && o.label.toLowerCase().includes(needle)
    );
    return isNewTypedTag ? [{ label: typed, isNew: true }, ...matches] : matches;
  }

  const options: TagOption[] = allTags.map((label) => ({ label, isNew: false }));
  const quickPicks = recentTags.filter((t) => !findTag(draft, t));
  const limitMessage = `You can add up to ${MAX_TAGS_PER_EXPENSE} tags to an expense.`;

  return (
    <StandardBottomSheet
      open={open}
      onClose={onClose}
      title="Add Tags"
      icon={<LocalOfferOutlinedIcon fontSize="small" sx={{ color: 'primary.contrastText' }} />}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
          Tags group your expenses across categories, for example by event, trip or person. Pick an
          existing tag or type a new one. You can add up to {MAX_TAGS_PER_EXPENSE} tags per expense.
        </Typography>

        <Autocomplete<TagOption, true, false, true>
          multiple
          freeSolo
          value={[]}
          inputValue={inputValue}
          options={options}
          filterOptions={filterOptions}
          getOptionLabel={(o) => (typeof o === 'string' ? o : o.label)}
          renderTags={() => null}
          disabled={limitReached}
          onInputChange={(_, value, reason) => {
            if (reason === 'input' || reason === 'clear') setInputValue(value);
          }}
          onChange={(_, value, reason) => {
            if (reason !== 'selectOption' && reason !== 'createOption') return;
            const picked = value[value.length - 1];
            if (picked) addTag(typeof picked === 'string' ? picked : picked.label);
          }}
          renderOption={(props, option) => (
            <li {...props} key={option.isNew ? '__create' : option.label}>
              {option.isNew ? `＋ Create "${option.label}"` : option.label}
            </li>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              variant="filled"
              fullWidth
              label="Tag"
              error={!!inputError}
              helperText={inputError ?? (limitReached ? limitMessage : undefined)}
            />
          )}
        />

        {quickPicks.length > 0 && !limitReached && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 0.75 }}>
              Recently used
            </Typography>
            <TagPills tags={quickPicks} onClick={addTag} />
          </Box>
        )}

        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 0.75 }}>
            Selected ({draft.length}/{MAX_TAGS_PER_EXPENSE})
          </Typography>
          {draft.length > 0 ? (
            <TagPills tags={draft} onDelete={removeTag} />
          ) : (
            <Typography variant="body2" color="text.secondary">
              No tags selected
            </Typography>
          )}
        </Box>

        {hasNewDraftTag && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Note: This will be added as a new Tag when you save the expense
          </Alert>
        )}
      </Box>

      <Box sx={{ px: 3, pt: 1, pb: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button variant="contained" onClick={() => onConfirm(draft)}>
          Ok
        </Button>
      </Box>
    </StandardBottomSheet>
  );
}
