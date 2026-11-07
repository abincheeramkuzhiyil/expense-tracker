import { test, expect } from '@playwright/test';
import {
  SearchQuery,
  buildSpentOnIndex,
  dateKeyToDate,
  formatResultDate,
  getRangeStart,
  normalizeText,
  searchExpenses,
  suggestSpentOn,
} from '../utils/expenseSearch';
import type { StoredExpense } from '../types/expense.types';

// Logic-only specs: no browser or page is used, so these run in Node.

let seq = 0;
function exp(partial: Partial<StoredExpense> & Pick<StoredExpense, 'spentOn' | 'date'>): StoredExpense {
  seq += 1;
  return {
    id: `id-${seq}`,
    amount: 100,
    category: 'Other',
    description: '',
    source: 'manual',
    createdAt: `2026-01-01T00:00:${String(seq % 60).padStart(2, '0')}.000Z`,
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...partial,
  };
}

const spentOn = (value: string): SearchQuery => ({ type: 'spentOn', value });
const text = (value: string): SearchQuery => ({ type: 'text', value });

test.describe('expenseSearch — normalizeText', () => {
  test('lowercases, trims, collapses whitespace and strips diacritics', () => {
    expect(normalizeText('  Café   Latte ')).toBe('cafe latte');
  });
});

test.describe('expenseSearch — buildSpentOnIndex', () => {
  test('merges case variants, counts them and uses the most common casing', () => {
    const index = buildSpentOnIndex([
      exp({ spentOn: 'Haircut', date: '2026-01-01' }),
      exp({ spentOn: 'haircut', date: '2026-01-02' }),
      exp({ spentOn: 'Haircut', date: '2026-01-03' }),
      exp({ spentOn: 'Flight', date: '2026-01-04' }),
    ]);
    expect(index).toHaveLength(2);
    expect(index.find((i) => i.label === 'Haircut')?.count).toBe(3);
    expect(index.find((i) => i.label === 'Flight')?.count).toBe(1);
  });

  test('ignores blank Spent On values and returns [] for no data', () => {
    expect(buildSpentOnIndex([])).toEqual([]);
    expect(buildSpentOnIndex([exp({ spentOn: '   ', date: '2026-01-01' })])).toEqual([]);
  });
});

test.describe('expenseSearch — suggestSpentOn', () => {
  const index = [
    { label: 'Haircut', count: 14 },
    { label: 'Hair oil', count: 3 },
    { label: 'Chair rental', count: 9 },
    { label: 'Dry hair wash', count: 5 },
    { label: 'Groceries', count: 40 },
  ];

  test('ranks starts-with, then word-start, then contains', () => {
    const labels = suggestSpentOn(index, 'hai').map((s) => s.label);
    expect(labels).toEqual(['Haircut', 'Hair oil', 'Dry hair wash', 'Chair rental']);
  });

  test('breaks ties by higher count then alphabetical', () => {
    const labels = suggestSpentOn(
      [
        { label: 'Bus b', count: 2 },
        { label: 'Bus a', count: 2 },
        { label: 'Bus c', count: 7 },
      ],
      'bus'
    ).map((s) => s.label);
    expect(labels).toEqual(['Bus c', 'Bus a', 'Bus b']);
  });

  test('is case-insensitive and returns [] for an empty or non-matching query', () => {
    expect(suggestSpentOn(index, 'GROC')).toHaveLength(1);
    expect(suggestSpentOn(index, '   ')).toEqual([]);
    expect(suggestSpentOn(index, 'zzz')).toEqual([]);
  });

  test('respects the limit', () => {
    expect(suggestSpentOn(index, 'a', 2)).toHaveLength(2);
  });
});

