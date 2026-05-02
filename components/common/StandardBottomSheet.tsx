'use client';

import { forwardRef } from 'react';
import {
  AppBar,
  Box,
  Dialog,
  IconButton,
  Slide,
  Stack,
  SwipeableDrawer,
  Toolbar,
  Typography,
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import CloseIcon from '@mui/icons-material/Close';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import { useUserPreferences } from '@/hooks/useUserPreferences';

const SlideUpTransition = forwardRef(function SlideUpTransition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

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
 * - Default (minimized) mode: SwipeableDrawer anchored bottom, 85vh, rounded top corners.
 * - Maximized mode: fullscreen Dialog with slide-up transition.
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
  const isMaximized = preferences.dialogDisplayMode === 'fullscreen';

  function handleToggleMaximize() {
    const newMode = isMaximized ? 'sheet' : 'fullscreen';
    updatePreference('dialogDisplayMode', newMode);
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

  if (isMaximized) {
    return (
      <Dialog fullScreen open={open} onClose={onClose} TransitionComponent={SlideUpTransition}>
        <AppBar sx={{ position: 'fixed', bgcolor: 'primary.main' }}>
          <Toolbar>{headerContent}</Toolbar>
        </AppBar>
        {/* Spacer to push content below the fixed AppBar */}
        <Toolbar />
        <Box sx={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {children}
        </Box>
      </Dialog>
    );
  }

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      onOpen={() => {}}
      disableSwipeToOpen
      PaperProps={{
        sx: {
          height: '85vh',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {/* Header — drag handle pill sits at the top of the primary-colour zone,
          eliminating the plain white gap between rounded corners and the header. */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          px: 2,
          pt: 1,
          pb: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        {/* Drag handle pill — semi-transparent white reads against the primary colour */}
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
