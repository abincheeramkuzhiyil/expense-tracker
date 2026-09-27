'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  Stack,
  TextField,
  Typography,
  Alert,
  Link as MuiLink,
} from '@mui/material';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';

interface PasteSmsPanelProps {
  /** Called with the trimmed SMS text once the user pastes it (via clipboard or manual entry). */
  onText: (text: string) => void;
  /** Called when the user chooses to skip the SMS and enter the expense manually. */
  onSkip: () => void;
}

/**
 * Entry point for the "Add from clipboard" flow. Android Chrome blocks silent
 * clipboard reads, so the user must tap once to grant the gesture. If the read
 * is denied or empty, a manual paste box is revealed as a fallback.
 */
export default function PasteSmsPanel({ onText, onSkip }: PasteSmsPanelProps) {
  const [error, setError] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [manualText, setManualText] = useState('');

  async function handlePaste() {
    if (!navigator.clipboard?.readText) {
      setError('Clipboard access isn’t available here. Paste the SMS manually below.');
      setShowManual(true);
      return;
    }
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        setError('Clipboard is empty. Copy the SMS first, or paste it manually below.');
        setShowManual(true);
        return;
      }
      setError(null);
      onText(text.trim());
    } catch {
      setError('Couldn’t read the clipboard. Paste the SMS manually below.');
      setShowManual(true);
    }
  }

  function handleManualFill() {
    const text = manualText.trim();
    if (!text) return;
    setError(null);
    onText(text);
  }

  return (
    <Box sx={{ p: 2, mb: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
        Add from a copied SMS
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Copy the bank SMS, then tap the button below to auto-fill the expense.
      </Typography>

      <Stack spacing={1.5} direction={{ xs: 'column', sm: 'row' }}>
        <Button
          variant="contained"
          startIcon={<ContentPasteIcon />}
          onClick={handlePaste}
        >
          Paste SMS &amp; auto-fill
        </Button>
        {!showManual && (
          <Button variant="text" onClick={() => setShowManual(true)}>
            Paste manually instead
          </Button>
        )}
      </Stack>

      {error && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {showManual && (
        <Stack spacing={1.5} sx={{ mt: 2 }}>
          <TextField
            label="Paste SMS text"
            placeholder="Paste the bank SMS here…"
            multiline
            minRows={3}
            fullWidth
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
          />
          <Box>
            <Button
              variant="contained"
              onClick={handleManualFill}
              disabled={!manualText.trim()}
            >
              Fill from text
            </Button>
          </Box>
        </Stack>
      )}

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
        Prefer to type it in?{' '}
        <MuiLink component="button" type="button" onClick={onSkip}>
          Enter manually →
        </MuiLink>
      </Typography>
    </Box>
  );
}
