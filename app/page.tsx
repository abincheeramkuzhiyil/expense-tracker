'use client';

import Link from 'next/link';
import { Box, Button, Container, Typography } from '@mui/material';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';

export default function Home() {
  return (
    <Container maxWidth="lg">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minHeight: 'calc(100vh - 64px)',
          textAlign: 'center',
          pb: 4,
        }}
      >
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography variant="h3" component="h1" gutterBottom>
            Hello User!
          </Typography>
          <Typography variant="h5" color="text.secondary">
            Have a great session :)
          </Typography>
        </Box>

        <Button
          component={Link}
          href="/expenses/add?view=day&source=clipboard"
          variant="contained"
          size="large"
          startIcon={<ContentPasteIcon />}
          sx={{
            position: 'fixed',
            left: '50%',
            transform: 'translateX(-50%)',
            bottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)',
            width: 'calc(100% - 32px)',
            maxWidth: 420,
            zIndex: (theme) => theme.zIndex.appBar,
          }}
        >
          Add from copied SMS
        </Button>
      </Box>
    </Container>
  );
}

