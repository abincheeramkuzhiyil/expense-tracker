import { UserPreferences } from '@/types/userPreferences.types';

const STORAGE_KEY = 'userPreferences';

const DEFAULT_PREFERENCES: UserPreferences = {
  dialogDisplayMode: 'sheet',
};

/**
 * Reads user preferences from localStorage.
 * Returns defaults when the key is absent or the stored value is malformed.
 */
export function getUserPreferences(): UserPreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<UserPreferences>;
    return { ...DEFAULT_PREFERENCES, ...parsed };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Writes the full preferences object to localStorage.
 */
export function saveUserPreferences(prefs: UserPreferences): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // localStorage may be unavailable (private browsing quota, etc.) — fail silently.
  }
}

/**
 * Convenience helper: reads current preferences, merges a single key update,
 * and writes the result back to localStorage.
 */
export function updateUserPreference<K extends keyof UserPreferences>(
  key: K,
  value: UserPreferences[K]
): void {
  const current = getUserPreferences();
  saveUserPreferences({ ...current, [key]: value });
}
