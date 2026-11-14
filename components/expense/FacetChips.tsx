'use client';

import { useState } from 'react';
import { Box, Chip, Stack, Typography } from '@mui/material';
import ChipPickerSheet, { FacetChip } from './ChipPickerSheet';

interface FacetChipsProps {
  heading: string;
  /** Chips currently applied; always shown inline. */
  selected: FacetChip[];
  /** Chips that can still be applied, in display order. */
  options: FacetChip[];
  /** Inline chip budget (selected chips count against it). The rest go behind "More…". */
  maxInline?: number;
  multiple: boolean;
  exclusiveKey?: string;
  sheetTitle: string;
  sheetIcon: React.ReactNode;
  filterLabel: string;
  onChange: (keys: string[]) => void;
  /** Pinned at the right end, outside the scrolling area. */
  trailing?: React.ReactNode;
  testId?: string;
}

/**
 * One-line row of narrowing chips. Selected chips come first, then the best options up to `maxInline`;
 * anything left opens in a bottom sheet through the "More…" chip.
 */
export default function FacetChips({
  heading,
  selected,
  options,
  maxInline = 5,
  multiple,
  exclusiveKey,
  sheetTitle,
  sheetIcon,
  filterLabel,
  onChange,
  trailing,
  testId,
}: FacetChipsProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const selectedKeys = selected.map((c) => c.key);

  const inlineOptions = options.slice(0, Math.max(0, maxInline - selected.length));
  const hasMore = options.length > inlineOptions.length;

  function apply(key: string) {
    if (!multiple || key === exclusiveKey) return onChange([key]);
    onChange([...selectedKeys.filter((k) => k !== exclusiveKey), key]);
  }

  return (
    <Box sx={{ mt: 2 }} data-testid={testId}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
        {heading}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Stack
          direction="row"
          sx={{
            flex: 1,
            minWidth: 0,
            gap: 0.75,
            overflowX: 'auto',
            pb: 0.5,
            '& .MuiChip-root': { flexShrink: 0 },
          }}
        >
          {selected.map((chip) => (
            <Chip
              key={chip.key}
              label={`${chip.label} ${chip.detail}`}
              color="primary"
              onClick={() => onChange(selectedKeys.filter((k) => k !== chip.key))}
              onDelete={() => onChange(selectedKeys.filter((k) => k !== chip.key))}
              aria-pressed
            />
          ))}
          {inlineOptions.map((chip) => (
            <Chip
              key={chip.key}
              label={`${chip.label} ${chip.detail}`}
              variant="outlined"
              clickable
              onClick={() => apply(chip.key)}
              aria-pressed={false}
            />
          ))}
        </Stack>
        {hasMore && (
          <Chip
            label="More…"
            variant="outlined"
            clickable
            onClick={() => setSheetOpen(true)}
            aria-haspopup="dialog"
            sx={{ flexShrink: 0, mb: 0.5 }}
          />
        )}
        {trailing}
      </Box>

      <ChipPickerSheet
        open={sheetOpen}
        title={sheetTitle}
        icon={sheetIcon}
        filterLabel={filterLabel}
        items={[...selected, ...options]}
        selectedKeys={selectedKeys}
        multiple={multiple}
        exclusiveKey={exclusiveKey}
        onClose={() => setSheetOpen(false)}
        onConfirm={(keys) => {
          setSheetOpen(false);
          onChange(keys);
        }}
      />
    </Box>
  );
}
