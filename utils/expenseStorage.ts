import { Expense, ExpenseSource, ExpenseStatus, PendingStoredExpense, StoredExpense, StoredYear } from '@/types/expense.types';
import { ExpenseFormData } from '@/components/expense/AddExpenseForm';
import { v4 as uuidv4 } from 'uuid';

const YEAR_INDEX_KEY = 'expenseYearIndex';
const PENDING_STORAGE_KEY = 'expensesPending';

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
    // All items in approved year/month buckets are approved by definition
    status: 'approved',
    date: new Date(stored.date),
    createdAt: new Date(stored.createdAt),
    updatedAt: new Date(stored.updatedAt),
  };
}

function readPendingStorage(): PendingStoredExpense[] {
  try {
    const raw = localStorage.getItem(PENDING_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PendingStoredExpense[]) : [];
  } catch {
    return [];
  }
}

function writePendingStorage(items: PendingStoredExpense[]): void {
  localStorage.setItem(PENDING_STORAGE_KEY, JSON.stringify(items));
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
    createdAt: now,
    updatedAt: now,
  };

  if (status === 'pending') {
    // Route to the dedicated pending queue — not the approved year/month buckets
    const pendingItem: PendingStoredExpense = {
      id: stored.id,
      amount: stored.amount,
      category: stored.category,
      date: stored.date,
      description: stored.description,
      source: stored.source,
      createdAt: stored.createdAt,
      updatedAt: stored.updatedAt,
    };
    const pendingList = readPendingStorage();
    pendingList.push(pendingItem);
    writePendingStorage(pendingList);
  } else {
    const yearData = getYearData(yearNum);
    if (!yearData[monthKey]) {
      yearData[monthKey] = [];
    }
    yearData[monthKey].push(stored);
    saveYearData(yearNum, yearData);
    addYearToIndex(String(yearNum));
  }

  notifyChange();
  return storedToExpense(stored);
}

/** Returns approved expenses for a specific day. */
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

/** Returns approved expenses for a given month. month is 1–12. */
export function getExpensesByMonth(year: number, month: number): Expense[] {
  if (typeof window === 'undefined') return [];
  try {
    const yearData = getYearData(year);
    return (yearData[String(month)] ?? [])
      .map(storedToExpense);
  } catch {
    return [];
  }
}

/** Returns approved expenses for a given year. */
export function getExpensesByYear(year: number): Expense[] {
  if (typeof window === 'undefined') return [];
  try {
    const yearData = getYearData(year);
    return Object.values(yearData)
      .flat()
      .map(storedToExpense);
  } catch {
    return [];
  }
}

// ─── Pending review API ───────────────────────────────────────────────────────

/** Returns all expenses in the pending queue, sorted newest-first. */
export function getPendingExpenses(): Expense[] {
  if (typeof window === 'undefined') return [];
  try {
    const pending = readPendingStorage();
    return pending
      .map((item) => ({
        ...item,
        status: 'pending' as const,
        date: new Date(item.date),
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
      }))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch {
    return [];
  }
}

/**
 * Moves a pending expense into the approved year/month bucket.
 * The expense becomes visible in standard expense lists immediately.
 */
export function approveExpense(id: string): void {
  if (typeof window === 'undefined') return;
  const pending = readPendingStorage();
  const idx = pending.findIndex((e) => e.id === id);
  if (idx === -1) return;

  const item = pending[idx];
  const [yearNum, monthNum] = item.date.split('-').map(Number);
  const monthKey = String(monthNum);

  // Save to approved year/month bucket (no status field needed)
  const stored: StoredExpense = {
    id: item.id,
    amount: item.amount,
    category: item.category,
    date: item.date,
    description: item.description,
    source: item.source,
    createdAt: item.createdAt,
    updatedAt: new Date().toISOString(),
  };
  const yearData = getYearData(yearNum);
  if (!yearData[monthKey]) yearData[monthKey] = [];
  yearData[monthKey].push(stored);
  saveYearData(yearNum, yearData);
  addYearToIndex(String(yearNum));

  // Remove from pending queue
  pending.splice(idx, 1);
  writePendingStorage(pending);
  notifyChange();
}

/** Permanently removes a pending expense without approving it. */
export function rejectExpense(id: string): void {
  if (typeof window === 'undefined') return;
  const pending = readPendingStorage();
  const idx = pending.findIndex((e) => e.id === id);
  if (idx === -1) return;
  pending.splice(idx, 1);
  writePendingStorage(pending);
  notifyChange();
}

/** Approves every pending expense in a single batch. */
export function approveAllPending(): number {
  if (typeof window === 'undefined') return 0;
  const pending = readPendingStorage();
  if (pending.length === 0) return 0;

  const now = new Date().toISOString();
  for (const item of pending) {
    const [yearNum, monthNum] = item.date.split('-').map(Number);
    const monthKey = String(monthNum);
    const stored: StoredExpense = {
      id: item.id,
      amount: item.amount,
      category: item.category,
      date: item.date,
      description: item.description,
      source: item.source,
      createdAt: item.createdAt,
      updatedAt: now,
    };
    const yearData = getYearData(yearNum);
    if (!yearData[monthKey]) yearData[monthKey] = [];
    yearData[monthKey].push(stored);
    saveYearData(yearNum, yearData);
    addYearToIndex(String(yearNum));
  }
  writePendingStorage([]);
  notifyChange();
  return pending.length;
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
    localStorage.removeItem(PENDING_STORAGE_KEY);
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
 * Routes pending expenses to the pending queue; approved expenses to the year/month bucket.
 * For use by the seeder utility only — not for production use.
 */
export function seedExpenseToStorage(expense: Expense): void {
  if (typeof window === 'undefined') return;
  const dateStr = `${expense.date.getFullYear()}-${String(expense.date.getMonth() + 1).padStart(2, '0')}-${String(expense.date.getDate()).padStart(2, '0')}`;

  if (expense.status === 'pending') {
    const pendingItem: PendingStoredExpense = {
      id: expense.id,
      amount: expense.amount,
      category: expense.category,
      date: dateStr,
      description: expense.description,
      source: expense.source,
      createdAt: expense.createdAt.toISOString(),
      updatedAt: expense.updatedAt.toISOString(),
    };
    const pendingList = readPendingStorage();
    pendingList.push(pendingItem);
    writePendingStorage(pendingList);
    return;
  }

  const year = expense.date.getFullYear();
  const monthKey = String(expense.date.getMonth() + 1);
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
