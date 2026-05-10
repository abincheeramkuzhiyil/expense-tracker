import { AppSettings, PendingStoredExpense, StoredYear } from '@/types/expense.types';
import { UserPreferences } from '@/types/userPreferences.types';
import { ImportKeyResult, ImportSummary } from '@/types/importData.types';
import { clearAllExpenseData, clearYearCache } from '@/utils/expenseStorage';
import { getCategories, saveCategories } from '@/utils/expenseCategories';
import { saveSettings } from '@/utils/settingsStorage';
import { saveUserPreferences } from '@/utils/userPreferencesStorage';
import { getSpentOnMapping, saveSpentOnMapping } from '@/utils/spentOnMapping';
import { isValidYearKey } from '@/utils/importValidation';

const PENDING_STORAGE_KEY = 'expensesPending';
const YEAR_INDEX_KEY = 'expenseYearIndex';
const SETTINGS_KEY = 'appSettings';
const USER_PREFS_KEY = 'userPreferences';
const CATEGORIES_KEY = 'expenseCategories';
const SPENT_ON_KEY = 'spentOnCategoryMapping';

/** Removes all app data from localStorage and clears the year cache. */
export function clearAllAppData(): void {
  clearAllExpenseData();
  localStorage.removeItem(SETTINGS_KEY);
  localStorage.removeItem(USER_PREFS_KEY);
  localStorage.removeItem(CATEGORIES_KEY);
  localStorage.removeItem(SPENT_ON_KEY);
}

function importCategories(value: unknown): ImportKeyResult {
  try {
    const incoming = value as string[];
    const existing = getCategories();
    const merged = Array.from(new Set([...existing, ...incoming]));
    saveCategories(merged);
    return { key: 'expenseCategories', status: 'success', recordsImported: incoming.length, recordsFailed: 0 };
  } catch (e) {
    return { key: 'expenseCategories', status: 'error', recordsImported: 0, recordsFailed: 0, message: String(e) };
  }
}

function importPending(value: unknown): ImportKeyResult {
  try {
    const incoming = value as PendingStoredExpense[];
    const existingRaw = localStorage.getItem(PENDING_STORAGE_KEY);
    const existing: PendingStoredExpense[] = existingRaw ? JSON.parse(existingRaw) : [];
    const existingIds = new Set(existing.map((e) => e.id));
    const newItems = incoming.filter((e) => !existingIds.has(e.id));
    const merged = [...existing, ...newItems];
    localStorage.setItem(PENDING_STORAGE_KEY, JSON.stringify(merged));
    return { key: 'expensesPending', status: 'success', recordsImported: newItems.length, recordsFailed: incoming.length - newItems.length };
  } catch (e) {
    return { key: 'expensesPending', status: 'error', recordsImported: 0, recordsFailed: 0, message: String(e) };
  }
}

function importYearIndex(value: unknown): ImportKeyResult {
  try {
    const incoming = value as string[];
    const existingRaw = localStorage.getItem(YEAR_INDEX_KEY);
    const existing: string[] = existingRaw ? JSON.parse(existingRaw) : [];
    const merged = Array.from(new Set([...existing, ...incoming])).sort();
    localStorage.setItem(YEAR_INDEX_KEY, JSON.stringify(merged));
    return { key: 'expenseYearIndex', status: 'success', recordsImported: incoming.length, recordsFailed: 0 };
  } catch (e) {
    return { key: 'expenseYearIndex', status: 'error', recordsImported: 0, recordsFailed: 0, message: String(e) };
  }
}

