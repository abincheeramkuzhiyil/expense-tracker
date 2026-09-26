'use client';

import { Box, FormControl, InputLabel, MenuItem, Select, TextField } from '@mui/material';
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
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
      <FormControl variant="standard" sx={{ minWidth: 110 }}>
        <InputLabel id="range-select-label">Range</InputLabel>
        <Select
          labelId="range-select-label"
          id="range-select"
          value={preset}
          label="Range"
          onChange={(e) => onPresetChange(e.target.value as ReportRangePreset)}
        >
          {REPORT_RANGE_PRESET_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

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
