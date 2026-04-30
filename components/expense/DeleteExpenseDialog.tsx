'use client';

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';

interface DeleteExpenseDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteExpenseDialog({
  open,
  onConfirm,
  onCancel,
}: DeleteExpenseDialogProps) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>Delete Expense</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to delete this expense? This action cannot be undone.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} aria-label="Cancel delete">
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          color="error"
          variant="contained"
          aria-label="Confirm delete expense"
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}
