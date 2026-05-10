'use client';

import { Alert, Box, List, ListItem, ListItemText, Typography } from '@mui/material';

interface ShapeError {
  key: string;
  message: string;
}

interface ImportValidationErrorsProps {
  parseError: string | null;
  keyErrors: string[];
  shapeErrors: ShapeError[];
}

export default function ImportValidationErrors({
  parseError,
  keyErrors,
  shapeErrors,
}: ImportValidationErrorsProps) {
  const hasErrors = parseError || keyErrors.length > 0 || shapeErrors.length > 0;
  if (!hasErrors) return null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {parseError && (
        <Alert severity="error">
          <Typography variant="body2" fontWeight="medium" gutterBottom>
            File parse error
          </Typography>
          {parseError}
        </Alert>
      )}

      {keyErrors.length > 0 && (
        <Alert severity="error">
          <Typography variant="body2" fontWeight="medium" gutterBottom>
            Invalid key{keyErrors.length > 1 ? 's' : ''} found
          </Typography>
          <List dense disablePadding sx={{ mb: 1 }}>
            {keyErrors.map((key) => (
              <ListItem key={key} disablePadding sx={{ pl: 1 }}>
                <ListItemText
                  primary={
                    <Typography variant="body2" component="span" sx={{ fontFamily: 'monospace' }}>
                      &ldquo;{key}&rdquo;
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
          <Typography variant="body2">
            Please remove or correct these keys and try again.
          </Typography>
        </Alert>
      )}

      {shapeErrors.length > 0 && (
        <Alert severity="error">
          <Typography variant="body2" fontWeight="medium" gutterBottom>
            Data shape error{shapeErrors.length > 1 ? 's' : ''}
          </Typography>
          <List dense disablePadding sx={{ mb: 1 }}>
            {shapeErrors.map(({ key, message }) => (
              <ListItem key={key} disablePadding sx={{ pl: 1 }}>
                <ListItemText
                  primary={
                    <Typography variant="body2" component="span">
                      <Box component="span" sx={{ fontFamily: 'monospace', fontWeight: 'medium' }}>
                        {key}
                      </Box>
                      {': '}
                      {message}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
          <Typography variant="body2">
            Please correct the data for these keys and try again.
          </Typography>
        </Alert>
      )}
    </Box>
  );
}
