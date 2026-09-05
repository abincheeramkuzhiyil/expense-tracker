'use client';

import { Box, MenuItem, TextField, Typography } from '@mui/material';
import { ComparePeriod, ComparePeriodType } from '@/types/report.types';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

interface PeriodPickerProps {
  label: string;
  compareBy: ComparePeriodType;
  period: ComparePeriod;
  years: number[];
  onChange: (period: ComparePeriod) => void;
}

export default function PeriodPicker({ label, compareBy, period, years, onChange }: PeriodPickerProps) {
  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
      <Typography variant="body2" sx={{ minWidth: 64, fontWeight: 'bold' }}>
        {label}
      </Typography>
      {compareBy === 'month' && (
        <TextField
          select
          size="small"
          label="Month"
          value={period.month ?? 1}
          onChange={(e) => onChange({ ...period, month: Number(e.target.value) })}
          sx={{ minWidth: 110 }}
        >
          {MONTH_NAMES.map((name, idx) => (
            <MenuItem key={name} value={idx + 1}>
              {name}
            </MenuItem>
          ))}
        </TextField>
      )}
      <TextField
        select
        size="small"
        label="Year"
        value={period.year}
        onChange={(e) => onChange({ ...period, year: Number(e.target.value) })}
        sx={{ minWidth: 100 }}
      >
        {years.map((y) => (
          <MenuItem key={y} value={y}>
            {y}
          </MenuItem>
        ))}
      </TextField>
    </Box>
  );
}
