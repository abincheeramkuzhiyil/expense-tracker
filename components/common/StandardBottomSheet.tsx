'use client';

import {
  Box,
  IconButton,
  Stack,
  SwipeableDrawer,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import { useUserPreferences } from '@/hooks/useUserPreferences';

export interface StandardBottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Unified bottom-sheet wrapper used by all major content dialogs.
 *
 * - Sheet mode: SwipeableDrawer anchored bottom, 85vh, rounded top corners.
 * - Maximized mode: SwipeableDrawer expanded to 100dvh, square top corners.
 * - Swipe down → closes the drawer in both modes.
 * - The maximized/minimized state is a global user preference persisted in localStorage
 *   so the user's choice is remembered across sessions.
 */
export default function StandardBottomSheet({
  open,
  onClose,
  title,
  icon,
  children,
}: StandardBottomSheetProps) {
  const { preferences, updatePreference } = useUserPreferences();
  const isMaximized = preferences.bottomSheetMode === 'maximized';

  function handleToggleMaximize() {
    const newMode = isMaximized ? 'minimized' : 'maximized';
    updatePreference('bottomSheetMode', newMode);
  }

  const headerContent = (
    <Stack
      direction="row"
      alignItems="center"
      sx={{ width: '100%', color: 'primary.contrastText' }}
    >
      {/* Icon + title */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', fontSize: 20 }}>{icon}</Box>
        <Typography variant="h6">{title}</Typography>
      </Stack>

      {/* Actions */}
      <IconButton
        color="inherit"
        size="medium"
        onClick={handleToggleMaximize}
        aria-label={isMaximized ? 'Minimize' : 'Maximize'}
      >
        {isMaximized ? (
          <CloseFullscreenIcon fontSize="medium" />
        ) : (
          <OpenInFullIcon fontSize="medium" />
        )}
      </IconButton>
      <IconButton color="inherit" size="medium" onClick={onClose} aria-label="Close">
        <CloseIcon fontSize="medium" />
      </IconButton>
    </Stack>
  );

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      onOpen={() => {}}
      disableSwipeToOpen
      PaperProps={{
        sx: {
          height: isMaximized ? '100dvh' : '85vh',
          borderTopLeftRadius: isMaximized ? 0 : 16,
          borderTopRightRadius: isMaximized ? 0 : 16,
          display: 'flex',
          flexDirection: 'column',
          transition: 'height 0.3s cubic-bezier(0.4, 0, 0.2, 1), border-radius 0.2s ease',
        },
      }}
    >
      {/* Header — drag handle pill sits at the top of the primary-colour zone,
          eliminating the plain white gap between rounded corners and the header. */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          borderTopLeftRadius: isMaximized ? 0 : 16,
          borderTopRightRadius: isMaximized ? 0 : 16,
          px: 2,
          pt: 1,
          pb: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          transition: 'border-radius 0.2s ease',
        }}
      >
        {/* Drag handle pill — always visible as swipe affordance in both modes */}
        <Box
          sx={{
            width: 40,
            height: 4,
            bgcolor: 'rgba(255, 255, 255, 0.35)',
            borderRadius: 2,
          }}
        />
        {headerContent}
      </Box>

      {/* Content */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>{children}</Box>
    </SwipeableDrawer>
  );
}
