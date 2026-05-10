'use client';

import { Box, Chip, Paper, Stack, Typography } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { VALID_FIXED_KEYS } from '@/utils/importValidation';

const KEY_DESCRIPTIONS: Record<string, string> = {
  expenseCategories: 'Array of category name strings (e.g. ["Food", "Travel"])',
  expensesPending: 'Array of pending expense objects awaiting review',
  expenseYearIndex: 'Array of year strings that have expense data (e.g. ["2025", "2026"])',
  appSettings: 'Object containing SMS parser rules and notification settings',
  userPreferences: 'Object containing UI preferences (e.g. bottom sheet mode)',
  spentOnCategoryMapping: 'Object mapping spent-on values to categories (e.g. {"lunch": "Food"})',
};

const EXAMPLE_JSON = `{
  "expenseCategories": ["Food", "Travel", "Bills"],
  "expenseYearIndex": ["2025", "2026"],
  "2025": {
    "1": [
      {
        "id": "abc-123",
        "amount": 250,
        "spentOn": "Lunch",
        "category": "Food",
        "date": "2025-01-15",
        "description": "Team lunch",
        "source": "manual",
        "createdAt": "2025-01-15T12:00:00.000Z",
        "updatedAt": "2025-01-15T12:00:00.000Z"
      }
    ]
  },
  "appSettings": {
    "parserRules": [],
    "notificationEnabled": false,
    "notificationTime": "21:00"
  }
}`;

export default function ImportHowItWorks() {
  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
        <InfoOutlinedIcon color="primary" fontSize="small" />
        <Typography variant="h6" component="h2">
          How Import Works
        </Typography>
      </Stack>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Upload a <strong>.json</strong> file whose top-level keys correspond to valid
        localStorage keys used by this app. The file is validated before any data is written.
        Existing data is <strong>merged</strong> — imported records are added alongside what
        you already have, with duplicates (matched by ID) skipped automatically. Object-type
        keys (e.g. <code>appSettings</code>) are fully replaced by the imported value.
      </Typography>

      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Valid fixed keys
      </Typography>
      <Stack spacing={1} sx={{ mb: 2 }}>
        {VALID_FIXED_KEYS.map((key) => (
          <Box key={key} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
            <Chip label={key} size="small" variant="outlined" sx={{ fontFamily: 'monospace', flexShrink: 0 }} />
            <Typography variant="body2" color="text.secondary" sx={{ pt: 0.3 }}>
              {KEY_DESCRIPTIONS[key]}
            </Typography>
          </Box>
        ))}
      </Stack>

      <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
        Dynamic year keys
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Expense data is stored under 4-digit year keys (e.g. <code>"2025"</code>,{' '}
        <code>"2026"</code>). Each year key maps month numbers to arrays of expense objects.
        These are also valid and importable.
      </Typography>

      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Example JSON structure
      </Typography>
      <Box
        component="pre"
        sx={{
          bgcolor: 'action.hover',
          borderRadius: 1,
          p: 2,
          overflowX: 'auto',
          fontSize: '0.75rem',
          fontFamily: 'monospace',
          m: 0,
          lineHeight: 1.6,
        }}
      >
        {EXAMPLE_JSON}
      </Box>
    </Paper>
  );
}
