import { Expense } from '@/types/expense.types';
import {
  CategoryBreakdown,
  CategoryBreakdownReportResult,
  CategoryComparisonRow,
  ComparePeriod,
  DateRange,
  PeriodComparisonResult,
  ReportRangePreset,
  SubCategoryBreakdown,
  SubCategoryComparisonRow,
} from '@/types/report.types';
import { getExpensesByMonth, getExpensesByYear } from '@/utils/expenseStorage';
import { formatDateForInput } from '@/utils/dateFormatter';

export const REPORT_RANGE_PRESET_OPTIONS: { value: ReportRangePreset; label: string }[] = [
  { value: 'thisMonth', label: 'This Month' },
  { value: 'lastMonth', label: 'Last Month' },
  { value: 'thisYear', label: 'This Year' },
  { value: 'lastYear', label: 'Last Year' },
  { value: 'last3Months', label: 'Last 3 Months' },
  { value: 'last6Months', label: 'Last 6 Months' },
  { value: 'custom', label: 'Custom Range' },
];

function lastDayOfMonth(year: number, month: number): number {
  // month is 1-based; day 0 of next month = last day of this month
  return new Date(year, month, 0).getDate();
}

function monthRange(year: number, month: number): DateRange {
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDayOfMonth(year, month)).padStart(2, '0')}`;
  return { start, end };
}

/**
 * Resolves a preset (or custom bounds) into a concrete inclusive "YYYY-MM-DD" range.
 * All presets are calendar-aligned (full months/years), matching how the rest of the
 * app treats Month/Year views.
 */
export function resolvePresetRange(
  preset: ReportRangePreset,
  customStart?: string,
  customEnd?: string
): DateRange {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-12

  switch (preset) {
    case 'thisMonth':
      return monthRange(year, month);
    case 'lastMonth': {
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;
      return monthRange(prevYear, prevMonth);
    }
    case 'thisYear':
      return { start: `${year}-01-01`, end: `${year}-12-31` };
    case 'lastYear':
      return { start: `${year - 1}-01-01`, end: `${year - 1}-12-31` };
    case 'last3Months':
    case 'last6Months': {
      const span = preset === 'last3Months' ? 3 : 6;
      const startTotalMonths = year * 12 + (month - 1) - (span - 1);
      const startYear = Math.floor(startTotalMonths / 12);
      const startMonth = (startTotalMonths % 12) + 1;
      return {
        start: `${startYear}-${String(startMonth).padStart(2, '0')}-01`,
        end: monthRange(year, month).end,
      };
    }
    case 'custom':
      return { start: customStart ?? formatDateForInput(now), end: customEnd ?? formatDateForInput(now) };
    default:
      return monthRange(year, month);
  }
}

/** Reads only the years overlapping the range (via the existing cached year reads) and filters to exact days. */
function getExpensesInRange(range: DateRange): Expense[] {
  const startYear = Number(range.start.slice(0, 4));
  const endYear = Number(range.end.slice(0, 4));
  const result: Expense[] = [];
  for (let year = startYear; year <= endYear; year++) {
    for (const exp of getExpensesByYear(year)) {
      const dateStr = formatDateForInput(exp.date);
      if (dateStr >= range.start && dateStr <= range.end) {
        result.push(exp);
      }
    }
  }
  return result;
}

/** Reads the expenses belonging to a single compare period (a whole month or a whole year). */
function getExpensesForPeriod(period: ComparePeriod): Expense[] {
  return period.type === 'month'
    ? getExpensesByMonth(period.year, period.month ?? 1)
    : getExpensesByYear(period.year);
}

function groupByCategory(expenses: Expense[]): CategoryBreakdown[] {
  const catMap = new Map<string, Map<string, Expense[]>>();
  for (const exp of expenses) {
    const category = exp.category || 'Uncategorized';
    const spentOn = exp.spentOn || 'Unspecified';
    if (!catMap.has(category)) catMap.set(category, new Map());
    const subMap = catMap.get(category)!;
    if (!subMap.has(spentOn)) subMap.set(spentOn, []);
    subMap.get(spentOn)!.push(exp);
  }

  const categories: CategoryBreakdown[] = [];
  for (const [category, subMap] of catMap) {
    const subCategories: SubCategoryBreakdown[] = [];
    let catTotal = 0;
    let catCount = 0;
    for (const [spentOn, exps] of subMap) {
      const total = exps.reduce((sum, e) => sum + e.amount, 0);
      subCategories.push({ spentOn, total, count: exps.length, expenses: exps });
      catTotal += total;
      catCount += exps.length;
    }
    subCategories.sort((a, b) => b.total - a.total);
    categories.push({ category, total: catTotal, count: catCount, subCategories });
  }
  categories.sort((a, b) => b.total - a.total);
  return categories;
}

/** Builds the Category → Sub-Category breakdown for a single date range. */
export function buildCategoryBreakdown(range: DateRange): CategoryBreakdownReportResult {
  const expenses = getExpensesInRange(range);
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  return { range, total, categories: groupByCategory(expenses) };
}

function computeChangePercent(totalA: number, totalB: number): number | null {
  if (totalB === 0) return null;
  return ((totalA - totalB) / totalB) * 100;
}

/** Compares two same-type periods (Month vs Month, or Year vs Year) by Category → Sub-Category. */
export function comparePeriods(periodA: ComparePeriod, periodB: ComparePeriod): PeriodComparisonResult {
  const categoriesA = groupByCategory(getExpensesForPeriod(periodA));
  const categoriesB = groupByCategory(getExpensesForPeriod(periodB));

  const categoryNames = new Set([
    ...categoriesA.map((c) => c.category),
    ...categoriesB.map((c) => c.category),
  ]);

  const categories: CategoryComparisonRow[] = [];
  for (const category of categoryNames) {
    const catA = categoriesA.find((c) => c.category === category);
    const catB = categoriesB.find((c) => c.category === category);

    const subNames = new Set([
      ...(catA?.subCategories.map((s) => s.spentOn) ?? []),
      ...(catB?.subCategories.map((s) => s.spentOn) ?? []),
    ]);

    const subCategories: SubCategoryComparisonRow[] = [];
    for (const spentOn of subNames) {
      const subA = catA?.subCategories.find((s) => s.spentOn === spentOn);
      const subB = catB?.subCategories.find((s) => s.spentOn === spentOn);
      const totalA = subA?.total ?? 0;
      const totalB = subB?.total ?? 0;
      subCategories.push({
        spentOn,
        totalA,
        totalB,
        change: totalA - totalB,
        changePercent: computeChangePercent(totalA, totalB),
        expensesA: subA?.expenses ?? [],
        expensesB: subB?.expenses ?? [],
      });
    }
    subCategories.sort((a, b) => b.totalA - a.totalA);

    const totalA = catA?.total ?? 0;
    const totalB = catB?.total ?? 0;
    categories.push({
      category,
      totalA,
      totalB,
      change: totalA - totalB,
      changePercent: computeChangePercent(totalA, totalB),
      subCategories,
    });
  }
  categories.sort((a, b) => b.totalA - a.totalA);

  const totalA = categoriesA.reduce((sum, c) => sum + c.total, 0);
  const totalB = categoriesB.reduce((sum, c) => sum + c.total, 0);

  return {
    periodA,
    periodB,
    totalA,
    totalB,
    change: totalA - totalB,
    changePercent: computeChangePercent(totalA, totalB),
    categories,
  };
}
