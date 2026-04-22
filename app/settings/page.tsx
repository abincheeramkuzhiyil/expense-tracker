'use client';

import { useMemo } from 'react';
import {
  AppBar,
  Avatar,
  Box,
  Container,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Paper,
  Skeleton,
  Toolbar,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PaletteIcon from '@mui/icons-material/Palette';
import SmsIcon from '@mui/icons-material/Sms';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useRouter } from 'next/navigation';
import { useSettings } from '@/hooks/useSettings';

interface SettingsItem {
  key: string;
  title: string;
  /** Live-computed summary shown as the secondary text. */
  summary: string;
  icon: React.ReactNode;
  /** Background colour for the leading avatar. */
  avatarColor: string;
  href: string;
}

interface SettingsSection {
  label: string;
  items: SettingsItem[];
}

export default function SettingsPage() {
  const router = useRouter();
  const { settings, isLoaded } = useSettings();

  const sections: SettingsSection[] = useMemo(() => {
    const userRuleCount = settings.parserRules.filter((r) => !r.builtIn).length;
    const totalRuleCount = settings.parserRules.length;
    const ruleSummary =
      userRuleCount === 0
        ? `${totalRuleCount} built-in rules`
        : `${totalRuleCount} rules (${userRuleCount} custom)`;

    const notificationSummary = settings.notificationEnabled
      ? `Daily at ${formatTime(settings.notificationTime)}`
      : 'Off';

    return [
      {
        label: 'View Preferences',
        items: [
          {
            key: 'theme',
            title: 'Theme',
            summary: 'Coming soon',
            icon: <PaletteIcon />,
            avatarColor: '#9c27b0',
            href: '/settings/theme',
          },
        ],
      },
      {
        label: 'PWA Preferences',
        items: [
          {
            key: 'sms-parser',
            title: 'SMS Parser',
            summary: ruleSummary,
            icon: <SmsIcon />,
            avatarColor: '#1976d2',
            href: '/settings/sms-parser',
          },
          {
            key: 'notifications',
            title: 'Notifications',
            summary: notificationSummary,
            icon: <NotificationsIcon />,
            avatarColor: '#ed6c02',
            href: '/settings/notifications',
          },
        ],
      },
    ];
  }, [settings]);

  function handleBack() {
    router.back();
  }

  return (
    <Box>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={handleBack}
            aria-label="Back"
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" component="h1">
            Settings
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ py: 3 }}>
        {sections.map((section, idx) => (
          <Box key={section.label} sx={{ mb: idx === sections.length - 1 ? 0 : 3 }}>
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ pl: 2, display: 'block', mb: 1 }}
            >
              {section.label}
            </Typography>
            <Paper variant="outlined">
              <List disablePadding>
                {section.items.map((item, itemIdx) => (
                  <Box key={item.key}>
                    {itemIdx > 0 && <Divider component="li" />}
                    <ListItem disablePadding>
                      <ListItemButton
                        onClick={() => router.push(item.href)}
                        aria-label={`Open ${item.title} settings`}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: item.avatarColor }}>{item.icon}</Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={item.title}
                          secondary={
                            isLoaded ? (
                              item.summary
                            ) : (
                              <Skeleton variant="text" width={120} />
                            )
                          }
                        />
                        <ChevronRightIcon color="action" />
                      </ListItemButton>
                    </ListItem>
                  </Box>
                ))}
              </List>
            </Paper>
          </Box>
        ))}
      </Container>
    </Box>
  );
}

/** Converts "HH:mm" 24-hour to a friendly 12-hour string. */
function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}
