import { test, expect } from '@playwright/test';
import {
  NO_TAG,
  buildCategoryFacets,
  buildTagFacets,
  filterByCategory,
  filterByFacetTags,
  formatTagCaption,
  matchesKeyword,
} from '../utils/expenseSearch';
import type { StoredExpense } from '../types/expense.types';

// Logic-only specs: no browser or page is used, so these run in Node.

let seq = 0;
function exp(partial: Partial<StoredExpense> = {}): StoredExpense {
  seq += 1;
  return {
    id: `id-${seq}`,
    amount: 100,
    spentOn: 'Haircut',
    category: 'Personal Care',
    date: '2026-03-10',
    description: '',
    source: 'manual',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...partial,
  };
}

// Haircut example: 12 own (untagged), 4 for Son, 1 for Son + Birthday
const results = [
  ...Array.from({ length: 12 }, () => exp()),
  ...Array.from({ length: 4 }, () => exp({ tags: ['Son'] })),
  exp({ tags: ['Son', 'Birthday'] }),
];

test.describe('narrowing chips — buildTagFacets', () => {
  test('lists chips by count, including No tag', () => {
    const { selected, options } = buildTagFacets(results, []);
    expect(selected).toEqual([]);
    expect(options).toEqual([
      { key: NO_TAG, label: 'No tag', count: 12 },
      { key: 'Son', label: 'Son', count: 5 },
      { key: 'Birthday', label: 'Birthday', count: 1 },
    ]);
  });

  test('is empty when no result has a tag', () => {
    expect(buildTagFacets([exp(), exp()], [])).toEqual({ selected: [], options: [] });
    expect(buildTagFacets([], [])).toEqual({ selected: [], options: [] });
  });

  test('breaks count ties alphabetically', () => {
    const rows = [exp({ tags: ['Zoo'] }), exp({ tags: ['Alpha'] })];
    expect(buildTagFacets(rows, []).options.map((o) => o.label)).toEqual(['Alpha', 'Zoo']);
  });

  test('counts after selecting a tag are what tapping would return, and No tag disappears', () => {
    const { selected, options } = buildTagFacets(results, ['Son']);
    expect(selected).toEqual([{ key: 'Son', label: 'Son', count: 5 }]);
    expect(options).toEqual([{ key: 'Birthday', label: 'Birthday', count: 1 }]);
  });

  test('selecting several tags narrows with AND', () => {
    const { selected, options } = buildTagFacets(results, ['Son', 'Birthday']);
    expect(selected.map((c) => c.count)).toEqual([1, 1]);
    expect(options).toEqual([]);
  });

  test('No tag is exclusive: real tags disappear while it is selected', () => {
    const { selected, options } = buildTagFacets(results, [NO_TAG]);
    expect(selected).toEqual([{ key: NO_TAG, label: 'No tag', count: 12 }]);
    expect(options).toEqual([]);
  });

  test('merges tag case variants and keeps the most common casing', () => {
    const rows = [exp({ tags: ['son'] }), exp({ tags: ['Son'] }), exp({ tags: ['Son'] })];
    expect(buildTagFacets(rows, []).options).toEqual([{ key: 'Son', label: 'Son', count: 3 }]);
    expect(buildTagFacets(rows, ['SON']).selected[0].label).toBe('Son');
  });
});

test.describe('narrowing chips — filterByFacetTags', () => {
  test('keeps everything when nothing is selected', () => {
    expect(filterByFacetTags(results, [])).toHaveLength(17);
  });

  test('matches a tag ignoring case', () => {
    expect(filterByFacetTags(results, ['son'])).toHaveLength(5);
  });

  test('requires all selected tags', () => {
    expect(filterByFacetTags(results, ['Son', 'Birthday'])).toHaveLength(1);
  });

  test('NO_TAG returns untagged expenses only', () => {
    expect(filterByFacetTags(results, [NO_TAG])).toHaveLength(12);
  });

  test('NO_TAG combined with a tag matches nothing', () => {
    expect(filterByFacetTags(results, [NO_TAG, 'Son'])).toEqual([]);
  });
});

test.describe('narrowing chips — buildCategoryFacets / filterByCategory', () => {
  const rows = [
    exp({ category: 'Travel', amount: 4200 }),
    exp({ category: 'travel', amount: 6000 }),
    exp({ category: 'Travel', amount: 6000 }),
    exp({ category: 'Gifts', amount: 900 }),
    exp({ category: 'Stay', amount: 12000 }),
  ];

  test('totals per category, highest amount first, merging case variants', () => {
    expect(buildCategoryFacets(rows)).toEqual([
      { label: 'Travel', count: 3, amount: 16200 },
      { label: 'Stay', count: 1, amount: 12000 },
      { label: 'Gifts', count: 1, amount: 900 },
    ]);
  });

  test('is empty for no results', () => {
    expect(buildCategoryFacets([])).toEqual([]);
  });

  test('filters by category ignoring case; null keeps everything', () => {
    expect(filterByCategory(rows, 'TRAVEL')).toHaveLength(3);
    expect(filterByCategory(rows, null)).toHaveLength(5);
    expect(filterByCategory(rows, 'Nope')).toEqual([]);
  });
});

test.describe('narrowing chips — matchesKeyword / formatTagCaption', () => {
  test('matches words across Spent On, Category and Description', () => {
    const e = exp({ spentOn: 'Dress', category: 'Shopping', description: 'Birthday party' });
    expect(matchesKeyword(e, 'dress party')).toBe(true);
    expect(matchesKeyword(e, 'shopping birthday')).toBe(true);
    expect(matchesKeyword(e, 'dress nope')).toBe(false);
  });

  test('an empty keyword matches everything', () => {
    expect(matchesKeyword(exp(), '   ')).toBe(true);
  });

  test('formats the caption with at most two tags then +N', () => {
    expect(formatTagCaption(undefined)).toBe('');
    expect(formatTagCaption([])).toBe('');
    expect(formatTagCaption(['Son'])).toBe('Son');
    expect(formatTagCaption(['Son', 'Gifts'])).toBe('Son · Gifts');
    expect(formatTagCaption(['Son', 'Gifts', 'Party', 'Kids'])).toBe('Son · Gifts +2');
  });
});
