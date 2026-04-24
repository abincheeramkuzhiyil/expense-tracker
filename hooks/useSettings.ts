'use client';

import { useCallback, useEffect, useState } from 'react';
import { AppSettings } from '@/types/expense.types';
import { getSettings, saveSettings } from '@/utils/settingsStorage';

interface UseSettingsResult {
  settings: AppSettings;
  updateSettings: (updater: (prev: AppSettings) => AppSettings) => void;
  isLoaded: boolean;
}

/**
 * React hook providing access to app settings with persistence.
 *
 * - Reads from localStorage once on mount (avoiding SSR / hydration mismatch).
 * - `isLoaded` is false until the read completes — components should show
 *   a skeleton while it is false to avoid flashing default values.
 * - `updateSettings` accepts an updater function and persists the result.
 */
export function useSettings(): UseSettingsResult {
  const [settings, setSettings] = useState<AppSettings>(() => getSettings());
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setSettings(getSettings());
    setIsLoaded(true);
  }, []);

  const updateSettings = useCallback(
    (updater: (prev: AppSettings) => AppSettings) => {
      setSettings((prev) => {
        const next = updater(prev);
        saveSettings(next);
        // Re-normalize from storage so built-in rules are always correctly
        // resolved (overrides substituted in, originals re-injected on restore).
        return getSettings();
      });
    },
    []
  );

  return { settings, updateSettings, isLoaded };
}
