import type { StoredExpense } from '@/types/expense.types';

/** Pure search helpers: no storage or browser access, so they can be tested in Node. */

export type SearchRange = 'all' | '12m' | '3m';

export interface SpentOnSuggestion {
  label: string;
  count: number;
}

/** `spentOn` = exact Spent On match; `text` = every word must appear in Spent On, Category or Description. */
export type SearchQuery =
  | { type: 'spentOn'; value: string }
  | { type: 'text'; value: string };

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

/** Distinct Spent On values actually used, case variants merged, labelled with their most common casing. */
export function buildSpentOnIndex(expenses: StoredExpense[]): SpentOnSuggestion[] {
  const groups = new Map<string, Map<string, number>>();
  for (const e of expenses) {
    const key = normalizeText(e.spentOn);
    if (!key) continue;
    const casings = groups.get(key) ?? new Map<string, number>();
    const label = e.spentOn.trim().replace(/\s+/g, ' ');
    casings.set(label, (casings.get(label) ?? 0) + 1);
    groups.set(key, casings);
  }

  return [...groups.values()].map((casings) => {
    let label = '';
    let best = 0;
    let count = 0;
    for (const [candidate, n] of casings) {
      count += n;
      if (n > best || (n === best && candidate.localeCompare(label) < 0)) {
        best = n;
        label = candidate;
      }
    }
    return { label, count };
  });
}

/** Ranks: starts-with, then word-start, then contains. Ties: higher count, then alphabetical. */
export function suggestSpentOn(
  index: SpentOnSuggestion[],
  query: string,
  limit = 8
): SpentOnSuggestion[] {
  const q = normalizeText(query);
  if (!q) return [];

  const ranked: { item: SpentOnSuggestion; rank: number }[] = [];
  for (const item of index) {
    const key = normalizeText(item.label);
    let rank: number;
    if (key.startsWith(q)) rank = 0;
    else if (key.split(' ').some((word) => word.startsWith(q))) rank = 1;
    else if (key.includes(q)) rank = 2;
    else continue;
    ranked.push({ item, rank });
  }

  return ranked
    .sort(
      (a, b) =>
        a.rank - b.rank ||
        b.item.count - a.item.count ||
        a.item.label.localeCompare(b.item.label)
    )
    .slice(0, limit)
    .map((r) => r.item);
}

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** Earliest included date ("YYYY-MM-DD") for a range, or null when unbounded. */
export function getRangeStart(range: SearchRange, today: Date = new Date()): string | null {
  if (range === 'all') return null;
  const months = range === '12m' ? 12 : 3;
  const target = new Date(today.getFullYear(), today.getMonth() - months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(today.getDate(), lastDay));
  return toDateKey(target);
}

/** Matching expenses, newest date first (ties: most recently created first). */
export function searchExpenses(
  expenses: StoredExpense[],
  query: SearchQuery,
  range: SearchRange = 'all',
  today: Date = new Date()
): StoredExpense[] {
  const value = normalizeText(query.value);
  if (!value) return [];

  const from = getRangeStart(range, today);
  const tokens = value.split(' ');

  return expenses
    .filter((e) => {
      if (from && e.date < from) return false;
      if (query.type === 'spentOn') return normalizeText(e.spentOn) === value;
      const haystack = normalizeText(`${e.spentOn} ${e.category} ${e.description}`);
      return tokens.every((t) => haystack.includes(t));
    })
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) ||
        b.createdAt.localeCompare(a.createdAt) ||
        a.id.localeCompare(b.id)
    );
}

/** "2026-04-12" -> "12 Apr 26" */
export function formatResultDate(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  return `${String(day).padStart(2, '0')} ${SHORT_MONTHS[month - 1]} ${String(year).slice(-2)}`;
}

/** Local-midnight Date from a stored "YYYY-MM-DD" key, avoiding UTC day shifts. */
export function dateKeyToDate(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// ─── Tag filter ───────────────────────────────────────────────────────────────

export interface TagSuggestion {
  label: string;
  count: number;
}

function newestFirst(a: StoredExpense, b: StoredExpense): number {
  return (
    b.date.localeCompare(a.date) ||
    b.createdAt.localeCompare(a.createdAt) ||
    a.id.localeCompare(b.id)
  );
}

/** Tags actually used on expenses, case variants merged, alphabetical, with how many expenses use each. */
export function buildTagIndex(expenses: StoredExpense[]): TagSuggestion[] {
  const groups = new Map<string, Map<string, number>>();
  for (const e of expenses) {
    // An expense counts once per tag even if its list repeats a tag in different casing
    const seen = new Set<string>();
    for (const raw of e.tags ?? []) {
      const key = normalizeText(raw);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      const casings = groups.get(key) ?? new Map<string, number>();
      const label = raw.trim().replace(/\s+/g, ' ');
      casings.set(label, (casings.get(label) ?? 0) + 1);
      groups.set(key, casings);
    }
  }

  return [...groups.values()]
    .map((casings) => {
      let label = '';
      let best = 0;
      let count = 0;
      for (const [candidate, n] of casings) {
        count += n;
        if (n > best || (n === best && candidate.localeCompare(label) < 0)) {
          best = n;
          label = candidate;
        }
      }
      return { label, count };
    })
    .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));
}

/** Tags that contain the typed text (accent/case-insensitive), alphabetical, minus the already selected ones. */
export function suggestTags(
  index: TagSuggestion[],
  query: string,
  selected: string[] = []
): TagSuggestion[] {
  const q = normalizeText(query);
  const taken = new Set(selected.map(normalizeText));
  return index.filter((t) => {
    const key = normalizeText(t.label);
    return !taken.has(key) && (!q || key.includes(q));
  });
}

