'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  List,
  ListItemButton,
  ListItemText,
  Radio,
  TextField,
  Typography,
} from '@mui/material';
import StandardBottomSheet from '@/components/common/StandardBottomSheet';

export interface FacetChip {
  key: string;
  label: string;
  /** Right-hand detail: a count or an amount. */
  detail: string;
}

export interface ChipPickerSheetProps {
  open: boolean;
  title: string;
  icon: React.ReactNode;
  filterLabel: string;
  items: FacetChip[];
  selectedKeys: string[];
  /** Checkboxes when true, radio rows (one choice, tap again to clear) when false. */
  multiple: boolean;
  /** Choosing this key clears all others, and choosing any other key clears it. */
  exclusiveKey?: string;
  onClose: () => void;
  onConfirm: (keys: string[]) => void;
}

/** Overflow bottom sheet for the narrowing chips. Works on a draft; "Ok" commits, dismissing discards. */
export default function ChipPickerSheet({
  open,
  title,
  icon,
  filterLabel,
  items,
  selectedKeys,
  multiple,
  exclusiveKey,
  onClose,
  onConfirm,
}: ChipPickerSheetProps) {
  const [draft, setDraft] = useState<string[]>([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (!open) return;
    setDraft(selectedKeys);
    setFilter('');
    // Only re-initialise when the sheet opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function toggle(key: string) {
    if (draft.includes(key)) {
      setDraft(draft.filter((k) => k !== key));
    } else if (!multiple || key === exclusiveKey) {
      setDraft([key]);
    } else {
      setDraft([...draft.filter((k) => k !== exclusiveKey), key]);
    }
  }

  const needle = filter.trim().toLowerCase();
  const visible = needle ? items.filter((i) => i.label.toLowerCase().includes(needle)) : items;
  const Control = multiple ? Checkbox : Radio;

  return (
    <StandardBottomSheet open={open} onClose={onClose} title={title} icon={icon}>
      <Box sx={{ p: 2 }}>
        <TextField
          variant="filled"
          fullWidth
          label={filterLabel}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <List dense>
          {visible.map((item) => (
            <ListItemButton key={item.key} onClick={() => toggle(item.key)}>
              <Control
                edge="start"
                checked={draft.includes(item.key)}
                tabIndex={-1}
                disableRipple
                inputProps={{ 'aria-label': item.label }}
              />
              <ListItemText primary={item.label} />
              <Typography variant="body2" color="text.secondary">
                {item.detail}
              </Typography>
            </ListItemButton>
          ))}
          {visible.length === 0 && (
            <Typography color="text.secondary" sx={{ p: 2 }}>
              No matches
            </Typography>
          )}
        </List>
      </Box>
      <Box sx={{ px: 3, pt: 1, pb: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" onClick={() => onConfirm(draft)}>
          Ok
        </Button>
      </Box>
    </StandardBottomSheet>
  );
}
