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
  TableHead,
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
          <TableContainer component={Paper} elevation={0} sx={{ mb: 1 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell />
                  <TableCell align="right">{formatPeriodLabel(periodA)}</TableCell>
                  <TableCell align="right">{formatPeriodLabel(periodB)}</TableCell>
                  <TableCell align="right">Change</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Total</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>{result.totalA.toFixed(2)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>{result.totalB.toFixed(2)}</TableCell>
                  <TableCell align="right">
                    <ChangeIndicator changePercent={result.changePercent} />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          {result.categories.map((cat) => (
            <Accordion key={cat.category}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography sx={{ flexGrow: 1 }}>{cat.category}</Typography>
                <Typography sx={{ mr: 2, minWidth: 70, textAlign: 'right' }}>{cat.totalA.toFixed(2)}</Typography>
                <Typography sx={{ mr: 2, minWidth: 70, textAlign: 'right' }} color="text.secondary">
                  {cat.totalB.toFixed(2)}
                </Typography>
                <ChangeIndicator changePercent={cat.changePercent} />
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0 }}>
                <TableContainer component={Paper} elevation={0}>
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
