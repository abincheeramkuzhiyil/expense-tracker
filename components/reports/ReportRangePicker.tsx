'use client';

import { Box, MenuItem, TextField } from '@mui/material';
import { ReportRangePreset } from '@/types/report.types';
import { REPORT_RANGE_PRESET_OPTIONS } from '@/utils/reportAggregation';

interface ReportRangePickerProps {
  preset: ReportRangePreset;
  customStart: string;
  customEnd: string;
  onPresetChange: (preset: ReportRangePreset) => void;
  onCustomStartChange: (date: string) => void;
  onCustomEndChange: (date: string) => void;
}

export default function ReportRangePicker({
  preset,
  customStart,
  customEnd,
  onPresetChange,
  onCustomStartChange,
  onCustomEndChange,
}: ReportRangePickerProps) {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-start' }}>
      <TextField
        select
        label="Range"
        size="small"
        value={preset}
        onChange={(e) => onPresetChange(e.target.value as ReportRangePreset)}
        sx={{ minWidth: 180 }}
      >
        {REPORT_RANGE_PRESET_OPTIONS.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>

      {preset === 'custom' && (
        <>
          <TextField
            label="Start date"
            type="date"
            size="small"
            value={customStart}
            onChange={(e) => onCustomStartChange(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="End date"
            type="date"
            size="small"
            value={customEnd}
            onChange={(e) => onCustomEndChange(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </>
      )}
    </Box>
  );
}
