'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Autocomplete, Box, Button, Stack, Tab, Tabs, TextField, Typography } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import StandardBottomSheet from '@/components/common/StandardBottomSheet';
import SearchResultsTable, { SEARCH_PAGE_SIZE, SearchRangeChips } from './SearchResultsTable';
import TagFilterPanel from './TagFilterPanel';
import { useSearchableExpenses } from '@/hooks/useSearchableExpenses';
import { dismissKeyboardOnTouch } from '@/utils/dismissKeyboard';
import {
  SearchQuery,
  SearchRange,
  buildSpentOnIndex,
  searchExpenses,
  suggestSpentOn,
} from '@/utils/expenseSearch';

const PAGE_SIZE = SEARCH_PAGE_SIZE;

type SearchTab = 'keyword' | 'tags';

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

  function applyQuery(next: SearchQuery | null) {
    setQuery(next);
    setVisibleCount(PAGE_SIZE);
  }

  function handleSelect(value: SearchOption | string | null) {
    if (!value) return;
    if (typeof value === 'string') {
      if (!value.trim()) return;
      applyQuery({ type: 'text', value });
    } else if (value.kind === 'spentOn') {
      applyQuery({ type: 'spentOn', value: value.label });
    } else {
      applyQuery({ type: 'text', value: value.query });
    }
    // Close the keyboard so the results are visible without another tap
    dismissKeyboardOnTouch();
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

      <SearchRangeChips range={range} onChange={handleRangeChange} />

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
        <SearchResultsTable
          results={results}
          visibleCount={visibleCount}
          onShowMore={() => setVisibleCount((c) => c + PAGE_SIZE)}
        />
      )}
    </Box>
  );
}

export default function ExpenseSearchSheet({ open, onClose }: ExpenseSearchSheetProps) {
  // SwipeableDrawer keeps children mounted when closed; a new key on each open resets the search state.
  const [sessionKey, setSessionKey] = useState(0);
  const [tab, setTab] = useState<SearchTab>('keyword');
  useEffect(() => {
    if (open) {
      setSessionKey((k) => k + 1);
      setTab('keyword');
    }
  }, [open]);

  return (
    <StandardBottomSheet
      open={open}
      onClose={onClose}
      title="Search Expenses"
      icon={<SearchIcon fontSize="small" sx={{ color: 'primary.contrastText' }} />}
    >
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={tab}
          onChange={(_e, value: SearchTab) => setTab(value)}
          variant="fullWidth"
          aria-label="Search mode"
        >
          <Tab value="keyword" label="Keyword" icon={<SearchIcon />} iconPosition="start" />
          <Tab value="tags" label="Tags" icon={<LocalOfferOutlinedIcon />} iconPosition="start" />
        </Tabs>
      </Box>
      {/* Both panels stay mounted so each keeps its own state while switching tabs */}
      <Box hidden={tab !== 'keyword'}>
        <SearchPanel key={`k-${sessionKey}`} open={open} />
      </Box>
      <Box hidden={tab !== 'tags'}>
        <TagFilterPanel key={`t-${sessionKey}`} open={open} />
      </Box>
    </StandardBottomSheet>
  );
}
