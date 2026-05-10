'use client';

import {
  Alert,
  Box,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  Paper,
  Typography,
} from '@mui/material';
import { ImportSummary } from '@/types/importData.types';

interface ImportResultsSummaryProps {
  summary: ImportSummary;
}

export default function ImportResultsSummary({ summary }: ImportResultsSummaryProps) {
  const allSucceeded = summary.totalFailed === 0 && summary.results.every((r) => r.status !== 'error');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Alert severity={allSucceeded ? 'success' : 'warning'}>
        {allSucceeded
          ? `Import complete — ${summary.totalImported} record${summary.totalImported !== 1 ? 's' : ''} imported successfully.`
          : `Import finished with issues — ${summary.totalImported} imported, ${summary.totalFailed} failed.`}
      </Alert>

      <Paper variant="outlined">
        <List disablePadding>
          {summary.results.map((result, idx) => (
            <Box key={result.key}>
              {idx > 0 && <Divider component="li" />}
              <ListItem alignItems="flex-start" sx={{ pr: 14 }}>
                <ListItemText
                  primary={
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 'medium' }}>
                      {result.key}
                    </Typography>
                  }
                  secondary={
                    <Box component="span" sx={{ display: 'block', mt: 0.3 }}>
                      {result.status === 'error' ? (
                        <Typography variant="caption" color="error">
                          {result.message ?? 'An unexpected error occurred.'}
                        </Typography>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          {result.recordsImported} imported
                          {result.recordsFailed > 0 ? `, ${result.recordsFailed} skipped (duplicate)` : ''}
                        </Typography>
                      )}
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <Chip
                    label={result.status}
                    size="small"
                    color={
                      result.status === 'success'
                        ? 'success'
                        : result.status === 'error'
                        ? 'error'
                        : 'default'
                    }
                    variant="outlined"
                  />
                </ListItemSecondaryAction>
              </ListItem>
            </Box>
          ))}
        </List>

        <Divider />
        <Box sx={{ px: 2, py: 1.5, bgcolor: 'action.hover' }}>
          <Typography variant="body2" color="text.secondary">
            <strong>{summary.totalImported}</strong> total record
            {summary.totalImported !== 1 ? 's' : ''} imported across{' '}
            <strong>{summary.results.filter((r) => r.status === 'success').length}</strong> key
            {summary.results.filter((r) => r.status === 'success').length !== 1 ? 's' : ''}
            {summary.totalFailed > 0 && (
              <>
                {' · '}
                <Box component="span" sx={{ color: 'warning.main' }}>
                  {summary.totalFailed} record{summary.totalFailed !== 1 ? 's' : ''} failed
                </Box>
              </>
            )}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
