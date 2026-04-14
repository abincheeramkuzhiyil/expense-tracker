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
import DayDetailModal from './DayDetailModal';

const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface MonthDayTableProps {
  year: number;
  month: number; // 1-12
  expenses: Expense[];
}

export default function MonthDayTable({ year, month, expenses }: MonthDayTableProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Build a map of day-of-month → total amount
  const dailyTotals = new Map<number, number>();
  for (const exp of expenses) {
    const day = exp.date.getDate();
    dailyTotals.set(day, (dailyTotals.get(day) ?? 0) + exp.amount);
  }

  // Generate every day in the month (month is 1-based; new Date(y, m, 0) gives last day of month)
  const daysInMonth = new Date(year, month, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <>
      {/* Header */}
      <Accordion sx={{ pointerEvents: 'none' }}>
        <AccordionSummary>
          <Typography sx={{ flexGrow: 1 }}>Date</Typography>
          <Typography>
            Amount <span style={{ color: '#777', fontWeight: 400 }}>(Rs.)</span>
          </Typography>
        </AccordionSummary>
      </Accordion>

      <TableContainer component={Paper} elevation={0}>
        <Table>
          <TableBody>
            {days.map((day) => {
              const dayTotal = dailyTotals.get(day) ?? 0;
              const hasExpenses = dayTotal > 0;
              const dayName = SHORT_DAYS[new Date(year, month - 1, day).getDay()];

              return (
                <TableRow key={day}>
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
                    {day} -<span style={{ fontSize: '0.8rem' }}> {dayName}</span>
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
                    {dayTotal.toFixed(2)}
                  </TableCell>
                  <TableCell
                    sx={{
                      lineHeight: 1.1,
                      width: '5%',
                      padding: '0 19px 0 0',
                      color: hasExpenses ? 'text.primary' : 'text.disabled',
                    }}
                  >
                    <IconButton
                      size="medium"
                      onClick={() => setSelectedDate(new Date(year, month - 1, day))}
                    >
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
        <AccordionSummary>
          <Typography sx={{ flexGrow: 1 }}>Total</Typography>
          <Typography>{total.toFixed(2)}</Typography>
        </AccordionSummary>
      </Accordion>

      {selectedDate && (
        <DayDetailModal
          open={true}
          date={selectedDate}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </>
  );
}
