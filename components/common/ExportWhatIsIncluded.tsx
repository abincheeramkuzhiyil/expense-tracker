'use client';

import { Box, Chip, Paper, Stack, Typography } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { VALID_FIXED_KEYS } from '@/utils/importValidation';

const KEY_DESCRIPTIONS: Record<string, string> = {
  expenseCategories: 'Array of your custom category names (e.g. ["Food", "Travel"])',
  expensesPending: 'Pending expenses awaiting your review',
  expenseYearIndex: 'Index of years that have expense data (e.g. ["2025", "2026"])',
  appSettings: 'SMS parser rules (user-defined) and notification settings',
  userPreferences: 'UI preferences such as bottom sheet mode',
  spentOnCategoryMapping: 'Your learned merchant-to-category mappings (e.g. {"lunch": "Food"})',
};

export default function ExportWhatIsIncluded() {
  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
        <InfoOutlinedIcon color="primary" fontSize="small" />
        <Typography variant="h6" component="h2">
          What Gets Exported
        </Typography>
      </Stack>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        The export captures a <strong>complete snapshot</strong> of everything stored in this
        app&apos;s local storage. The resulting <strong>.json</strong> file is directly compatible
        with the <strong>Import Data</strong> page, making it easy to back up your data, move it to
        another device, or restore it after a reinstall. Only keys that actually contain data are
        included — empty slots are omitted.
      </Typography>

      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Included data keys
      </Typography>
      <Stack spacing={1} sx={{ mb: 2 }}>
        {VALID_FIXED_KEYS.map((key) => (
          <Box key={key} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
            <Chip
              label={key}
              size="small"
              variant="outlined"
              sx={{ fontFamily: 'monospace', flexShrink: 0 }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ pt: 0.3 }}>
              {KEY_DESCRIPTIONS[key]}
            </Typography>
          </Box>
        ))}
      </Stack>

      <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
        Year expense data
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Expense records are exported under 4-digit year keys (e.g. <code>&quot;2025&quot;</code>,{' '}
        <code>&quot;2026&quot;</code>). Each year contains month-grouped arrays of expense objects.
        Only years that actually have data are included.
      </Typography>
    </Paper>
  );
}
