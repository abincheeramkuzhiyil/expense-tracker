import { test, expect } from '@playwright/test';
import {
  buildTagIndex,
  filterByTags,
  suggestTags,
  sumAmounts,
} from '../utils/expenseSearch';
import type { StoredExpense } from '../types/expense.types';

// Logic-only specs: no browser or page is used, so these run in Node.

let seq = 0;
function exp(partial: Partial<StoredExpense> & Pick<StoredExpense, 'date'>): StoredExpense {
  seq += 1;
  return {
    id: `id-${seq}`,
    amount: 100,
    spentOn: 'Item',
    category: 'Other',
    description: '',
    source: 'manual',
    createdAt: `2026-01-01T00:00:${String(seq % 60).padStart(2, '0')}.000Z`,
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...partial,
  };
}

const today = new Date(2026, 10, 9);

test.describe('tag filter — buildTagIndex', () => {
  test('lists used tags alphabetically with usage counts', () => {
    const rows = [
      exp({ date: '2026-01-01', tags: ['Zoo', 'Trip'] }),
      exp({ date: '2026-01-02', tags: ['Trip'] }),
      exp({ date: '2026-01-03', tags: ['alpha'] }),
      exp({ date: '2026-01-04' }),
    ];
    expect(buildTagIndex(rows)).toEqual([
      { label: 'alpha', count: 1 },
      { label: 'Trip', count: 2 },
      { label: 'Zoo', count: 1 },
    ]);
  });

  test('merges case variants using the most common casing', () => {
    const rows = [
      exp({ date: '2026-01-01', tags: ['trip'] }),
      exp({ date: '2026-01-02', tags: ['Trip'] }),
      exp({ date: '2026-01-03', tags: ['Trip'] }),
    ];
    expect(buildTagIndex(rows)).toEqual([{ label: 'Trip', count: 3 }]);
  });

  test('counts an expense once per tag', () => {
    const rows = [exp({ date: '2026-01-01', tags: ['Trip', 'trip'] })];
    expect(buildTagIndex(rows)).toEqual([{ label: 'Trip', count: 1 }]);
  });

  test('returns an empty list when no expense has tags', () => {
    expect(buildTagIndex([exp({ date: '2026-01-01' }), exp({ date: '2026-01-02', tags: [] })])).toEqual([]);
  });
});

test.describe('tag filter — suggestTags', () => {
  const index = [
    { label: 'Gifts', count: 2 },
    { label: 'Kids School', count: 5 },
    { label: 'Trip', count: 3 },
    { label: 'Wedding Travel', count: 4 },
  ];

  test('returns everything alphabetically for an empty query', () => {
    expect(suggestTags(index, '').map((t) => t.label)).toEqual(['Gifts', 'Kids School', 'Trip', 'Wedding Travel']);
  });

  test('filters by substring, ignoring case', () => {
    expect(suggestTags(index, 'TR').map((t) => t.label)).toEqual(['Trip', 'Wedding Travel']);
    expect(suggestTags(index, 'school').map((t) => t.label)).toEqual(['Kids School']);
  });

  test('omits tags that are already selected', () => {
    expect(suggestTags(index, '', ['trip']).map((t) => t.label)).toEqual(['Gifts', 'Kids School', 'Wedding Travel']);
  });

  test('returns nothing when no tag matches', () => {
    expect(suggestTags(index, 'zzz')).toEqual([]);
  });
});

test.describe('tag filter — filterByTags', () => {
  const rows = [
    exp({ id: 'a', date: '2026-03-10', tags: ['Wedding', 'Travel'] }),
    exp({ id: 'b', date: '2026-03-12', tags: ['Wedding'] }),
    exp({ id: 'c', date: '2026-03-11', tags: ['Travel', 'Wedding', 'Gifts'] }),
    exp({ id: 'd', date: '2026-03-13' }),
    exp({ id: 'e', date: '2026-03-14', tags: ['Gifts'] }),
  ];

  test('returns nothing when no tags are selected', () => {
    expect(filterByTags(rows, [], 'all', today)).toEqual([]);
    expect(filterByTags(rows, ['  '], 'all', today)).toEqual([]);
  });

  test('matches a single tag, newest first', () => {
    expect(filterByTags(rows, ['wedding'], 'all', today).map((e) => e.id)).toEqual(['b', 'c', 'a']);
  });

  test('requires ALL selected tags (AND)', () => {
    expect(filterByTags(rows, ['Wedding', 'Travel'], 'all', today).map((e) => e.id)).toEqual(['c', 'a']);
    expect(filterByTags(rows, ['Wedding', 'Travel', 'Gifts'], 'all', today).map((e) => e.id)).toEqual(['c']);
  });

  test('ignores duplicate selections and casing', () => {
    expect(filterByTags(rows, ['Gifts', 'gifts'], 'all', today).map((e) => e.id)).toEqual(['e', 'c']);
  });

  test('returns nothing when no expense has every tag', () => {
    expect(filterByTags(rows, ['Gifts', 'Nope'], 'all', today)).toEqual([]);
  });

  test('applies the date range', () => {
    const dated = [
      exp({ id: 'old', date: '2025-01-01', tags: ['Trip'] }),
      exp({ id: 'new', date: '2026-10-01', tags: ['Trip'] }),
    ];
    expect(filterByTags(dated, ['Trip'], '3m', today).map((e) => e.id)).toEqual(['new']);
    expect(filterByTags(dated, ['Trip'], 'all', today).map((e) => e.id)).toEqual(['new', 'old']);
  });

  test('does not mutate the input array', () => {
    const copy = [...rows];
    filterByTags(rows, ['Wedding'], 'all', today);
    expect(rows).toEqual(copy);
  });
});

test.describe('tag filter — sumAmounts', () => {
  test('adds amounts without floating-point drift', () => {
    const rows = [0.1, 0.2, 0.3].map((amount) => exp({ date: '2026-01-01', amount }));
    expect(sumAmounts(rows)).toBe(0.6);
  });

  test('is zero for no expenses', () => {
    expect(sumAmounts([])).toBe(0);
  });
});
