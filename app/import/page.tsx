'use client';

import { useRef, useState } from 'react';
import {
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
  FormControlLabel,
  IconButton,
  Stack,
  Switch,
  Toolbar,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useRouter } from 'next/navigation';

import ImportHowItWorks from '@/components/common/ImportHowItWorks';
import ImportFileInput from '@/components/common/ImportFileInput';
import ImportValidationErrors from '@/components/common/ImportValidationErrors';
import ImportResultsSummary from '@/components/common/ImportResultsSummary';
import { isValidImportKey, validateKeyShape } from '@/utils/importValidation';
import { importData } from '@/utils/importStorage';
import { ImportSummary } from '@/types/importData.types';

interface ShapeError {
  key: string;
  message: string;
}

export default function ImportDataPage() {
  const router = useRouter();

  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<Record<string, unknown> | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [keyErrors, setKeyErrors] = useState<string[]>([]);
  const [shapeErrors, setShapeErrors] = useState<ShapeError[]>([]);
  const [clearExisting, setClearExisting] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);

  const hasValidationErrors =
    parseError !== null || keyErrors.length > 0 || shapeErrors.length > 0;
  const canImport = parsedData !== null && !hasValidationErrors;

  function handleFileSelected(
    file: File,
    parsed: Record<string, unknown> | null,
    error: string | null
  ) {
    setSelectedFileName(file.name);
    setParsedData(null);
    setParseError(null);
    setKeyErrors([]);
    setShapeErrors([]);
    setImportSummary(null);

    if (error || !parsed) {
      setParseError(error);
      return;
    }

    // Key validation
    const invalidKeys = Object.keys(parsed).filter((k) => !isValidImportKey(k));
    if (invalidKeys.length > 0) {
      setKeyErrors(invalidKeys);
      return;
    }

    // Shape validation
    const shapes: ShapeError[] = [];
    for (const [key, value] of Object.entries(parsed)) {
      const msg = validateKeyShape(key, value);
      if (msg) shapes.push({ key, message: msg });
    }
    if (shapes.length > 0) {
      setShapeErrors(shapes);
      return;
    }

    setParsedData(parsed);
  }

  function handleImportClick() {
    if (!canImport) return;
    if (clearExisting) {
      setConfirmDialogOpen(true);
    } else {
      runImport();
    }
  }

  function handleConfirmImport() {
    setConfirmDialogOpen(false);
    runImport();
  }

  function runImport() {
    if (!parsedData) return;
    setImporting(true);
    try {
      const summary = importData(parsedData, clearExisting);
      setImportSummary(summary);
    } finally {
      setImporting(false);
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
            Import Data
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ py: 3 }}>
        <Stack spacing={3}>
          {/* How it works write-up */}
          <ImportHowItWorks />

          {/* File picker */}
          <Box>
            <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
              Select File
            </Typography>
            <ImportFileInput
              onFileSelected={handleFileSelected}
              selectedFileName={selectedFileName}
            />
          </Box>

          {/* Validation errors */}
          <ImportValidationErrors
            parseError={parseError}
            keyErrors={keyErrors}
            shapeErrors={shapeErrors}
          />

          {/* Clear existing data toggle */}
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={clearExisting}
                  onChange={(e) => setClearExisting(e.target.checked)}
                  color="warning"
                />
              }
              label={
                <Box>
                  <Typography variant="body2" fontWeight="medium">
                    Clear all existing data before import
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    If enabled, all current expenses, settings, and preferences will be permanently
                    deleted before the imported data is written. You will be asked to confirm.
                  </Typography>
                </Box>
              }
              sx={{ alignItems: 'flex-start', ml: 0 }}
            />
          </Box>

          <Divider />

          {/* Import button */}
          <Box>
            <Button
              variant="contained"
              size="large"
              startIcon={importing ? <CircularProgress size={18} color="inherit" /> : <FileUploadIcon />}
              disabled={!canImport || importing}
              onClick={handleImportClick}
            >
              {importing ? 'Importing…' : 'Import'}
            </Button>
          </Box>

          {/* Results summary */}
          {importSummary && <ImportResultsSummary summary={importSummary} />}
        </Stack>
      </Container>

      {/* Clear-data confirmation dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        aria-labelledby="confirm-clear-dialog-title"
      >
        <DialogTitle id="confirm-clear-dialog-title" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningAmberIcon color="warning" />
          Clear all existing data?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will permanently delete all your current expenses, settings, categories, and
            preferences before importing. This action <strong>cannot be undone</strong>.
            <br /><br />
            Are you sure you want to continue?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmImport} color="error" variant="contained">
            Yes, clear and import
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
