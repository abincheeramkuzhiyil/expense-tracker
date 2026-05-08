'use client';

import {
  Box,
  Button,
  InputAdornment,
  TextField,
} from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import StandardBottomSheet from '@/components/common/StandardBottomSheet';

export interface DrawerFieldProps {
  /** Label shown on the trigger TextField */
  label: string;
  /** Current committed value shown in the trigger */
  value: string;
  /** Placeholder text when value is empty */
  placeholder?: string;
  error?: boolean;
  helperText?: string;
  required?: boolean;
  /** Whether the drawer is open */
  open: boolean;
  /** Called to open the drawer */
  onOpen: () => void;
  /** Called to close/dismiss without confirming (swipe down or close button) */
  onClose: () => void;
  /** Called when the user taps "Ok" — caller should commit any draft state here */
  onConfirm: () => void;
  /** Title shown in the drawer header */
  drawerTitle: string;
  /** Icon rendered beside the drawer title */
  drawerIcon: React.ReactNode;
  /** Content rendered inside the scrollable drawer body */
  children: React.ReactNode;
}

/**
 * A read-only TextField trigger that opens a StandardBottomSheet for richer value selection.
 *
 * Pattern:
 *  - Trigger shows the current committed value (or placeholder)
 *  - Tapping opens the sheet with `children` (sub-fields, toggles, etc.)
 *  - User confirms with "Ok" → `onConfirm` fires → caller commits draft state
 *  - Dismissing (swipe / close button / backdrop) calls `onClose` → caller discards drafts
 *
 * Use this whenever a form field needs more than a single input — it acts as an
 * extensible "expanded field" primitive, keeping the main form clean.
 */
export default function DrawerField({
  label,
  value,
  placeholder,
  error,
  helperText,
  required,
  open,
  onOpen,
  onClose,
  onConfirm,
  drawerTitle,
  drawerIcon,
  children,
}: DrawerFieldProps) {
  return (
    <>
      {/* ──TextField Trigger ─────────────────────────────────────────────────── */}
      <TextField
        variant="filled"
        fullWidth
        required={required}
        label={label}
        value={value}
        placeholder={placeholder}
        error={error}
        helperText={helperText}
        onClick={onOpen}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault(); // prevent form submit / page scroll
            onOpen();
          }
        }}
        inputProps={{
          readOnly: true,
          'aria-haspopup': 'dialog',
          'aria-expanded': open,
          style: { cursor: 'pointer' },
        }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <ChevronRightIcon sx={{ color: 'action.active', pointerEvents: 'none' }} />
            </InputAdornment>
          ),
        }}
        sx={{ cursor: 'pointer' }}
      />

      {/* ── Bottom Sheet ───────────────────────────────────────────────────── */}
      <StandardBottomSheet
        open={open}
        onClose={onClose}
        title={drawerTitle}
        icon={drawerIcon}
      >
        <Box sx={{ p: 2 }}>
          {children}
        </Box>
        <Box sx={{ px: 3, pt: 1, pb: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button variant="contained" onClick={onConfirm}>
            Ok
          </Button>
        </Box>
      </StandardBottomSheet>
    </>
  );
}
