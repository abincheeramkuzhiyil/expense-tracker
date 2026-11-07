'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import StandardBottomSheet from '@/components/common/StandardBottomSheet';
import DayDetailModal from './DayDetailModal';
import { useSearchableExpenses } from '@/hooks/useSearchableExpenses';
import {
  SearchQuery,
  SearchRange,
  buildSpentOnIndex,
  dateKeyToDate,
  formatResultDate,
  searchExpenses,
  suggestSpentOn,
} from '@/utils/expenseSearch';

const PAGE_SIZE = 50;

const RANGES: { value: SearchRange; label: string }[] = [
  { value: 'all', label: 'All time' },
  { value: '12m', label: 'Last 12 months' },
  { value: '3m', label: 'Last 3 months' },
];

type SearchOption =
  | { kind: 'spentOn'; label: string; count: number }
  | { kind: 'text'; query: string };

function optionLabel(option: SearchOption | string): string {
  if (typeof option === 'string') return option;
  return option.kind === 'spentOn' ? option.label : option.query;
}

interface ExpenseSearchSheetProps {
  open: boolean;
  onClose: () => void;
}

function SearchPanel({ open }: { open: boolean }) {
  const expenses = useSearchableExpenses(open);
  const index = useMemo(() => buildSpentOnIndex(expenses), [expenses]);

  const [inputValue, setInputValue] = useState('');
  const [query, setQuery] = useState<SearchQuery | null>(null);
  const [range, setRange] = useState<SearchRange>('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Wait for the sheet's slide-up transition before focusing, otherwise focus is lost.
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 350);
    return () => clearTimeout(timer);
  }, [open]);

  const options = useMemo<SearchOption[]>(() => {
    const trimmed = inputValue.trim();
    if (!trimmed) return [];
    return [
      ...suggestSpentOn(index, trimmed).map((s) => ({ kind: 'spentOn' as const, ...s })),
      { kind: 'text' as const, query: trimmed },
    ];
  }, [index, inputValue]);

  const results = useMemo(
    () => (query ? searchExpenses(expenses, query, range) : []),
    [expenses, query, range]
  );
  const visible = results.slice(0, visibleCount);

  function applyQuery(next: SearchQuery | null) {
    setQuery(next);
    setVisibleCount(PAGE_SIZE);
  }

  function handleSelect(value: SearchOption | string | null) {
    if (!value) return;
    if (typeof value === 'string') {
      if (value.trim()) applyQuery({ type: 'text', value });
    } else if (value.kind === 'spentOn') {
      applyQuery({ type: 'spentOn', value: value.label });
    } else {
      applyQuery({ type: 'text', value: value.query });
    }
  }

  function handleRangeChange(next: SearchRange) {
    setRange(next);
    setVisibleCount(PAGE_SIZE);
  }

  return (
    <Box sx={{ p: 2, maxWidth: 720, mx: 'auto' }}>
      <Autocomplete<SearchOption, false, false, true>
        freeSolo
        value={null}
        inputValue={inputValue}
        options={options}
        filterOptions={(opts) => opts}
        getOptionLabel={optionLabel}
        onInputChange={(_, value, reason) => {
          setInputValue(value);
          // Typing or clearing invalidates the shown results; selecting (reason "reset") keeps them.
          if (reason !== 'reset') applyQuery(null);
        }}
        onChange={(_, value) => handleSelect(value)}
        renderOption={(props, option) => (
          <li {...props} key={option.kind === 'text' ? '__text' : option.label}>
            {option.kind === 'text' ? (
              <Stack direction="row" alignItems="center" spacing={1}>
                <SearchIcon fontSize="small" />
                <span>Search &quot;{option.query}&quot; in all text</span>
              </Stack>
            ) : (
              <Stack direction="row" sx={{ width: '100%' }} justifyContent="space-between">
                <span>{option.label}</span>
                <Typography component="span" variant="body2" color="text.secondary">
                  {option.count}
                </Typography>
              </Stack>
            )}
          </li>
        )}
        renderInput={(params) => (
          <TextField
            {...params}
            inputRef={inputRef}
            variant="filled"
            fullWidth
            label="Spent On or keyword"
          />
        )}
      />

      <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap', rowGap: 1 }}>
        {RANGES.map((r) => (
          <Chip
            key={r.value}
            label={r.label}
            clickable
            color={range === r.value ? 'primary' : 'default'}
            variant={range === r.value ? 'filled' : 'outlined'}
            aria-pressed={range === r.value}
            onClick={() => handleRangeChange(r.value)}
          />
        ))}
      </Stack>

      {!query && (
        <Typography color="text.secondary" sx={{ mt: 4, textAlign: 'center' }}>
          Find any expense, e.g. Haircut, Flight, Groceries
        </Typography>
      )}

      {query && results.length === 0 && (
        <Box sx={{ mt: 4, textAlign: 'center' }} data-testid="search-no-results">
          <Typography>No expenses found for &quot;{query.value}&quot;</Typography>
          <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 2 }}>
            {query.type === 'spentOn' && (
              <Button
                variant="outlined"
                size="small"
                onClick={() => applyQuery({ type: 'text', value: query.value })}
              >
                Search all text
              </Button>
            )}
            {range !== 'all' && (
              <Button variant="outlined" size="small" onClick={() => handleRangeChange('all')}>
                All time
              </Button>
            )}
          </Stack>
        </Box>
      )}

      {query && results.length > 0 && (
        <Box sx={{ mt: 2, p: 1, backgroundColor: '#eaeeef' }}>
          <TableContainer sx={{ backgroundColor: 'background.paper' }}>
            <Table size="small" sx={{ tableLayout: 'fixed' }} data-testid="search-results">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 78, px: 1, fontWeight: 'bold' }}>Date</TableCell>
                  <TableCell sx={{ px: 1, fontWeight: 'bold' }}>Spent On</TableCell>
                  <TableCell align="right" sx={{ width: 84, px: 1, fontWeight: 'bold' }}>
                    Amount
                  </TableCell>
                  <TableCell sx={{ width: 44, p: 0 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {visible.map((e) => {
                  const dateLabel = formatResultDate(e.date);
                  return (
                    <TableRow key={e.id} data-testid="search-result-row">
                      <TableCell sx={{ px: 1, whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                        {dateLabel}
                      </TableCell>
                      <TableCell sx={{ px: 1 }}>
                        <Typography variant="body2" noWrap>
                          {e.spentOn}
                        </Typography>
                        {e.description.trim() && (
                          <Typography variant="caption" color="text.secondary" noWrap display="block">
                            {e.description}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right" sx={{ px: 1 }}>
                        {e.amount.toFixed(2)}
                      </TableCell>
                      <TableCell sx={{ p: 0 }}>
                        <IconButton
                          size="small"
                          aria-label={`View expenses on ${dateLabel}`}
                          onClick={() => setSelectedDate(dateKeyToDate(e.date))}
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
          {results.length > visible.length && (
            <Box sx={{ textAlign: 'center', mt: 1 }}>
              <Button onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
                Show more ({visible.length} of {results.length})
              </Button>
            </Box>
          )}
        </Box>
      )}

      {selectedDate && (
        <DayDetailModal
          open
          date={selectedDate}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </Box>
  );
}

export default function ExpenseSearchSheet({ open, onClose }: ExpenseSearchSheetProps) {
  // SwipeableDrawer keeps children mounted when closed; a new key on each open resets the search state.
  const [sessionKey, setSessionKey] = useState(0);
  useEffect(() => {
    if (open) setSessionKey((k) => k + 1);
  }, [open]);

  return (
    <StandardBottomSheet
      open={open}
      onClose={onClose}
      title="Search Expenses"
      icon={<SearchIcon fontSize="small" sx={{ color: 'primary.contrastText' }} />}
    >
      <SearchPanel key={sessionKey} open={open} />
    </StandardBottomSheet>
  );
}
