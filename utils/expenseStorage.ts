import { Expense, ExpenseSource, ExpenseStatus, StoredExpense, StoredYear } from '@/types/expense.types';
import { ExpenseFormData } from '@/components/expense/AddExpenseForm';
import { v4 as uuidv4 } from 'uuid';

const YEAR_INDEX_KEY = 'expenseYearIndex';

// Module-level cache: avoids repeated JSON.parse for the same year
const yearCache = new Map<number, StoredYear>();

// ─── Change-notification (for React hooks to stay in sync) ────────────────────

type Listener = () => void;
const listeners = new Set<Listener>();

/** Subscribe to expense storage changes. Returns an unsubscribe function. */
export function subscribeToExpenseChanges(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyChange(): void {
  listeners.forEach((l) => l());
}

// ─── Private helpers ──────────────────────────────────────────────────────────

function storedToExpense(stored: StoredExpense): Expense {
  return {
    ...stored,
    // Backward compat: missing status = 'approved'
    status: stored.status ?? 'approved',
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
 *
 * @param formData Form values from AddExpenseForm.
 * @param source   'manual' (default) or 'sms'.
 * @param status   'approved' (default) or 'pending'. Pending expenses are awaiting user review.
 */
export function saveExpense(
  formData: ExpenseFormData,
  source: ExpenseSource = 'manual',
  status: ExpenseStatus = 'approved'
): Expense {
  const now = new Date().toISOString();
  // Parse year/month from "YYYY-MM-DD" directly to avoid timezone shifting
  const [yearNum, monthNum] = formData.date.split('-').map(Number);
  const monthKey = String(monthNum);

  const stored: StoredExpense = {
    id: uuidv4(),
    amount: formData.amount,
    category: formData.category.trim(),
    date: formData.date,
    description: formData.description,
    source,
    status,
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

  notifyChange();
  return storedToExpense(stored);
}

/** Returns approved expenses for a specific day. Pending expenses are excluded. */
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
      .map(storedToExpense)
      .filter((e) => e.status === 'approved');
  } catch {
    return [];
  }
}

/** Returns approved expenses for a given month. month is 1–12. Pending expenses are excluded. */
export function getExpensesByMonth(year: number, month: number): Expense[] {
  if (typeof window === 'undefined') return [];
  try {
    const yearData = getYearData(year);
    return (yearData[String(month)] ?? [])
      .map(storedToExpense)
      .filter((e) => e.status === 'approved');
  } catch {
    return [];
  }
}

/** Returns approved expenses for a given year. Pending expenses are excluded. */
export function getExpensesByYear(year: number): Expense[] {
  if (typeof window === 'undefined') return [];
  try {
    const yearData = getYearData(year);
    return Object.values(yearData)
      .flat()
      .map(storedToExpense)
      .filter((e) => e.status === 'approved');
  } catch {
    return [];
  }
}

// ─── Pending review API ───────────────────────────────────────────────────────

/** Returns all expenses across all years that are awaiting user review. */
export function getPendingExpenses(): Expense[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(YEAR_INDEX_KEY);
    if (!raw) return [];
    const years = JSON.parse(raw) as string[];
    const out: Expense[] = [];
    for (const yearStr of years) {
      const yearData = getYearData(Number(yearStr));
      for (const monthExpenses of Object.values(yearData)) {
        for (const stored of monthExpenses) {
          const expense = storedToExpense(stored);
          if (expense.status === 'pending') out.push(expense);
        }
      }
    }
    return out.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch {
    return [];
  }
}

/** Marks a pending expense as approved so it appears in the regular lists. */
export function approveExpense(id: string): void {
  if (typeof window === 'undefined') return;
  if (!updateStoredExpense(id, (s) => ({ ...s, status: 'approved', updatedAt: new Date().toISOString() }))) return;
  notifyChange();
}

/** Permanently deletes a pending expense from storage. */
export function rejectExpense(id: string): void {
  if (typeof window === 'undefined') return;
  if (!deleteStoredExpense(id)) return;
  notifyChange();
}

/** Approves every currently-pending expense in a single batch. */
export function approveAllPending(): number {
  if (typeof window === 'undefined') return 0;
  const pending = getPendingExpenses();
  if (pending.length === 0) return 0;
  const now = new Date().toISOString();
  for (const expense of pending) {
    updateStoredExpense(expense.id, (s) => ({ ...s, status: 'approved', updatedAt: now }));
  }
  notifyChange();
  return pending.length;
}

/** Internal: locate and mutate a stored expense by id. Returns true if found. */
function updateStoredExpense(
  id: string,
  mutate: (stored: StoredExpense) => StoredExpense
): boolean {
  const raw = localStorage.getItem(YEAR_INDEX_KEY);
  if (!raw) return false;
  try {
    const years = JSON.parse(raw) as string[];
    for (const yearStr of years) {
      const year = Number(yearStr);
      const yearData = getYearData(year);
      for (const [monthKey, monthExpenses] of Object.entries(yearData)) {
        const idx = monthExpenses.findIndex((e) => e.id === id);
        if (idx !== -1) {
          monthExpenses[idx] = mutate(monthExpenses[idx]);
          yearData[monthKey] = monthExpenses;
          saveYearData(year, yearData);
          return true;
        }
      }
    }
  } catch {
    return false;
  }
  return false;
}

/** Internal: locate and remove a stored expense by id. Returns true if found. */
function deleteStoredExpense(id: string): boolean {
  const raw = localStorage.getItem(YEAR_INDEX_KEY);
  if (!raw) return false;
  try {
    const years = JSON.parse(raw) as string[];
    for (const yearStr of years) {
      const year = Number(yearStr);
      const yearData = getYearData(year);
      for (const [monthKey, monthExpenses] of Object.entries(yearData)) {
        const idx = monthExpenses.findIndex((e) => e.id === id);
        if (idx !== -1) {
          monthExpenses.splice(idx, 1);
          yearData[monthKey] = monthExpenses;
          saveYearData(year, yearData);
          return true;
        }
      }
    }
  } catch {
    return false;
  }
  return false;
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
    status: expense.status,
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
