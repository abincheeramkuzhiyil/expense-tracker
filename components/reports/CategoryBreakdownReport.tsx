'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { DateRange } from '@/types/report.types';
import { buildCategoryBreakdown } from '@/utils/reportAggregation';
import { subscribeToExpenseChanges } from '@/utils/expenseStorage';
import CategoryExpenseListModal from './CategoryExpenseListModal';

interface CategoryBreakdownReportProps {
  range: DateRange;
}

interface SelectedSubCategory {
  category: string;
  spentOn: string;
}

export default function CategoryBreakdownReport({ range }: CategoryBreakdownReportProps) {
  const [breakdown, setBreakdown] = useState(() => buildCategoryBreakdown(range));
  const [selected, setSelected] = useState<SelectedSubCategory | null>(null);

  const refresh = useCallback(() => setBreakdown(buildCategoryBreakdown(range)), [range]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => subscribeToExpenseChanges(refresh), [refresh]);

  const selectedExpenses = selected
    ? breakdown.categories
        .find((c) => c.category === selected.category)
        ?.subCategories.find((s) => s.spentOn === selected.spentOn)?.expenses ?? []
    : [];

  if (breakdown.total === 0) {
    return (
      <Typography color="text.secondary" sx={{ p: 3, textAlign: 'center' }}>
        No expenses found for this range.
      </Typography>
    );
  }

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ px: 1, pb: 1, fontWeight: 'bold' }}>
        Total: Rs. {breakdown.total.toFixed(2)}
      </Typography>

      {breakdown.categories.map((cat) => {
        const percent = breakdown.total > 0 ? (cat.total / breakdown.total) * 100 : 0;
        return (
          <Accordion key={cat.category}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography sx={{ flexGrow: 1 }}>{cat.category}</Typography>
              <Typography sx={{ mr: 1 }}>Rs. {cat.total.toFixed(2)}</Typography>
              <Typography color="text.secondary" variant="body2">
                ({percent.toFixed(0)}%)
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              <TableContainer component={Paper} elevation={0}>
                <Table size="small">
                  <TableBody>
                    {cat.subCategories.map((sub) => (
                      <TableRow key={sub.spentOn}>
                        <TableCell>{sub.spentOn}</TableCell>
                        <TableCell align="right">{sub.total.toFixed(2)}</TableCell>
                        <TableCell sx={{ width: 48, padding: '0 8px' }}>
                          <IconButton
                            size="small"
                            aria-label={`View ${sub.spentOn} expenses`}
                            onClick={() => setSelected({ category: cat.category, spentOn: sub.spentOn })}
                          >
                            <KeyboardArrowDownIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        );
      })}

      <CategoryExpenseListModal
        open={selected !== null}
        title={selected ? `${selected.category} \u00b7 ${selected.spentOn}` : ''}
        sections={[{ label: '', expenses: selectedExpenses }]}
        onClose={() => setSelected(null)}
      />
    </Box>
  );
}
