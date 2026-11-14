'use client';

import { useState } from 'react';
import {
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
  Typography,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import DayDetailModal from './DayDetailModal';
import type { StoredExpense } from '@/types/expense.types';
import { SearchRange, dateKeyToDate, formatResultDate, formatTagCaption } from '@/utils/expenseSearch';

export const SEARCH_PAGE_SIZE = 50;

const RANGES: { value: SearchRange; label: string }[] = [
  { value: 'all', label: 'All time' },
  { value: '12m', label: 'Last 12 months' },
  { value: '3m', label: 'Last 3 months' },
];

interface SearchRangeChipsProps {
  range: SearchRange;
  onChange: (range: SearchRange) => void;
}

/** Date-range chips shared by the Keyword and Tags search tabs. */
export function SearchRangeChips({ range, onChange }: SearchRangeChipsProps) {
  return (
    <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap', rowGap: 1 }}>
      {RANGES.map((r) => (
        <Chip
          key={r.value}
          label={r.label}
          clickable
          color={range === r.value ? 'primary' : 'default'}
          variant={range === r.value ? 'filled' : 'outlined'}
          aria-pressed={range === r.value}
          onClick={() => onChange(r.value)}
        />
      ))}
    </Stack>
  );
}

interface SearchResultsTableProps {
  results: StoredExpense[];
  visibleCount: number;
  onShowMore: () => void;
  /** Rendered as the last row inside the results box; used for the fixed Total row. */
  footer?: React.ReactNode;
}

/** Results table with "Show more" paging and day drill-down, shared by the Keyword and Tags search tabs. */
export default function SearchResultsTable({
  results,
  visibleCount,
  onShowMore,
  footer,
}: SearchResultsTableProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const visible = results.slice(0, visibleCount);

  return (
    <>
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
                      {e.tags && e.tags.length > 0 && (
                        <Box
                          data-testid="search-row-tags"
                          sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'primary.main' }}
                        >
                          <LocalOfferOutlinedIcon sx={{ fontSize: 13, flexShrink: 0 }} />
                          <Typography variant="caption" noWrap sx={{ minWidth: 0 }}>
                            {formatTagCaption(e.tags)}
                          </Typography>
                        </Box>
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
            <Button onClick={onShowMore}>
              Show more ({visible.length} of {results.length})
            </Button>
          </Box>
        )}
        {footer}
      </Box>

      {selectedDate && (
        <DayDetailModal open date={selectedDate} onClose={() => setSelectedDate(null)} />
      )}
    </>
  );
}
