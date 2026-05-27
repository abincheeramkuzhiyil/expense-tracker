'use client';

import { useState } from 'react';
import {
  Alert,
  AppBar,
  Box,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useRouter } from 'next/navigation';

import ExportWhatIsIncluded from '@/components/common/ExportWhatIsIncluded';
import { exportToFile } from '@/utils/exportStorage';
import { ExportSummary } from '@/types/exportData.types';

export default function ExportDataPage() {
  const router = useRouter();

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportSummary, setExportSummary] = useState<ExportSummary | null>(null);

  function handleExportClick() {
    setConfirmDialogOpen(true);
  }

  function handleConfirmExport() {
    setConfirmDialogOpen(false);
    setExporting(true);
    try {
      const summary = exportToFile();
      setExportSummary(summary);
    } finally {
      setExporting(false);
    }
  }

  return (
    <Box>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => router.back()}
            aria-label="Back"
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" component="h1">
            Export Data
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ py: 3 }}>
        <Stack spacing={3}>
          {/* What gets exported write-up */}
          <ExportWhatIsIncluded />

          <Divider />

          {/* Export button */}
          <Box>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              startIcon={
                exporting ? <CircularProgress size={18} color="inherit" /> : <FileDownloadIcon />
              }
              disabled={exporting}
              onClick={handleExportClick}
            >
              {exporting ? 'Exporting…' : 'Export'}
            </Button>
          </Box>

          {/* Success summary */}
          {exportSummary && (
            <Stack spacing={2}>
              <Alert severity="success">
                Export complete — file <strong>{exportSummary.fileName}</strong> has been
                downloaded.
              </Alert>
              <Paper variant="outlined" sx={{ px: 2, py: 1.5 }}>
                <Stack spacing={0.5}>
                  <Typography variant="body2">
                    <strong>Keys exported:</strong> {exportSummary.keyCount}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Total expense records:</strong> {exportSummary.totalExpenses}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Exported at:</strong> {exportSummary.exportedAt.toLocaleString()}
                  </Typography>
                </Stack>
              </Paper>
            </Stack>
          )}
        </Stack>
      </Container>

      {/* Financial data confirmation dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        aria-labelledby="confirm-export-dialog-title"
      >
        <DialogTitle
          id="confirm-export-dialog-title"
          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <LockOutlinedIcon color="primary" />
          Export financial data?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            The exported file will contain <strong>all your expenses, categories, settings, and
            preferences</strong>. This is sensitive financial information.
          </DialogContentText>
          <Box component="ul" sx={{ mt: 1, mb: 1, pl: 3 }}>
            <li>
              <Typography variant="body2">Store the file in a secure location</Typography>
            </li>
            <li>
              <Typography variant="body2">
                Do not share it with untrusted parties
              </Typography>
            </li>
            <li>
              <Typography variant="body2">Delete old exports when no longer needed</Typography>
            </li>
          </Box>
          <DialogContentText>
            By proceeding, you confirm you will handle the exported data responsibly.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)} variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleConfirmExport} color="primary" variant="contained">
            Yes, export
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
