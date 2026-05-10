'use client';

import { useRef } from 'react';
import { Box, Button, Typography } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';

interface ImportFileInputProps {
  onFileSelected: (
    file: File,
    parsed: Record<string, unknown> | null,
    parseError: string | null
  ) => void;
  selectedFileName: string | null;
}

export default function ImportFileInput({ onFileSelected, selectedFileName }: ImportFileInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleButtonClick() {
    inputRef.current?.click();
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        const parsed = JSON.parse(text) as unknown;
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
          onFileSelected(file, null, 'The JSON file must contain a single top-level object (not an array or primitive).');
        } else {
          onFileSelected(file, parsed as Record<string, unknown>, null);
        }
      } catch {
        onFileSelected(file, null, 'Invalid JSON — the file could not be parsed. Please check the file format.');
      }
    };
    reader.readAsText(file);

    // Reset the input so the same file can be re-selected after corrections
    event.target.value = '';
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
      <input
        ref={inputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        aria-label="Select JSON import file"
      />
      <Button
        variant="outlined"
        startIcon={<UploadFileIcon />}
        onClick={handleButtonClick}
      >
        Choose File
      </Button>
      {selectedFileName ? (
        <Typography variant="body2" color="text.primary" sx={{ fontStyle: 'italic' }}>
          {selectedFileName}
        </Typography>
      ) : (
        <Typography variant="body2" color="text.secondary">
          No file chosen
        </Typography>
      )}
    </Box>
  );
}
