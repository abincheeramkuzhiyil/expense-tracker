'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Slide,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import GetAppIcon from '@mui/icons-material/GetApp';

const DISMISSED_KEY = 'pwaInstallDismissed';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Don't show if user already dismissed
    if (localStorage.getItem(DISMISSED_KEY)) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Hide banner once the app is installed
  useEffect(() => {
    const handler = () => setVisible(false);
    window.addEventListener('appinstalled', handler);
    return () => window.removeEventListener('appinstalled', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, '1');
    setVisible(false);
  };

  return (
    <Slide direction="up" in={visible} mountOnEnter unmountOnExit>
      <Paper
        elevation={8}
        sx={{
          position: 'fixed',
          bottom: 80, // above the FAB (FAB is at bottom: 16 + ~56px height)
          left: 16,
          right: 16,
          zIndex: 1300,
          p: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          borderRadius: 3,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
        }}
      >
        <GetAppIcon />
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" fontWeight={600} lineHeight={1.3}>
            Install Expense Tracker
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.85 }}>
            Add to home screen for quick access
          </Typography>
        </Box>
        <Button
          size="small"
          variant="contained"
          onClick={handleInstall}
          sx={{
            bgcolor: 'white',
            color: 'primary.main',
            fontWeight: 700,
            '&:hover': { bgcolor: 'grey.100' },
            whiteSpace: 'nowrap',
          }}
        >
          Install
        </Button>
        <IconButton
          size="small"
          onClick={handleDismiss}
          aria-label="Dismiss install prompt"
          sx={{ color: 'primary.contrastText', ml: -0.5 }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Paper>
    </Slide>
  );
}
