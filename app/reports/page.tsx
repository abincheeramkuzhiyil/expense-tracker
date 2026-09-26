'use client';

import { useState } from 'react';
import { Box, Container, Grid, Tab, Tabs, Typography } from '@mui/material';
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
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', marginTop: '0.8rem' }}>
              Reports
            </Typography>
          </Grid>
        </Grid>

        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={12} md={6}>
            <Box sx={{ padding: '1rem', backgroundColor: '#eaeeef' }}>
              <Tabs value={tab} onChange={(_e, value) => setTab(value)} sx={{ mb: 2 }}>
                <Tab value="breakdown" label="Category Breakdown" />
                <Tab value="compare" label="Compare Periods" />
              </Tabs>

              {tab === 'breakdown' ? (
                <CategoryBreakdownReport
                  range={range}
                  rangeControl={
                    <ReportRangePicker
                      preset={preset}
                      customStart={customStart}
                      customEnd={customEnd}
                      onPresetChange={setPreset}
                      onCustomStartChange={setCustomStart}
                      onCustomEndChange={setCustomEnd}
                    />
                  }
                />
              ) : (
                <ComparePeriodsReport />
              )}
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
