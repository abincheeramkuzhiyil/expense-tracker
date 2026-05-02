'use client';

import { useCallback, useEffect, useState } from 'react';
import { UserPreferences } from '@/types/userPreferences.types';
import { getUserPreferences, updateUserPreference } from '@/utils/userPreferencesStorage';

interface UseUserPreferencesResult {
  preferences: UserPreferences;
  updatePreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
  isLoaded: boolean;
}

/**
 * React hook providing access to user preferences with localStorage persistence.
 *
 * - Reads from localStorage once on mount to avoid SSR/hydration mismatches.
 * - `isLoaded` is false until the initial read completes.
 * - `updatePreference` persists a single key change and updates local state.
 */
export function useUserPreferences(): UseUserPreferencesResult {
  const [preferences, setPreferences] = useState<UserPreferences>(() => getUserPreferences());
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setPreferences(getUserPreferences());
    setIsLoaded(true);
  }, []);

  const updatePreference = useCallback(
    <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
      updateUserPreference(key, value);
      setPreferences((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  return { preferences, updatePreference, isLoaded };
}
