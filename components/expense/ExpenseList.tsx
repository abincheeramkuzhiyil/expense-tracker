'use client';

import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  ButtonGroup,
  Button,
  Box,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Expense } from '@/types/expense.types';

interface ExpenseListProps {
  expenses: Expense[];
  total: number;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function ExpenseList({
  expenses,
  total,
  onEdit,
  onDelete,
}: ExpenseListProps) {
  return (
    <>
      {/* Header */}
      <Accordion sx={{ pointerEvents: 'none' }}>
        <AccordionSummary>
          <Typography sx={{ flexGrow: 1 }}>Spent on</Typography>
          <Typography>
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
                  onClick={() => onEdit(expense.id)}
                >
                  Edit
                </Button>
                <Button
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => onDelete(expense.id)}
                >
                  Delete
                </Button>
              </ButtonGroup>
            </Box>
          </AccordionDetails>
        </Accordion>
      ))}

      {/* Footer - Total */}
      <Accordion sx={{ pointerEvents: 'none' }}>
        <AccordionSummary>
          <Typography sx={{ flexGrow: 1 }}>Total</Typography>
          <Typography>{total.toFixed(2)}</Typography>
        </AccordionSummary>
      </Accordion>
    </>
  );
}
