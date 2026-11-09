'use client';

import { useMemo, useState } from 'react';
import { Autocomplete, Box, Button, Stack, TextField, Typography } from '@mui/material';
import TagPills from './TagPills';
import SearchResultsTable, { SEARCH_PAGE_SIZE, SearchRangeChips } from './SearchResultsTable';
import { useSearchableExpenses } from '@/hooks/useSearchableExpenses';
import { dismissKeyboardOnTouch } from '@/utils/dismissKeyboard';
import {
  SearchRange,
  TagSuggestion,
  buildTagIndex,
  filterByTags,
  sumAmounts,
  suggestTags,
} from '@/utils/expenseSearch';

interface TagFilterPanelProps {
  open: boolean;
}

/**
 * "Tags" tab of the Search sheet: pick one or more tags and list every expense that has ALL of them,
 * with a fixed Total row. Kept separate from the keyword search so the two never mix.
 */
export default function TagFilterPanel({ open }: TagFilterPanelProps) {
  const expenses = useSearchableExpenses(open);
  const index = useMemo(() => buildTagIndex(expenses), [expenses]);

  const [selected, setSelected] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [range, setRange] = useState<SearchRange>('all');
  const [visibleCount, setVisibleCount] = useState(SEARCH_PAGE_SIZE);

  const results = useMemo(
    () => filterByTags(expenses, selected, range),
    [expenses, selected, range]
  );
  const total = useMemo(() => sumAmounts(results), [results]);
  const hasTags = index.length > 0;

  function changeSelected(next: string[]) {
    setSelected(next);
    setVisibleCount(SEARCH_PAGE_SIZE);
  }

  function handleRangeChange(next: SearchRange) {
    setRange(next);
    setVisibleCount(SEARCH_PAGE_SIZE);
  }

  return (
    <Box sx={{ p: 2, maxWidth: 720, mx: 'auto' }}>
      <Autocomplete<TagSuggestion, true, false, false>
        multiple
        openOnFocus
        value={[]}
        inputValue={inputValue}
        options={index}
        disabled={!hasTags}
        filterOptions={(_options, state) => suggestTags(index, state.inputValue, selected)}
        getOptionLabel={(o) => o.label}
        isOptionEqualToValue={(a, b) => a.label === b.label}
        renderTags={() => null}
        noOptionsText="No matching tags"
        onInputChange={(_, value, reason) => {
          if (reason === 'input' || reason === 'clear') setInputValue(value);
        }}
        onChange={(_, value, reason) => {
          if (reason !== 'selectOption') return;
          const picked = value[value.length - 1];
          if (picked) changeSelected([...selected, picked.label]);
          setInputValue('');
          // Close the keyboard so the results are visible without another tap
          dismissKeyboardOnTouch();
        }}
        renderOption={(props, option) => (
          <li {...props} key={option.label}>
            <Stack direction="row" sx={{ width: '100%' }} justifyContent="space-between">
              <span>{option.label}</span>
              <Typography component="span" variant="body2" color="text.secondary">
                {option.count}
              </Typography>
            </Stack>
          </li>
        )}
        renderInput={(params) => (
          <TextField
            {...params}
            variant="filled"
            fullWidth
            label="Select tags"
            helperText={
              hasTags ? undefined : 'No tags yet. Add tags when you create or edit an expense.'
            }
          />
        )}
      />

      {selected.length > 0 && (
        <Box sx={{ mt: 1.5 }}>
          <TagPills
            tags={selected}
            onDelete={(tag) => changeSelected(selected.filter((t) => t !== tag))}
          />
        </Box>
      )}

      <SearchRangeChips range={range} onChange={handleRangeChange} />

      {hasTags && selected.length === 0 && (
        <Typography color="text.secondary" sx={{ mt: 4, textAlign: 'center' }}>
          Pick one or more tags to see their expenses and total. An expense must have all the
          selected tags.
        </Typography>
      )}

      {selected.length > 0 && results.length === 0 && (
        <Box sx={{ mt: 4, textAlign: 'center' }} data-testid="tag-no-results">
          <Typography>No expenses have all of these tags</Typography>
          <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 2 }}>
            <Button variant="outlined" size="small" onClick={() => changeSelected([])}>
              Clear tags
            </Button>
            {range !== 'all' && (
              <Button variant="outlined" size="small" onClick={() => handleRangeChange('all')}>
                All time
              </Button>
            )}
          </Stack>
        </Box>
      )}

      {selected.length > 0 && results.length > 0 && (
        <SearchResultsTable
          results={results}
          visibleCount={visibleCount}
          onShowMore={() => setVisibleCount((c) => c + SEARCH_PAGE_SIZE)}
          footer={
            <Box
              data-testid="tag-total"
              sx={{
                position: 'sticky',
                bottom: 0,
                mt: 1,
                px: 2,
                py: 1.5,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                bgcolor: 'background.paper',
                borderTop: 1,
                borderColor: 'divider',
                boxShadow: '0 -2px 4px rgba(0, 0, 0, 0.08)',
              }}
            >
              <Typography sx={{ fontWeight: 'bold' }}>
                Total ({results.length} {results.length === 1 ? 'expense' : 'expenses'})
              </Typography>
              <Typography sx={{ fontWeight: 'bold' }}>{total.toFixed(2)}</Typography>
            </Box>
          }
        />
      )}
    </Box>
  );
}