/** Expenses carrying ALL of the given tags (AND), newest first. No tags selected returns nothing. */
export function filterByTags(
  expenses: StoredExpense[],
  tags: string[],
  range: SearchRange = 'all',
  today: Date = new Date()
): StoredExpense[] {
  const wanted = [...new Set(tags.map(normalizeText).filter(Boolean))];
  if (wanted.length === 0) return [];

  const from = getRangeStart(range, today);
  return expenses
    .filter((e) => {
      if (from && e.date < from) return false;
      if (!e.tags || e.tags.length === 0) return false;
      const have = new Set(e.tags.map(normalizeText));
      return wanted.every((t) => have.has(t));
    })
    .sort(newestFirst);
}

/** Sum of amounts, rounded to cents to avoid floating-point drift. */
export function sumAmounts(expenses: StoredExpense[]): number {
  const cents = expenses.reduce((sum, e) => sum + Math.round(e.amount * 100), 0);
  return cents / 100;
}

// ─── Narrowing chips (tags / categories) ──────────────────────────────────────

/** Sentinel chip value meaning "expenses without any tag". Exclusive with real tags. */
export const NO_TAG = '__no_tag__';

export interface TagFacet {
  /** Tag label, or NO_TAG. */
  key: string;
  label: string;
  count: number;
}

export interface TagFacets {
  /** Chips currently applied, in selection order. */
  selected: TagFacet[];
  /** Chips that can still be applied, most results first (ties alphabetical). Zero-count chips are omitted. */
  options: TagFacet[];
}

export interface CategoryFacet {
  label: string;
  count: number;
  amount: number;
}

/** Expenses matching every selected chip (AND). NO_TAG matches untagged expenses and cannot combine with real tags. */
export function filterByFacetTags(expenses: StoredExpense[], selected: string[]): StoredExpense[] {
  if (selected.length === 0) return expenses;
  if (selected.includes(NO_TAG)) {
    return selected.length === 1 ? expenses.filter((e) => !e.tags || e.tags.length === 0) : [];
  }
  const wanted = [...new Set(selected.map(normalizeText))];
  return expenses.filter((e) => {
    if (!e.tags || e.tags.length === 0) return false;
    const have = new Set(e.tags.map(normalizeText));
    return wanted.every((t) => have.has(t));
  });
}

/**
 * Chips for narrowing a result list by tag. Counts are what you would get by tapping the chip
 * (computed on the results already narrowed by the selected chips), so zero-count chips are hidden.
 * Returns no options and nothing selected when no result carries a tag.
 */
export function buildTagFacets(results: StoredExpense[], selected: string[]): TagFacets {
  if (!results.some((e) => e.tags && e.tags.length > 0)) return { selected: [], options: [] };

  const narrowed = filterByFacetTags(results, selected);
  const chosen = new Set(selected.map(normalizeText));
  const labelFor = new Map(buildTagIndex(results).map((t) => [normalizeText(t.label), t.label]));

  const selectedChips: TagFacet[] = selected.map((key) => ({
    key,
    label: key === NO_TAG ? 'No tag' : labelFor.get(normalizeText(key)) ?? key,
    count: narrowed.length,
  }));

  const options: TagFacet[] = buildTagIndex(narrowed)
    .filter((t) => !chosen.has(normalizeText(t.label)))
    .map((t) => ({ key: t.label, label: t.label, count: t.count }));

  const untagged = narrowed.filter((e) => !e.tags || e.tags.length === 0).length;
  if (untagged > 0 && !selected.includes(NO_TAG)) {
    options.push({ key: NO_TAG, label: 'No tag', count: untagged });
  }

  options.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));
  return { selected: selectedChips, options };
}

/** Categories present in the results with their counts and totals, highest amount first. */
export function buildCategoryFacets(results: StoredExpense[]): CategoryFacet[] {
  const groups = new Map<string, { casings: Map<string, number>; count: number; cents: number }>();
  for (const e of results) {
    const key = normalizeText(e.category);
    if (!key) continue;
    const group = groups.get(key) ?? { casings: new Map<string, number>(), count: 0, cents: 0 };
    const label = e.category.trim().replace(/\s+/g, ' ');
    group.casings.set(label, (group.casings.get(label) ?? 0) + 1);
    group.count += 1;
    group.cents += Math.round(e.amount * 100);
    groups.set(key, group);
  }

  return [...groups.values()]
    .map((g) => {
      let label = '';
      let best = 0;
      for (const [candidate, n] of g.casings) {
        if (n > best || (n === best && candidate.localeCompare(label) < 0)) {
          best = n;
          label = candidate;
        }
      }
      return { label, count: g.count, amount: g.cents / 100 };
    })
    .sort((a, b) => b.amount - a.amount || a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));
}

/** Expenses in the given category (case/accent-insensitive); a null category keeps everything. */
export function filterByCategory(expenses: StoredExpense[], category: string | null): StoredExpense[] {
  if (!category) return expenses;
  const wanted = normalizeText(category);
  return expenses.filter((e) => normalizeText(e.category) === wanted);
}

/** Every word of `value` must appear in Spent On, Category or Description. An empty value matches everything. */
export function matchesKeyword(expense: StoredExpense, value: string): boolean {
  const normalized = normalizeText(value);
  if (!normalized) return true;
  const haystack = normalizeText(`${expense.spentOn} ${expense.category} ${expense.description}`);
  return normalized.split(' ').every((t) => haystack.includes(t));
}

/** Result-row caption: first two tags joined by " · " then "+N" for the rest, e.g. "Son · Gifts +1". */
export function formatTagCaption(tags: string[] | undefined): string {
  if (!tags || tags.length === 0) return '';
  const shown = tags.slice(0, 2).join(' · ');
  return tags.length > 2 ? `${shown} +${tags.length - 2}` : shown;
}

