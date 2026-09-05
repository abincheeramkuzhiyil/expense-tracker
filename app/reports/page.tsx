'use client';

import { useState } from 'react';
import { Box, Container, Tab, Tabs } from '@mui/material';
import ReportRangePicker from '@/components/reports/ReportRangePicker';
import CategoryBreakdownReport from '@/components/reports/CategoryBreakdownReport';
import ComparePeriodsReport from '@/components/reports/ComparePeriodsReport';
import { ReportRangePreset } from '@/types/report.types';
import { resolvePresetRange } from '@/utils/reportAggregation';
import { formatDateForInput } from '@/utils/dateFormatter';

type ReportTab = 'breakdown' | 'compare';

export default function ReportsPage() {
  const [tab, setTab] = useState<ReportTab>('breakdown');

  const today = formatDateForInput(new Date());
  const [preset, setPreset] = useState<ReportRangePreset>('thisMonth');
  const [customStart, setCustomStart] = useState<string>(today);
  const [customEnd, setCustomEnd] = useState<string>(today);

  const range = resolvePresetRange(preset, customStart, customEnd);

  return (
    <Box sx={{ marginY: '0.5rem' }}>
      <Container maxWidth="lg">
        <Tabs value={tab} onChange={(_e, value) => setTab(value)} sx={{ mb: 2 }}>
          <Tab value="breakdown" label="Category Breakdown" />
          <Tab value="compare" label="Compare Periods" />
        </Tabs>

        {tab === 'breakdown' ? (
          <Box>
            <Box sx={{ mb: 2 }}>
              <ReportRangePicker
                preset={preset}
                customStart={customStart}
                customEnd={customEnd}
                onPresetChange={setPreset}
                onCustomStartChange={setCustomStart}
                onCustomEndChange={setCustomEnd}
              />
            </Box>
            <CategoryBreakdownReport range={range} />
          </Box>
        ) : (
          <ComparePeriodsReport />
        )}
      </Container>
    </Box>
  );
}
