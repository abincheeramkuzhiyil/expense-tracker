'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { ComparePeriod, ComparePeriodType } from '@/types/report.types';
import { comparePeriods } from '@/utils/reportAggregation';
import { getAvailableYears, subscribeToExpenseChanges } from '@/utils/expenseStorage';
import PeriodPicker from './PeriodPicker';
import CategoryExpenseListModal from './CategoryExpenseListModal';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function formatPeriodLabel(period: ComparePeriod): string {
  return period.type === 'year' ? String(period.year) : `${MONTH_NAMES[(period.month ?? 1) - 1]} ${period.year}`;
}

function defaultPeriods(compareBy: ComparePeriodType): [ComparePeriod, ComparePeriod] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  if (compareBy === 'month') {
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    return [
      { type: 'month', year, month },
      { type: 'month', year: prevYear, month: prevMonth },
    ];
  }
  return [
    { type: 'year', year },
    { type: 'year', year: year - 1 },
  ];
}

function ChangeIndicator({ changePercent }: { changePercent: number | null }) {
  if (changePercent === null) {
    return (
      <Typography component="span" variant="body2" color="text.secondary">
        —
      </Typography>
    );
  }
  const isUp = changePercent >= 0;
  return (
    <Typography
      component="span"
      variant="body2"
      sx={{ display: 'inline-flex', alignItems: 'center', color: isUp ? 'success.main' : 'error.main' }}
    >
      {isUp ? <ArrowUpwardIcon fontSize="inherit" /> : <ArrowDownwardIcon fontSize="inherit" />}
      {Math.abs(changePercent).toFixed(1)}%
    </Typography>
  );
}

interface SelectedSubCategory {
  category: string;
  spentOn: string;
}

// Rows sit flush and white while collapsed; an expanded row lifts out with a margin and
// shadow so its detail area is clearly separated from the neighbouring rows (like the Day view).
const flushAccordionSx = {
  backgroundColor: 'background.paper',
  boxShadow: 'none',
  borderBottom: '1px solid',
  borderColor: 'divider',
  '&:before': { display: 'none' },
  '&.Mui-expanded': {
    margin: '12px 0',
    borderBottom: 'none',
    borderRadius: 1,
    boxShadow: 3,
  },
} as const;

export default function ComparePeriodsReport() {
  const years = getAvailableYears();
  const yearOptions = years.length > 0 ? years : [new Date().getFullYear()];

  const [compareBy, setCompareBy] = useState<ComparePeriodType>('month');
  const [periodA, setPeriodA] = useState<ComparePeriod>(() => defaultPeriods('month')[0]);
  const [periodB, setPeriodB] = useState<ComparePeriod>(() => defaultPeriods('month')[1]);
  const [selected, setSelected] = useState<SelectedSubCategory | null>(null);

  const [result, setResult] = useState(() => comparePeriods(periodA, periodB));

  const refresh = useCallback(() => setResult(comparePeriods(periodA, periodB)), [periodA, periodB]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => subscribeToExpenseChanges(refresh), [refresh]);

  function handleCompareByChange(_event: unknown, value: ComparePeriodType | null) {
    if (!value) return;
    setCompareBy(value);
    const [a, b] = defaultPeriods(value);
    setPeriodA(a);
    setPeriodB(b);
  }

  const selectedRow = selected
    ? result.categories
        .find((c) => c.category === selected.category)
        ?.subCategories.find((s) => s.spentOn === selected.spentOn) ?? null
    : null;

  return (
    <Box>
      <ToggleButtonGroup
        value={compareBy}
        exclusive
        size="small"
        onChange={handleCompareByChange}
        sx={{ mb: 2 }}
      >
        <ToggleButton value="month">Month</ToggleButton>
        <ToggleButton value="year">Year</ToggleButton>
      </ToggleButtonGroup>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
        <PeriodPicker label="Period A" compareBy={compareBy} period={periodA} years={yearOptions} onChange={setPeriodA} />
        <PeriodPicker label="Period B" compareBy={compareBy} period={periodB} years={yearOptions} onChange={setPeriodB} />
      </Box>

      {result.totalA === 0 && result.totalB === 0 ? (
        <Typography color="text.secondary" sx={{ p: 3, textAlign: 'center' }}>
          No expenses found for either period.
        </Typography>
      ) : (
        <>
          {/* Total summary card — mimics the navigation card above the Expenses table */}
          <Paper elevation={1} sx={{ mb: 1 }}>
            <Grid container alignItems="center" justifyContent="space-around" sx={{ py: 1.5, px: 1 }}>
              <Grid item sx={{ textAlign: 'center' }}>
                <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block' }}>
                  {formatPeriodLabel(periodA)}
                </Typography>
                <Typography variant="body1">₹{result.totalA.toFixed(2)}</Typography>
              </Grid>
              <Grid item sx={{ textAlign: 'center' }}>
                <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block' }}>
                  {formatPeriodLabel(periodB)}
                </Typography>
                <Typography variant="body1">₹{result.totalB.toFixed(2)}</Typography>
              </Grid>
              <Grid item sx={{ textAlign: 'center' }}>
                <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block' }}>
                  Change
                </Typography>
                <ChangeIndicator changePercent={result.changePercent} />
              </Grid>
            </Grid>
          </Paper>

          {result.categories.map((cat) => (
            <Accordion key={cat.category} disableGutters sx={flushAccordionSx}>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{ '& .MuiAccordionSummary-content': { my: 1 } }}
              >
                <Box sx={{ width: '100%', minWidth: 0 }}>
                  <Typography sx={{ wordBreak: 'break-word', fontWeight: 500, mb: 0.5 }}>
                    {cat.category}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="caption" color="text.secondary" noWrap display="block">
                        {formatPeriodLabel(periodA)}
                      </Typography>
                      <Typography variant="body2">{cat.totalA.toFixed(2)}</Typography>
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="caption" color="text.secondary" noWrap display="block">
                        {formatPeriodLabel(periodB)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {cat.totalB.toFixed(2)}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Change
                      </Typography>
                      <ChangeIndicator changePercent={cat.changePercent} />
                    </Box>
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0, backgroundColor: 'grey.50' }}>
                <TableContainer component={Paper} elevation={0} sx={{ backgroundColor: 'transparent' }}>
                  <Table size="small">
                    <TableBody>
                      {cat.subCategories.map((sub) => (
                        <TableRow key={sub.spentOn}>
                          <TableCell>{sub.spentOn}</TableCell>
                          <TableCell align="right">{sub.totalA.toFixed(2)}</TableCell>
                          <TableCell align="right">{sub.totalB.toFixed(2)}</TableCell>
                          <TableCell align="right">
                            <ChangeIndicator changePercent={sub.changePercent} />
                          </TableCell>
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
          ))}
        </>
      )}

      <CategoryExpenseListModal
        open={selected !== null}
        title={selected ? `${selected.category} \u00b7 ${selected.spentOn}` : ''}
        sections={
          selectedRow
            ? [
                { label: formatPeriodLabel(periodA), expenses: selectedRow.expensesA },
                { label: formatPeriodLabel(periodB), expenses: selectedRow.expensesB },
              ]
            : []
        }
        onClose={() => setSelected(null)}
      />
    </Box>
  );
}
