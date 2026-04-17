'use client';

import { Box, Container, Typography, Button } from '@mui/material';
import WifiOffIcon from '@mui/icons-material/WifiOff';

export default function OfflinePage() {
  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
          gap: 3,
          textAlign: 'center',
        }}
      >
        <WifiOffIcon sx={{ fontSize: 72, color: 'text.secondary' }} />
        <Typography variant="h5" fontWeight={600}>
          You&apos;re offline
        </Typography>
        <Typography variant="body1" color="text.secondary">
          No internet connection. Your saved expenses are still available — reconnect to sync.
        </Typography>
        <Button
          variant="contained"
          onClick={() => window.location.reload()}
        >
          Try again
        </Button>
      </Box>
    </Container>
  );
}
