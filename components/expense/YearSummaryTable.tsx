'use client';

import { useState } from 'react';
import {
  Accordion,
  AccordionSummary,
  Typography,
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  IconButton,
  Paper,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { Expense } from '@/types/expense.types';
import MonthDetailModal from './MonthDetailModal';

const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

interface YearSummaryTableProps {
  year: number;
  expenses: Expense[];
}

export default function YearSummaryTable({ year, expenses }: YearSummaryTableProps) {
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  // Build a map of month (1-12) → total amount
  const monthlyTotals = new Map<number, number>();
  for (const exp of expenses) {
    const m = exp.date.getMonth() + 1;
    monthlyTotals.set(m, (monthlyTotals.get(m) ?? 0) + exp.amount);
  }

  const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <>
      {/* Header */}
      <Accordion sx={{ pointerEvents: 'none' }}>
        <AccordionSummary>
          <Typography sx={{ flexGrow: 1, fontWeight: 'bold' }}>Month</Typography>
          <Typography sx={{ fontWeight: 'bold' }}>
            Amount <span style={{ color: '#777', fontWeight: 400 }}>(Rs.)</span>
          </Typography>
        </AccordionSummary>
      </Accordion>

      <TableContainer component={Paper} elevation={0}>
        <Table>
          <TableBody>
            {SHORT_MONTHS.map((name, idx) => {
              const m = idx + 1;
              const monthTotal = monthlyTotals.get(m) ?? 0;
              const hasExpenses = monthTotal > 0;

              return (
                <TableRow key={m}>
                  <TableCell
                    component="th"
                    scope="row"
                    sx={{
                      fontSize: '1rem',
                      lineHeight: 1.1,
                      width: '57.6%',
                      color: hasExpenses ? 'text.primary' : 'text.disabled',
                    }}
                  >
                    {name}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      fontSize: '1rem',
                      lineHeight: 1.1,
                      width: '37.5%',
                      color: hasExpenses ? 'text.primary' : 'text.disabled',
                    }}
                  >
                    {monthTotal.toFixed(2)}
                  </TableCell>
                  <TableCell
                    sx={{
                      lineHeight: 1.1,
                      width: '5%',
                      padding: '0 19px 0 0',
                    }}
                  >
                    <IconButton size="medium" onClick={() => setSelectedMonth(m)}>
                      <KeyboardArrowDownIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Footer */}
      <Accordion sx={{ pointerEvents: 'none', position: 'sticky', bottom: 0 }}>
        <AccordionSummary sx={{ pr: '80px' }}>
          <Typography sx={{ flexGrow: 1, fontWeight: 'bold' }}>Total</Typography>
          <Typography sx={{ fontWeight: 'bold' }}>{total.toFixed(2)}</Typography>
        </AccordionSummary>
      </Accordion>

      {selectedMonth !== null && (
        <MonthDetailModal
          open={true}
          year={year}
          month={selectedMonth}
          onClose={() => setSelectedMonth(null)}
        />
      )}
    </>
  );
}
