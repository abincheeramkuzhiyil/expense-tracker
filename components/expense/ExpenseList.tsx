'use client';

import { useState } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Typography,
  ButtonGroup,
  Button,
  Box,
  Snackbar,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Expense } from '@/types/expense.types';
import { ExpenseFormData } from '@/components/expense/AddExpenseForm';
import { deleteExpense, updateExpense } from '@/utils/expenseStorage';
import DeleteExpenseDialog from './DeleteExpenseDialog';
import EditExpenseDialog from './EditExpenseDialog';

interface ExpenseListProps {
  expenses: Expense[];
  total: number;
  onExpensesChanged: () => void;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error';
}

/** Formats a Date object to "YYYY-MM-DD" without timezone shifting. */
function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function ExpenseList({
  expenses,
  total,
  onExpensesChanged,
}: ExpenseListProps) {
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  });

  function handleDeleteConfirm() {
    if (!deletingExpense) return;
    const storedDate = toDateString(deletingExpense.date);
    const result = deleteExpense(deletingExpense.id, storedDate);
    if (result) {
      setSnackbar({ open: true, message: 'Expense deleted', severity: 'success' });
      onExpensesChanged();
    } else {
      setSnackbar({ open: true, message: 'Failed to delete expense', severity: 'error' });
    }
    setDeletingExpense(null);
  }

  function handleEditSave(formData: ExpenseFormData) {
    if (!editingExpense) return;
    const dateBeforeEdit = toDateString(editingExpense.date);
    const result = updateExpense(editingExpense.id, formData, dateBeforeEdit);
    if (result) {
      setSnackbar({ open: true, message: 'Changes saved', severity: 'success' });
      onExpensesChanged();
    } else {
      setSnackbar({ open: true, message: 'Failed to save changes', severity: 'error' });
    }
    setEditingExpense(null);
  }

  return (
    <>
      {/* Header */}
      <Accordion sx={{ pointerEvents: 'none' }}>
        <AccordionSummary>
          <Typography sx={{ flexGrow: 1, fontWeight: 'bold' }}>Spent on</Typography>
          <Typography sx={{ fontWeight: 'bold' }}>
            Amount <span style={{ color: '#777', fontWeight: 400 }}>(Rs.)</span>
          </Typography>
        </AccordionSummary>
      </Accordion>

      {/* Expense Items */}
      {expenses.map((expense) => (
        <Accordion key={expense.id}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography sx={{ flexGrow: 1, fontWeight: 500 }}>
              {expense.category}
            </Typography>
            <Typography sx={{ fontWeight: 500 }}>
              {expense.amount.toFixed(2)}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>
              <b>Details:</b> {expense.description}
            </Typography>
            <Box sx={{ textAlign: 'right', mt: 1 }}>
              <ButtonGroup variant="contained">
                <Button
                  startIcon={<EditIcon />}
                  onClick={() => setEditingExpense(expense)}
                >
                  Edit
                </Button>
                <Button
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => setDeletingExpense(expense)}
                >
                  Delete
                </Button>
              </ButtonGroup>
            </Box>
          </AccordionDetails>
        </Accordion>
      ))}

      {/* Footer - Total */}
      <Accordion sx={{ pointerEvents: 'none', position: 'sticky', bottom: 0 }}>
        <AccordionSummary sx={{ pr: '75px' }}>
          <Typography sx={{ flexGrow: 1, fontWeight: 'bold' }}>Total</Typography>
          <Typography sx={{ fontWeight: 'bold' }}>{total.toFixed(2)}</Typography>
        </AccordionSummary>
      </Accordion>

      {/* Delete confirmation dialog */}
      <DeleteExpenseDialog
        open={!!deletingExpense}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingExpense(null)}
      />

      {/* Edit dialog */}
      <EditExpenseDialog
        expense={editingExpense}
        onSave={handleEditSave}
        onCancel={() => setEditingExpense(null)}
      />

      {/* Feedback snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
