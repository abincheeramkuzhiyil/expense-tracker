'use client';

import { ReactNode, useCallback, useEffect, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  IconButton,
  LinearProgress,
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
  /** Range selector rendered on the left side of the sticky total card. */
  rangeControl?: ReactNode;
}

interface SelectedSubCategory {
  category: string;
  spentOn: string;
}

// Keep accordions flush and white so the grey page background does not show through gaps.
const flushAccordionSx = {
  backgroundColor: 'background.paper',
  boxShadow: 'none',
  borderBottom: '1px solid',
  borderColor: 'divider',
  '&:before': { display: 'none' },
  '&.Mui-expanded': { margin: 0 },
} as const;

export default function CategoryBreakdownReport({ range, rangeControl }: CategoryBreakdownReportProps) {
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

  return (
    <Box>
      {/* Sticky card: range selector on the left, total on the right */}
      <Paper
        elevation={1}
        sx={{
          mb: 1,
          position: 'sticky',
          top: { xs: '56px', sm: '64px' },
          zIndex: (theme) => theme.zIndex.appBar - 1,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            py: 1.5,
            px: 2,
          }}
        >
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>{rangeControl}</Box>
          <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', lineHeight: 1.1 }}>
              ₹{breakdown.total.toFixed(2)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Total
            </Typography>
          </Box>
        </Box>
      </Paper>

      {breakdown.total === 0 ? (
        <Typography color="text.secondary" sx={{ p: 3, textAlign: 'center' }}>
          No expenses found for this range.
        </Typography>
      ) : (
        <>
          {/* Header */}
          <Accordion disableGutters sx={{ ...flushAccordionSx, pointerEvents: 'none' }}>
            <AccordionSummary>
              <Typography sx={{ flexGrow: 1, fontWeight: 'bold' }}>Category</Typography>
              <Typography sx={{ fontWeight: 'bold' }}>
                Amount <span style={{ color: '#777', fontWeight: 400 }}>(Rs.)</span>
              </Typography>
            </AccordionSummary>
          </Accordion>

          {breakdown.categories.map((cat) => {
            const percent = breakdown.total > 0 ? (cat.total / breakdown.total) * 100 : 0;
            return (
              <Accordion key={cat.category} disableGutters sx={flushAccordionSx}>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{ '& .MuiAccordionSummary-content': { alignItems: 'center' } }}
                >
                  <Box sx={{ flexGrow: 1, mr: 2, minWidth: 0 }}>
                    <Typography noWrap>{cat.category}</Typography>
                    <Box sx={{ position: 'relative', mt: 0.5 }}>
                      <LinearProgress
                        variant="determinate"
                        value={percent}
                        sx={{ height: 18, borderRadius: 1 }}
                      />
                      <Typography
                        variant="caption"
                        aria-label={`${percent.toFixed(0)} percent of total`}
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 6,
                          lineHeight: '18px',
                          fontWeight: 'bold',
                          color: 'common.white',
                          textShadow: '0 0 2px rgba(0,0,0,0.6)',
                        }}
                      >
                        {percent.toFixed(0)}%
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                    <Typography>Rs. {cat.total.toFixed(2)}</Typography>
                  </Box>
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
        </>
      )}

      <CategoryExpenseListModal
        open={selected !== null}
        title={selected ? `${selected.category} \u00b7 ${selected.spentOn}` : ''}
        sections={[{ label: '', expenses: selectedExpenses }]}
        onClose={() => setSelected(null)}
      />
    </Box>
  );
}
