'use client';

import EditIcon from '@mui/icons-material/Edit';
import StandardBottomSheet from '@/components/common/StandardBottomSheet';
import AddExpenseForm, { ExpenseFormData } from '@/components/expense/AddExpenseForm';
import { Expense } from '@/types/expense.types';
import { formatDateForInput } from '@/utils/dateFormatter';

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
  if (!expense) return null;

  const initialValues: Partial<ExpenseFormData> = {
    date: formatDateForInput(expense.date),
    category: expense.category,
    amount: expense.amount,
    description: expense.description,
  };

  return (
    <StandardBottomSheet
      open={true}
      onClose={onCancel}
      title="Edit Expense"
      icon={<EditIcon fontSize="small" sx={{ color: 'primary.contrastText' }} />}
    >
      <AddExpenseForm
        defaultDate={expense.date}
        viewMode="day"
        initialValues={initialValues}
        saveLabel="Save Changes"
        onSave={onSave}
        onCancel={onCancel}
      />
    </StandardBottomSheet>
  );
}
