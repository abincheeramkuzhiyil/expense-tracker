'use client';

import { Box, Divider, Typography } from '@mui/material';
import ListAltIcon from '@mui/icons-material/ListAlt';
import StandardBottomSheet from '@/components/common/StandardBottomSheet';
import ExpenseList from '@/components/expense/ExpenseList';
import { Expense } from '@/types/expense.types';

export interface ExpenseListSection {
  label: string;
  expenses: Expense[];
}

interface CategoryExpenseListModalProps {
  open: boolean;
  title: string;
  /** One section for a single-range breakdown, two for a period comparison (A vs B). */
  sections: ExpenseListSection[];
  onClose: () => void;
}

/**
 * Read-only drill-down sheet for a Category + Sub-Category.
 * Edits/deletes still work via ExpenseList; the underlying report recomputes
 * automatically through the existing storage change subscription, so no
 * local refresh callback is needed here.
 */
export default function CategoryExpenseListModal({
  open,
  title,
  sections,
  onClose,
}: CategoryExpenseListModalProps) {
  return (
    <StandardBottomSheet
      open={open}
      onClose={onClose}
      title={title}
      icon={<ListAltIcon fontSize="small" sx={{ color: 'primary.contrastText' }} />}
    >
      <Box sx={{ padding: '1rem', backgroundColor: '#eaeeef' }}>
        {sections.map((section, idx) => {
          const total = section.expenses.reduce((sum, exp) => sum + exp.amount, 0);
          return (
            <Box key={section.label} sx={{ mb: idx < sections.length - 1 ? 2 : 0 }}>
              {sections.length > 1 && (
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  {section.label}
                </Typography>
              )}
              {section.expenses.length === 0 ? (
                <Typography color="text.secondary" variant="body2" sx={{ py: 1 }}>
                  No expenses.
                </Typography>
              ) : (
                <ExpenseList expenses={section.expenses} total={total} onExpensesChanged={() => {}} />
              )}
              {sections.length > 1 && idx < sections.length - 1 && <Divider sx={{ mt: 2 }} />}
            </Box>
          );
        })}
      </Box>
    </StandardBottomSheet>
  );
}
