'use client';

import { useMemo, useState } from 'react';
import {
  Autocomplete,
  Box,
  Button,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CategoryIcon from '@mui/icons-material/Category';
import TagPills from './TagPills';
import SearchResultsTable, { SEARCH_PAGE_SIZE, SearchRangeChips } from './SearchResultsTable';
import SearchTotalRow from './SearchTotalRow';
import FacetChips from './FacetChips';
import type { FacetChip } from './ChipPickerSheet';
import { useSearchableExpenses } from '@/hooks/useSearchableExpenses';
import { dismissKeyboardOnTouch } from '@/utils/dismissKeyboard';
import {
  CategoryFacet,
  SearchRange,
  TagSuggestion,
  buildCategoryFacets,
  buildTagIndex,
  filterByCategory,
  filterByTags,
  matchesKeyword,
  sumAmounts,
  suggestTags,
} from '@/utils/expenseSearch';

interface TagFilterPanelProps {
  open: boolean;
}

function formatChipAmount(amount: number): string {
  return amount.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

function categoryChip(facet: CategoryFacet): FacetChip {
  return { key: facet.label, label: facet.label, detail: formatChipAmount(facet.amount) };
}

/**
 * "Tags" tab of the Search sheet: pick one or more tags and list every expense that has ALL of them,
 * with a fixed Total row. Category chips and an optional keyword field narrow the result further.
 * Kept separate from the keyword search so the two never mix.
 */
export default function TagFilterPanel({ open }: TagFilterPanelProps) {
  const expenses = useSearchableExpenses(open);
  const index = useMemo(() => buildTagIndex(expenses), [expenses]);

  const [selected, setSelected] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [range, setRange] = useState<SearchRange>('all');
  const [visibleCount, setVisibleCount] = useState(SEARCH_PAGE_SIZE);
  const [categoryKeys, setCategoryKeys] = useState<string[]>([]);
  const [keywordOpen, setKeywordOpen] = useState(false);
  const [keyword, setKeyword] = useState('');

  const base = useMemo(() => filterByTags(expenses, selected, range), [expenses, selected, range]);
  const matched = useMemo(
    () => (keyword.trim() ? base.filter((e) => matchesKeyword(e, keyword)) : base),
    [base, keyword]
  );
  const categoryFacets = useMemo(() => buildCategoryFacets(matched), [matched]);
  const results = useMemo(
    () => filterByCategory(matched, categoryKeys[0] ?? null),
    [matched, categoryKeys]
  );
  const total = useMemo(() => sumAmounts(results), [results]);
  const hasTags = index.length > 0;
  const narrowing = categoryKeys.length > 0 || keyword.trim().length > 0;

  const selectedCategory = categoryKeys[0];
  const selectedFacet = categoryFacets.find((f) => f.label === selectedCategory);
  const categorySelectedChips: FacetChip[] = selectedCategory
    ? [
        selectedFacet
          ? categoryChip(selectedFacet)
          : { key: selectedCategory, label: selectedCategory, detail: '0' },
      ]
    : [];
  const categoryOptionChips = categoryFacets
    .filter((f) => f.label !== selectedCategory)
    .map(categoryChip);

  function changeSelected(next: string[]) {
    setSelected(next);
    setCategoryKeys([]);
    setVisibleCount(SEARCH_PAGE_SIZE);
  }

  function handleRangeChange(next: SearchRange) {
    setRange(next);
    setVisibleCount(SEARCH_PAGE_SIZE);
  }

  function handleCategoryChange(keys: string[]) {
    setCategoryKeys(keys.slice(-1));
    setVisibleCount(SEARCH_PAGE_SIZE);
  }

  function handleKeywordChange(value: string) {
    setKeyword(value);
    setVisibleCount(SEARCH_PAGE_SIZE);
  }

  function toggleKeyword() {
    if (keywordOpen) handleKeywordChange('');
    setKeywordOpen(!keywordOpen);
  }

  function clearNarrowing() {
    setCategoryKeys([]);
    setKeyword('');
    setKeywordOpen(false);
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

      {selected.length > 0 && base.length > 0 && (
        <>
          <FacetChips
            testId="category-facets"
            heading="Narrow by category"
            selected={categorySelectedChips}
            options={categoryOptionChips}
            multiple={false}
            sheetTitle="Narrow by category"
            sheetIcon={<CategoryIcon fontSize="small" sx={{ color: 'primary.contrastText' }} />}
            filterLabel="Filter categories"
            onChange={handleCategoryChange}
            trailing={
              <IconButton
                aria-label="Search within results"
                aria-expanded={keywordOpen}
                onClick={toggleKeyword}
                color={keywordOpen ? 'primary' : 'default'}
                sx={{ flexShrink: 0 }}
              >
                <SearchIcon />
              </IconButton>
            }
          />
          {keywordOpen && (
            <TextField
              variant="filled"
              fullWidth
              autoFocus
              label="Spent On or keyword (optional)"
              value={keyword}
              onChange={(e) => handleKeywordChange(e.target.value)}
              sx={{ mt: 1 }}
            />
          )}
        </>
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
          <Typography>
            {base.length === 0
              ? 'No expenses have all of these tags'
              : 'No expenses match these filters'}
          </Typography>
          <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 2 }}>
            {narrowing && (
              <Button variant="outlined" size="small" onClick={clearNarrowing}>
                Clear filters
              </Button>
            )}
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
          footer={<SearchTotalRow count={results.length} total={total} />}
        />
      )}
    </Box>
  );
}
