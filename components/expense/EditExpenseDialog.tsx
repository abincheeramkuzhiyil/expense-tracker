'use client';

import { forwardRef } from 'react';
import {
  AppBar,
  Dialog,
  IconButton,
  Slide,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import CloseIcon from '@mui/icons-material/Close';
import AddExpenseForm, { ExpenseFormData } from '@/components/expense/AddExpenseForm';
import { Expense } from '@/types/expense.types';
import { formatDateForInput } from '@/utils/dateFormatter';

const SlideUpTransition = forwardRef(function SlideUpTransition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface EditExpenseDialogProps {
  expense: Expense | null;
  onSave: (formData: ExpenseFormData) => void;
  onCancel: () => void;
}

export default function EditExpenseDialog({
  expense,
  onSave,
  onCancel,
}: EditExpenseDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  if (!expense) return null;

  const initialValues: Partial<ExpenseFormData> = {
    date: formatDateForInput(expense.date),
    category: expense.category,
    amount: expense.amount,
    description: expense.description,
  };

  return (
    <Dialog
      open={true}
      onClose={onCancel}
      fullScreen={fullScreen}
      maxWidth="sm"
      fullWidth
      TransitionComponent={SlideUpTransition}
    >
      {fullScreen && (
        <AppBar sx={{ position: 'relative' }}>
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Edit Expense
            </Typography>
            <IconButton
              edge="end"
              color="inherit"
              onClick={onCancel}
              aria-label="Close edit dialog"
            >
              <CloseIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
      )}
      <AddExpenseForm
        defaultDate={expense.date}
        viewMode="day"
        initialValues={initialValues}
        saveLabel="Save Changes"
        onSave={onSave}
        onCancel={onCancel}
      />
    </Dialog>
  );
}
