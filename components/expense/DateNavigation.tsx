'use client';

import {
  Paper,
  Grid,
  IconButton,
  Typography,
  Box,
} from '@mui/material';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import TodayIcon from '@mui/icons-material/Today';
import { ViewMode } from '@/types/expense.types';

interface DateNavigationProps {
  currentDate: Date;
  viewMode: ViewMode;
  onDateChange: (date: Date) => void;
  total: number;
}

export default function DateNavigation({
  currentDate,
  viewMode,
  onDateChange,
  total,
}: DateNavigationProps) {
  const formatDate = (date: Date) => {
    if (viewMode === 'day') {
      return date.toDateString();
    } else if (viewMode === 'month') {
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else {
      return date.getFullYear().toString();
    }
  };

  const handlePrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() - 1);
    } else if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setFullYear(newDate.getFullYear() - 1);
    }
    onDateChange(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + 1);
    } else if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setFullYear(newDate.getFullYear() + 1);
    }
    onDateChange(newDate);
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  const isToday = () => {
    const today = new Date();
    if (viewMode === 'day') {
      return currentDate.toDateString() === today.toDateString();
    } else if (viewMode === 'month') {
      return (
        currentDate.getMonth() === today.getMonth() &&
        currentDate.getFullYear() === today.getFullYear()
      );
    } else {
      return currentDate.getFullYear() === today.getFullYear();
    }
  };

  return (
    <Paper elevation={1}>
      <Grid container alignItems="center" justifyContent="space-between" sx={{ p: 1 }}>
        <Grid item>
          <IconButton onClick={handlePrevious}>
            <KeyboardArrowLeftIcon />
          </IconButton>
        </Grid>
        <Grid item>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body1">{formatDate(currentDate)}</Typography>
            <Typography variant="caption">
              <b>Total:</b> ₹{total.toFixed(2)}
            </Typography>
          </Box>
        </Grid>
        <Grid item>
          <Grid container>
            <Grid item>
              <IconButton onClick={handleNext}>
                <KeyboardArrowRightIcon />
              </IconButton>
            </Grid>
            <Grid item>
              <IconButton onClick={handleToday} disabled={isToday()}>
                <TodayIcon />
              </IconButton>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Paper>
  );
}
