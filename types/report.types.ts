import { Expense } from './expense.types';

/** Inclusive date range using "YYYY-MM-DD" strings to avoid timezone shifting. */
export interface DateRange {
  start: string;
  end: string;
}

export type ReportRangePreset =
  | 'thisMonth'
  | 'lastMonth'
  | 'thisYear'
  | 'lastYear'
  | 'last3Months'
  | 'last6Months'
  | 'custom';

export interface SubCategoryBreakdown {
  spentOn: string;
  total: number;
  count: number;
  expenses: Expense[];
}

export interface CategoryBreakdown {
  category: string;
  total: number;
  count: number;
  /** Sorted descending by total. */
  subCategories: SubCategoryBreakdown[];
}

export interface CategoryBreakdownReportResult {
  range: DateRange;
  total: number;
  /** Sorted descending by total. */
  categories: CategoryBreakdown[];
}

export type ComparePeriodType = 'month' | 'year';

export interface ComparePeriod {
  type: ComparePeriodType;
  year: number;
  /** 1-12. Required when type === 'month'. */
  month?: number;
}

export interface SubCategoryComparisonRow {
  spentOn: string;
  totalA: number;
  totalB: number;
  change: number;
  /** Percent change from B to A. null when totalB is 0 (undefined/infinite change). */
  changePercent: number | null;
  expensesA: Expense[];
  expensesB: Expense[];
}

export interface CategoryComparisonRow {
  category: string;
  totalA: number;
  totalB: number;
  change: number;
  changePercent: number | null;
  /** Sorted descending by totalA. */
  subCategories: SubCategoryComparisonRow[];
}

export interface PeriodComparisonResult {
  periodA: ComparePeriod;
  periodB: ComparePeriod;
  totalA: number;
  totalB: number;
  change: number;
  changePercent: number | null;
  /** Sorted descending by totalA. */
  categories: CategoryComparisonRow[];
}
