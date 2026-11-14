'use client';

import { Box, Typography } from '@mui/material';

interface SearchTotalRowProps {
  count: number;
  total: number;
}

/** Fixed bottom row, like the Day view footer: "Total (N expenses)" and the amount over all matches. */
export default function SearchTotalRow({ count, total }: SearchTotalRowProps) {
  return (
    <Box
      data-testid="search-total"
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
        Total ({count} {count === 1 ? 'expense' : 'expenses'})
      </Typography>
      <Typography sx={{ fontWeight: 'bold' }}>{total.toFixed(2)}</Typography>
    </Box>
  );
}