function importYearData(year: string, value: unknown): ImportKeyResult {
  try {
    const incoming = value as StoredYear;
    const existingRaw = localStorage.getItem(year);
    const existing: StoredYear = existingRaw ? JSON.parse(existingRaw) : {};

    let imported = 0;
    let skipped = 0;

    for (const [monthKey, monthExpenses] of Object.entries(incoming)) {
      const existingMonth = existing[monthKey] ?? [];
      const existingIds = new Set(existingMonth.map((e) => e.id));
      const newItems = monthExpenses.filter((e) => !existingIds.has(e.id));
      existing[monthKey] = [...existingMonth, ...newItems];
      imported += newItems.length;
      skipped += monthExpenses.length - newItems.length;
    }

    localStorage.setItem(year, JSON.stringify(existing));

    // Ensure this year appears in the year index
    const indexRaw = localStorage.getItem(YEAR_INDEX_KEY);
    const yearIndex: string[] = indexRaw ? JSON.parse(indexRaw) : [];
    if (!yearIndex.includes(year)) {
      yearIndex.push(year);
      yearIndex.sort();
      localStorage.setItem(YEAR_INDEX_KEY, JSON.stringify(yearIndex));
    }

    return { key: year, status: 'success', recordsImported: imported, recordsFailed: skipped };
  } catch (e) {
    return { key: year, status: 'error', recordsImported: 0, recordsFailed: 0, message: String(e) };
  }
}

function importAppSettings(value: unknown): ImportKeyResult {
  try {
    saveSettings(value as AppSettings);
    return { key: 'appSettings', status: 'success', recordsImported: 1, recordsFailed: 0 };
  } catch (e) {
    return { key: 'appSettings', status: 'error', recordsImported: 0, recordsFailed: 1, message: String(e) };
  }
}

function importUserPreferences(value: unknown): ImportKeyResult {
  try {
    saveUserPreferences(value as UserPreferences);
    return { key: 'userPreferences', status: 'success', recordsImported: 1, recordsFailed: 0 };
  } catch (e) {
    return { key: 'userPreferences', status: 'error', recordsImported: 0, recordsFailed: 1, message: String(e) };
  }
}

function importSpentOnMapping(value: unknown): ImportKeyResult {
  try {
    const incoming = value as Record<string, string>;
    const existing = getSpentOnMapping();
    const merged = { ...existing, ...incoming }; // incoming wins on conflict
    saveSpentOnMapping(merged);
    return { key: 'spentOnCategoryMapping', status: 'success', recordsImported: Object.keys(incoming).length, recordsFailed: 0 };
  } catch (e) {
    return { key: 'spentOnCategoryMapping', status: 'error', recordsImported: 0, recordsFailed: 0, message: String(e) };
  }
}

/**
 * Imports data from a validated JSON object into localStorage.
 * Assumes all keys and shapes have already been validated via importValidation.ts.
 *
 * @param data       The parsed JSON object (keys → values).
 * @param clearFirst If true, all existing app data is cleared before import begins.
 * @returns          An ImportSummary with per-key results and totals.
 */
export function importData(data: Record<string, unknown>, clearFirst: boolean): ImportSummary {
  if (clearFirst) {
    clearAllAppData();
  }

  const results: ImportKeyResult[] = [];

  for (const [key, value] of Object.entries(data)) {
    let result: ImportKeyResult;

    if (key === 'expenseCategories') {
      result = importCategories(value);
    } else if (key === 'expensesPending') {
      result = importPending(value);
    } else if (key === 'expenseYearIndex') {
      result = importYearIndex(value);
    } else if (key === 'appSettings') {
      result = importAppSettings(value);
    } else if (key === 'userPreferences') {
      result = importUserPreferences(value);
    } else if (key === 'spentOnCategoryMapping') {
      result = importSpentOnMapping(value);
    } else if (isValidYearKey(key)) {
      result = importYearData(key, value);
    } else {
      result = { key, status: 'skipped', recordsImported: 0, recordsFailed: 0, message: 'Unrecognised key — skipped' };
    }

    results.push(result);
  }

  // Clear the in-memory year cache so the UI reflects the freshly imported data
  clearYearCache();

  const totalImported = results.reduce((sum, r) => sum + r.recordsImported, 0);
  const totalFailed = results.reduce((sum, r) => sum + r.recordsFailed, 0);

  return { results, totalImported, totalFailed };
}
