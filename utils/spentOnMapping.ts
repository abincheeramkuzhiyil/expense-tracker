const STORAGE_KEY = 'spentOnCategoryMapping';

/** Maps a specific Spent On value (lowercase key) to its Category group. */
const DEFAULT_MAPPING: Record<string, string> = {
  // Food
  breakfast: 'Food',
  lunch: 'Food',
  dinner: 'Food',
  snacks: 'Food',
  coffee: 'Food',
  // Travel
  fuel: 'Travel',
  taxi: 'Travel',
  bus: 'Travel',
  auto: 'Travel',
  metro: 'Travel',
  train: 'Travel',
  flight: 'Travel',
  // Bills
  electricity: 'Bills',
  water: 'Bills',
  internet: 'Bills',
  phone: 'Bills',
  rent: 'Bills',
  // Entertainment
  movie: 'Entertainment',
  netflix: 'Entertainment',
  concert: 'Entertainment',
  games: 'Entertainment',
  // Healthcare
  medicine: 'Healthcare',
  doctor: 'Healthcare',
  hospital: 'Healthcare',
  lab: 'Healthcare',
  // Education
  books: 'Education',
  course: 'Education',
  tuition: 'Education',
  // Shopping
  amazon: 'Shopping',
  flipkart: 'Shopping',
  clothes: 'Shopping',
  shoes: 'Shopping',
  // Other
  others: 'Other',
};

/**
 * Reads the Spent On → Category mapping from localStorage.
 * Falls back to DEFAULT_MAPPING if nothing is stored yet.
 * The stored mapping is merged over the defaults so built-in defaults always
 * remain available even before the user has added any expenses.
 */
export function getSpentOnMapping(): Record<string, string> {
  if (typeof window === 'undefined') return { ...DEFAULT_MAPPING };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_MAPPING };
    const stored: Record<string, string> = JSON.parse(raw);
    // Merge: stored values win over defaults
    return { ...DEFAULT_MAPPING, ...stored };
  } catch {
    return { ...DEFAULT_MAPPING };
  }
}

/** Persists the full mapping to localStorage. */
export function saveSpentOnMapping(mapping: Record<string, string>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mapping));
  } catch {
    // ignore write errors
  }
}

/**
 * Case-insensitive lookup.
 * Returns the Category group for a given Spent On value, or `null` if unknown.
 */
export function resolveCategory(spentOn: string): string | null {
  if (!spentOn.trim()) return null;
  const mapping = getSpentOnMapping();
  return mapping[spentOn.trim().toLowerCase()] ?? null;
}

/**
 * Saves or updates a single Spent On → Category entry.
 * The key is stored in lowercase for consistent case-insensitive lookup.
 */
export function setSpentOnCategory(spentOn: string, category: string): void {
  const trimmedSpentOn = spentOn.trim();
  const trimmedCategory = category.trim();
  if (!trimmedSpentOn || !trimmedCategory) return;
  const mapping = getSpentOnMapping();
  mapping[trimmedSpentOn.toLowerCase()] = trimmedCategory;
  saveSpentOnMapping(mapping);
}

/**
 * Returns all known Spent On labels (title-cased) sorted alphabetically.
 * Used as Autocomplete options for the "Spent On" field.
 */
export function getSpentOnSuggestions(): string[] {
  const mapping = getSpentOnMapping();
  return Object.keys(mapping)
    .map((key) => key.charAt(0).toUpperCase() + key.slice(1))
    .sort((a, b) => a.localeCompare(b));
}
