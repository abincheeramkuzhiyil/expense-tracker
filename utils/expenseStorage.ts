import { Expense, StoredExpense, StoredYear } from '@/types/expense.types';
import { ExpenseFormData } from '@/components/expense/AddExpenseForm';

const YEAR_INDEX_KEY = 'expenseYearIndex';

// Module-level cache: avoids repeated JSON.parse for the same year
const yearCache = new Map<number, StoredYear>();

// ─── Private helpers ──────────────────────────────────────────────────────────

function storedToExpense(stored: StoredExpense): Expense {
  return {
    ...stored,
    date: new Date(stored.date),
    createdAt: new Date(stored.createdAt),
    updatedAt: new Date(stored.updatedAt),
  };
}

function getYearData(year: number): StoredYear {
  if (yearCache.has(year)) {
    return yearCache.get(year)!;
  }
  try {
    const raw = localStorage.getItem(String(year));
    const data: StoredYear = raw ? JSON.parse(raw) : {};
    yearCache.set(year, data);
    return data;
  } catch {
    yearCache.set(year, {});
    return {};
  }
}

function saveYearData(year: number, data: StoredYear): void {
  localStorage.setItem(String(year), JSON.stringify(data));
  yearCache.set(year, data);
}

function addYearToIndex(yearStr: string): void {
  try {
    const raw = localStorage.getItem(YEAR_INDEX_KEY);
    const years: string[] = raw ? JSON.parse(raw) : [];
    if (!years.includes(yearStr)) {
      years.push(yearStr);
      years.sort();
      localStorage.setItem(YEAR_INDEX_KEY, JSON.stringify(years));
    }
  } catch {
    localStorage.setItem(YEAR_INDEX_KEY, JSON.stringify([yearStr]));
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Saves a new expense from form data.
 * Generates a UUID and timestamps automatically.
 */
export function saveExpense(formData: ExpenseFormData): Expense {
  const now = new Date().toISOString();
  // Parse year/month from "YYYY-MM-DD" directly to avoid timezone shifting
  const [yearNum, monthNum] = formData.date.split('-').map(Number);
  const monthKey = String(monthNum);

  const stored: StoredExpense = {
    id: crypto.randomUUID(),
    amount: formData.amount,
    category: formData.category.trim(),
    date: formData.date,
    description: formData.description,
    source: 'manual',
    createdAt: now,
    updatedAt: now,
  };

  const yearData = getYearData(yearNum);
  if (!yearData[monthKey]) {
    yearData[monthKey] = [];
  }
  yearData[monthKey].push(stored);
  saveYearData(yearNum, yearData);
  addYearToIndex(String(yearNum));

  return storedToExpense(stored);
}

/** Returns expenses for a specific day. */
export function getExpensesByDay(date: Date): Expense[] {
  if (typeof window === 'undefined') return [];
  try {
    const year = date.getFullYear();
    const monthKey = String(date.getMonth() + 1);
    // Compare against the stored "YYYY-MM-DD" string to avoid timezone issues
    const dateStr = `${year}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const yearData = getYearData(year);
    return (yearData[monthKey] ?? [])
      .filter((e) => e.date === dateStr)
      .map(storedToExpense);
  } catch {
    return [];
  }
}

/** Returns all expenses for a given month. month is 1–12. */
export function getExpensesByMonth(year: number, month: number): Expense[] {
  if (typeof window === 'undefined') return [];
  try {
    const yearData = getYearData(year);
    return (yearData[String(month)] ?? []).map(storedToExpense);
  } catch {
    return [];
  }
}

/** Returns all expenses for a given year. */
export function getExpensesByYear(year: number): Expense[] {
  if (typeof window === 'undefined') return [];
  try {
    const yearData = getYearData(year);
    return Object.values(yearData).flat().map(storedToExpense);
  } catch {
    return [];
  }
}

/** Returns the list of years that have expense data. */
export function getAvailableYears(): number[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(YEAR_INDEX_KEY);
    if (!raw) return [];
    return (JSON.parse(raw) as string[]).map(Number);
  } catch {
    return [];
  }
}

/**
 * Clears all expense data and resets the in-memory cache.
 * Used by the seeder utility.
 */
export function clearAllExpenseData(): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(YEAR_INDEX_KEY);
    if (raw) {
      (JSON.parse(raw) as string[]).forEach((year) => localStorage.removeItem(year));
    }
    localStorage.removeItem(YEAR_INDEX_KEY);
    yearCache.clear();
  } catch {
    // ignore errors during clear
  }
}

/** Returns the total number of stored expenses across all years. */
export function getTotalExpenseCount(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = localStorage.getItem(YEAR_INDEX_KEY);
    if (!raw) return 0;
    return (JSON.parse(raw) as string[]).reduce((total, year) => {
      const yearData = getYearData(Number(year));
      return total + Object.values(yearData).reduce((sum, month) => sum + month.length, 0);
    }, 0);
  } catch {
    return 0;
  }
}

/**
 * Seeds a single Expense object directly into storage, preserving its existing id and timestamps.
 * For use by the seeder utility only — not for production use.
 */
export function seedExpenseToStorage(expense: Expense): void {
  if (typeof window === 'undefined') return;
  const year = expense.date.getFullYear();
  const monthKey = String(expense.date.getMonth() + 1);
  const dateStr = `${year}-${String(expense.date.getMonth() + 1).padStart(2, '0')}-${String(expense.date.getDate()).padStart(2, '0')}`;

  const stored: StoredExpense = {
    id: expense.id,
    amount: expense.amount,
    category: expense.category,
    date: dateStr,
    description: expense.description,
    source: expense.source,
    createdAt: expense.createdAt.toISOString(),
    updatedAt: expense.updatedAt.toISOString(),
  };

  const yearData = getYearData(year);
  if (!yearData[monthKey]) {
    yearData[monthKey] = [];
  }
  yearData[monthKey].push(stored);
  saveYearData(year, yearData);
  addYearToIndex(String(year));
}
