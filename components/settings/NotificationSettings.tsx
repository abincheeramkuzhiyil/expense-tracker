'use client';

import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  CardContent,
  FormControlLabel,
  Skeleton,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useSettings } from '@/hooks/useSettings';
import { sendTestNotification } from '@/utils/notificationScheduler';

type PermissionState = NotificationPermission | 'unsupported';

export default function NotificationSettings() {
  const { settings, updateSettings, isLoaded } = useSettings();
  const [permission, setPermission] = useState<PermissionState>('default');
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (typeof Notification === 'undefined') {
      setPermission('unsupported');
      return;
    }
    setPermission(Notification.permission);
  }, []);

  async function requestPermission() {
    if (typeof Notification === 'undefined') return;
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === 'granted') {
      setSnackbar({ open: true, message: 'Notifications enabled' });
    }
  }

  function handleEnableToggle(enabled: boolean) {
    updateSettings((prev) => ({ ...prev, notificationEnabled: enabled }));
    setSnackbar({ open: true, message: 'Saved' });
  }

  function handleTimeChange(time: string) {
    updateSettings((prev) => ({ ...prev, notificationTime: time }));
  }

  function handleTestNotification() {
    const ok = sendTestNotification();
    if (!ok) {
      setSnackbar({ open: true, message: 'Permission required to send notifications' });
    }
  }

  if (!isLoaded) {
    return (
      <Stack spacing={2}>
        <Skeleton variant="rounded" height={120} />
        <Skeleton variant="rounded" height={220} />
      </Stack>
    );
  }

  return (
    <>
      <Stack spacing={3}>
        {/* Permission card */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Permission
            </Typography>
            <PermissionStatus permission={permission} />
            {permission === 'default' && (
              <Button
                variant="contained"
                sx={{ mt: 2 }}
                onClick={requestPermission}
              >
                Enable Notifications
              </Button>
            )}
            {permission === 'denied' && (
              <Alert severity="warning" sx={{ mt: 2 }} icon={<HelpOutlineIcon />}>
                Notifications are blocked. Enable them in your browser&apos;s site
                settings to receive reminders.
              </Alert>
            )}
            {permission === 'unsupported' && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Your browser doesn&apos;t support notifications.
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Schedule card */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Daily Review Reminder
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.notificationEnabled}
                  onChange={(e) => handleEnableToggle(e.target.checked)}
                  inputProps={{ 'aria-label': 'Enable daily review reminder' }}
                />
              }
              label="Enable reminder"
            />

            <TextField
              type="time"
              label="Reminder time"
              value={settings.notificationTime}
              onChange={(e) => handleTimeChange(e.target.value)}
              disabled={!settings.notificationEnabled}
              fullWidth
              sx={{ mt: 2 }}
              InputLabelProps={{ shrink: true }}
              inputProps={{ step: 60, 'aria-label': 'Reminder time' }}
            />

            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              {settings.notificationEnabled
                ? `You'll be reminded daily at ${formatTime(settings.notificationTime)} about pending expenses.`
                : 'Reminder is currently off.'}
            </Typography>

            <Button
              variant="outlined"
              sx={{ mt: 2 }}
              disabled={permission !== 'granted'}
              onClick={handleTestNotification}
            >
              Send test notification
            </Button>
          </CardContent>
        </Card>
      </Stack>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={2000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </>
  );
}

function PermissionStatus({ permission }: { permission: PermissionState }) {
  if (permission === 'granted') {
    return (
      <Stack direction="row" alignItems="center" spacing={1}>
        <CheckCircleIcon color="success" />
        <Typography>Notifications enabled</Typography>
      </Stack>
    );
  }
  if (permission === 'denied') {
    return (
      <Stack direction="row" alignItems="center" spacing={1}>
        <CancelIcon color="error" />
        <Typography>Notifications blocked</Typography>
      </Stack>
    );
  }
  if (permission === 'default') {
    return (
      <Stack direction="row" alignItems="center" spacing={1}>
        <HelpOutlineIcon color="warning" />
        <Typography>Permission not requested yet</Typography>
      </Stack>
    );
  }
  return (
    <Typography color="text.secondary">Notifications not supported</Typography>
  );
}

function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}
