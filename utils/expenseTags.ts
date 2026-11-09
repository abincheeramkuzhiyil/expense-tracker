const TAGS_KEY = 'expenseTags';
const RECENT_TAGS_KEY = 'expenseTagsRecent';

export const MAX_TAG_LENGTH = 30;
export const MAX_TAGS_PER_EXPENSE = 10;
export const MAX_RECENT_TAGS = 5;

/** Trims a tag and collapses inner whitespace. */
export function normalizeTag(tag: string): string {
  return tag.trim().replace(/\s+/g, ' ');
}

function sameTag(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

/** Returns the entry of `list` matching `tag` case-insensitively, or `undefined`. */
export function findTag(list: string[], tag: string): string | undefined {
  const normalized = normalizeTag(tag);
  return list.find((t) => sameTag(t, normalized));
}

function uniqueValidTags(tags: string[] | undefined): string[] {
  const result: string[] = [];
  for (const raw of tags ?? []) {
    const tag = normalizeTag(raw);
    if (!tag || tag.length > MAX_TAG_LENGTH || findTag(result, tag)) continue;
    result.push(tag);
  }
  return result;
}

/**
 * Normalizes the tags of a single expense: trims, collapses whitespace, drops empty and over-long
 * entries, removes case-insensitive duplicates (first spelling wins) and caps at MAX_TAGS_PER_EXPENSE.
 */
export function normalizeTagList(tags: string[] | undefined): string[] {
  return uniqueValidTags(tags).slice(0, MAX_TAGS_PER_EXPENSE);
}

function readList(key: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

function writeList(key: string, list: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch {
    // ignore write errors
  }
}

/** All known tags, sorted alphabetically (case-insensitive). */
export function getTags(): string[] {
  return readList(TAGS_KEY).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
}

/** Persists the full tag master list. */
export function saveTags(tags: string[]): void {
  writeList(TAGS_KEY, tags);
}

/** Adds any tags not yet in the master list (case-insensitive). */
export function addNewTags(tags: string[]): void {
  const incoming = uniqueValidTags(tags);
  if (incoming.length === 0) return;
  const existing = readList(TAGS_KEY);
  const added = incoming.filter((t) => !findTag(existing, t));
  if (added.length > 0) saveTags([...existing, ...added]);
}

/** Most recently used tags, newest first. */
export function getRecentTags(): string[] {
  return readList(RECENT_TAGS_KEY).slice(0, MAX_RECENT_TAGS);
}

/** Persists the recently used tag list. */
export function saveRecentTags(tags: string[]): void {
  writeList(RECENT_TAGS_KEY, tags.slice(0, MAX_RECENT_TAGS));
}

/** Moves the given tags to the front of the recently-used list. */
export function recordRecentTags(tags: string[]): void {
  const used = normalizeTagList(tags);
  if (used.length === 0) return;
  const rest = readList(RECENT_TAGS_KEY).filter((t) => !findTag(used, t));
  saveRecentTags([...used, ...rest]);
}

/** Records tags used by a saved expense: adds new ones to the master list and bumps recents. */
export function recordTagsUsed(tags: string[] | undefined): void {
  const list = normalizeTagList(tags);
  if (list.length === 0) return;
  addNewTags(list);
  recordRecentTags(list);
}

/** Returns an error message when `tag` cannot be added to `selected`, otherwise `null`. */
export function validateNewTag(tag: string, selected: string[]): string | null {
  const normalized = normalizeTag(tag);
  if (!normalized) return null;
  if (findTag(selected, normalized)) return null;
  if (normalized.length > MAX_TAG_LENGTH) {
    return `A tag can be at most ${MAX_TAG_LENGTH} characters.`;
  }
  if (selected.length >= MAX_TAGS_PER_EXPENSE) {
    return `You can add up to ${MAX_TAGS_PER_EXPENSE} tags to an expense.`;
  }
  return null;
}