test.describe('expenseSearch — getRangeStart', () => {
  test('is null for all time', () => {
    expect(getRangeStart('all', new Date(2026, 4, 31))).toBeNull();
  });

  test('subtracts 12 and 3 months', () => {
    expect(getRangeStart('12m', new Date(2026, 10, 7))).toBe('2025-11-07');
    expect(getRangeStart('3m', new Date(2026, 10, 7))).toBe('2026-08-07');
  });

  test('clamps to the last day of shorter months', () => {
    expect(getRangeStart('3m', new Date(2026, 4, 31))).toBe('2026-02-28');
    expect(getRangeStart('12m', new Date(2024, 1, 29))).toBe('2023-02-28');
  });

  test('crosses year boundaries', () => {
    expect(getRangeStart('3m', new Date(2026, 1, 15))).toBe('2025-11-15');
  });
});

test.describe('expenseSearch — searchExpenses', () => {
  const today = new Date(2026, 10, 7);
  const data = [
    exp({ id: 'hc-new', spentOn: 'Haircut', date: '2026-10-01', description: 'Son' }),
    exp({ id: 'hc-old', spentOn: 'haircut', date: '2025-03-10' }),
    exp({ id: 'oil', spentOn: 'Hair oil', date: '2026-09-01' }),
    exp({
      id: 'flight',
      spentOn: 'Flight',
      category: 'Travel',
      date: '2025-12-20',
      description: 'Native place trip',
    }),
    exp({ id: 'cab', spentOn: 'Taxi', category: 'Travel', date: '2025-12-21', description: 'Airport to native place' }),
  ];

  test('spentOn search is exact and case-insensitive, not a substring match', () => {
    const ids = searchExpenses(data, spentOn('HAIRCUT'), 'all', today).map((e) => e.id);
    expect(ids).toEqual(['hc-new', 'hc-old']);
  });

  test('text search requires every word, across Spent On, Category and Description', () => {
    expect(searchExpenses(data, text('native place'), 'all', today).map((e) => e.id)).toEqual(['cab', 'flight']);
    expect(searchExpenses(data, text('flight native'), 'all', today).map((e) => e.id)).toEqual(['flight']);
    expect(searchExpenses(data, text('travel'), 'all', today)).toHaveLength(2);
    expect(searchExpenses(data, text('flight son'), 'all', today)).toEqual([]);
  });

  test('returns [] for a blank query', () => {
    expect(searchExpenses(data, text('   '), 'all', today)).toEqual([]);
  });

  test('sorts newest date first, then most recently created', () => {
    const rows = [
      exp({ id: 'a', spentOn: 'Tea', date: '2026-01-05', createdAt: '2026-01-05T08:00:00.000Z' }),
      exp({ id: 'b', spentOn: 'Tea', date: '2026-02-01', createdAt: '2026-02-01T08:00:00.000Z' }),
      exp({ id: 'c', spentOn: 'Tea', date: '2026-01-05', createdAt: '2026-01-05T09:00:00.000Z' }),
    ];
    expect(searchExpenses(rows, spentOn('tea'), 'all', today).map((e) => e.id)).toEqual(['b', 'c', 'a']);
  });

  test('range filter includes the boundary date and excludes the day before', () => {
    const rows = [
      exp({ id: 'on', spentOn: 'Tea', date: '2026-08-07' }),
      exp({ id: 'before', spentOn: 'Tea', date: '2026-08-06' }),
      exp({ id: 'after', spentOn: 'Tea', date: '2026-11-01' }),
    ];
    expect(searchExpenses(rows, spentOn('tea'), '3m', today).map((e) => e.id)).toEqual(['after', 'on']);
    expect(searchExpenses(rows, spentOn('tea'), '12m', today)).toHaveLength(3);
  });

  test('does not mutate the input array', () => {
    const copy = [...data];
    searchExpenses(data, spentOn('haircut'), 'all', today);
    expect(data).toEqual(copy);
  });
});

test.describe('expenseSearch — date helpers', () => {
  test('formatResultDate renders dd MMM yy', () => {
    expect(formatResultDate('2026-04-12')).toBe('12 Apr 26');
    expect(formatResultDate('2025-02-09')).toBe('09 Feb 25');
  });

  test('dateKeyToDate returns the same local calendar day', () => {
    const d = dateKeyToDate('2026-04-12');
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 3, 12]);
  });
});
