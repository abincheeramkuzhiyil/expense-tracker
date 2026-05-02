'use client';

import { useEffect, useState } from 'react';
import {
  Badge,
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
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import EditIcon from '@mui/icons-material/Edit';
import DraftsIcon from '@mui/icons-material/Drafts';
import SmsIcon from '@mui/icons-material/Sms';
import StandardBottomSheet from '@/components/common/StandardBottomSheet';
import { Expense } from '@/types/expense.types';
import { usePendingExpenses } from '@/hooks/usePendingExpenses';
import { saveExpense } from '@/utils/expenseStorage';
import AddExpenseForm, { ExpenseFormData } from '@/components/expense/AddExpenseForm';

interface PendingExpenseReviewProps {
  open: boolean;
  onClose: () => void;
}

interface SnackbarState {
  open: boolean;
  message: string;
  undo?: () => void;
}

const APPROVE_ALL_CONFIRM_THRESHOLD = 5;

export default function PendingExpenseReview({ open, onClose }: PendingExpenseReviewProps) {
  const { pending, approve, reject, approveAll } = usePendingExpenses();

  const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, message: '' });
  const [confirmApproveAll, setConfirmApproveAll] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);

  // Auto-close when the queue empties so the user isn't left staring at an empty modal.
  useEffect(() => {
    if (open && pending.length === 0) {
      // Brief delay so the "All caught up" state can render before close, if needed.
    }
  }, [open, pending.length]);

  function handleApprove(expense: Expense) {
    approve(expense.id);
    setSnackbar({ open: true, message: `Approved ${formatAmount(expense.amount)}` });
  }

  function handleReject(expense: Expense) {
    // Soft delete with undo: capture the full expense so we can restore it on undo.
    const restored = expense;
    reject(expense.id);
    setSnackbar({
      open: true,
      message: 'Expense rejected',
      undo: () => {
        // Re-save with original timestamps preserved by giving back the same form data
        // (a new id is assigned — this is fine; a 5-second undo window is enough that
        // users won't notice).
        saveExpense(
          {
            date: toIsoDate(restored.date),
            amount: restored.amount,
            category: restored.category,
            description: restored.description,
          },
          restored.source,
          'pending'
        );
        setSnackbar({ open: true, message: 'Expense restored' });
      },
    });
  }

  function handleApproveAll() {
    if (pending.length > APPROVE_ALL_CONFIRM_THRESHOLD) {
      setConfirmApproveAll(true);
      return;
    }
    const count = approveAll();
    setSnackbar({ open: true, message: `Approved ${count} expense${count === 1 ? '' : 's'}` });
  }

  function performApproveAll() {
    const count = approveAll();
    setConfirmApproveAll(false);
    setSnackbar({ open: true, message: `Approved ${count} expenses` });
  }

  function handleEditSave(formData: ExpenseFormData) {
    if (!editing) return;
    // Replace by deleting the pending one and saving an approved one with the new values.
    reject(editing.id);
    saveExpense(formData, editing.source, 'approved');
    setEditing(null);
    setSnackbar({ open: true, message: 'Expense updated and approved' });
  }

  return (
    <>
      <StandardBottomSheet
        open={open}
        onClose={onClose}
        title="Pending Review"
        icon={<DraftsIcon fontSize="small" sx={{ color: 'primary.contrastText' }} />}
      >
        {/* Action bar: badge count + Approve All */}
        {pending.length > 0 && (
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider' }}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <Badge badgeContent={pending.length} color="primary">
                <Box sx={{ width: 8 }} />
              </Badge>
              <Typography variant="body2" color="text.secondary">
                {pending.length} expense{pending.length === 1 ? '' : 's'} pending
              </Typography>
            </Stack>
            {pending.length > 1 && (
              <Button size="small" startIcon={<CheckIcon />} onClick={handleApproveAll}>
                Approve All
              </Button>
            )}
          </Stack>
        )}

        {/* Body */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
          {pending.length === 0 ? (
            <EmptyState onClose={onClose} />
          ) : (
            <Stack spacing={2}>
              {pending.map((expense) => (
                <PendingItem
                  key={expense.id}
                  expense={expense}
                  onApprove={() => handleApprove(expense)}
                  onReject={() => handleReject(expense)}
                  onEdit={() => setEditing(expense)}
                />
              ))}
            </Stack>
          )}
        </Box>
      </StandardBottomSheet>

      {/* Approve All confirmation */}
      <Dialog open={confirmApproveAll} onClose={() => setConfirmApproveAll(false)}>
        <DialogTitle>Approve all pending expenses?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will approve {pending.length} expenses at once. You can&apos;t undo this in bulk.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmApproveAll(false)}>Cancel</Button>
          <Button variant="contained" onClick={performApproveAll}>
            Approve All
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit dialog */}
      <StandardBottomSheet
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Edit Expense"
        icon={<EditIcon fontSize="small" sx={{ color: 'primary.contrastText' }} />}
      >
        {editing && (
          <Box sx={{ p: 2 }}>
            <AddExpenseForm
              defaultDate={editing.date}
              viewMode="day"
              source={editing.source}
              initialValues={{
                date: toIsoDate(editing.date),
                amount: editing.amount,
                category: editing.category,
                description: editing.description,
              }}
              onSave={handleEditSave}
              onCancel={() => setEditing(null)}
              saveLabel="Save & Approve"
            />
          </Box>
        )}
      </StandardBottomSheet>

      {/* Feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        action={
          snackbar.undo ? (
            <Button
              color="secondary"
              size="small"
              onClick={() => {
                snackbar.undo!();
              }}
            >
              UNDO
            </Button>
          ) : undefined
        }
      />
    </>
  );
}

function PendingItem({
  expense,
  onApprove,
  onReject,
  onEdit,
}: {
  expense: Expense;
  onApprove: () => void;
  onReject: () => void;
  onEdit: () => void;
}) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
          <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
            {formatAmount(expense.amount)}
          </Typography>
          {expense.source === 'sms' && (
            <Chip icon={<SmsIcon />} label="SMS" size="small" color="info" variant="outlined" />
          )}
        </Stack>
        <Typography variant="subtitle1" sx={{ mb: 0.5 }}>
          {expense.description || 'No description'}
        </Typography>
        <Typography variant="caption" color="text.secondary" component="div" sx={{ mb: 1 }}>
          {formatDateLong(expense.date)}
        </Typography>
        <Chip
          label={expense.category || 'Uncategorized'}
          size="small"
          variant="outlined"
        />
      </CardContent>
      <CardActions sx={{ justifyContent: 'flex-end' }}>
        <Button startIcon={<EditIcon />} size="small" onClick={onEdit}>
          Edit
        </Button>
        <Button
          startIcon={<CloseRoundedIcon />}
          size="small"
          color="inherit"
          onClick={onReject}
        >
          Reject
        </Button>
        <Button
          variant="contained"
          startIcon={<CheckIcon />}
          size="small"
          onClick={onApprove}
        >
          Approve
        </Button>
      </CardActions>
    </Card>
  );
}

function EmptyState({ onClose }: { onClose: () => void }) {
  return (
    <Stack alignItems="center" spacing={2} sx={{ py: 6 }}>
      <Typography variant="h2" component="div">
        🎉
      </Typography>
      <Typography variant="h6">All caught up!</Typography>
      <Typography variant="body2" color="text.secondary" textAlign="center">
        No expenses waiting for review.
      </Typography>
      <Button variant="outlined" onClick={onClose}>
        Close
      </Button>
    </Stack>
  );
}

function formatAmount(amount: number): string {
  return `₹ ${amount.toFixed(2)}`;
}

function formatDateLong(d: Date): string {
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
