import type { Metadata, Viewport } from 'next';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from '@/theme/theme';
import Navigation from '@/components/layout/Navigation';
import InstallPrompt from '@/components/layout/InstallPrompt';
import MigrationProvider from '@/components/layout/MigrationProvider';
import NotificationSchedulerProvider from '@/components/layout/NotificationSchedulerProvider';

export const metadata: Metadata = {
  title: 'Expense Tracker',
  description: 'Track and manage your expenses efficiently',
  manifest: '/expense-tracker/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Expense Tracker',
  },
  other: {
    'msapplication-TileColor': '#1976d2',
    'msapplication-TileImage': '/expense-tracker/icon-maskable-192x192.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#1976d2',
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" sizes="32x32" href="/expense-tracker/favicon-32x32.png" />
        <link rel="icon" href="/expense-tracker/favicon.ico" />
        <link rel="apple-touch-icon" sizes="192x192" href="/expense-tracker/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/expense-tracker/icon-512x512.png" />
      </head>
      <body style={{ backgroundColor: '#fff' }}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Navigation />
          {children}
          <InstallPrompt />
          <MigrationProvider />
          <NotificationSchedulerProvider />
        </ThemeProvider>
      </body>
    </html>
  );
}
