'use client';

import { useCallback, useEffect, useState } from 'react';
import { MerchantRule } from '@/types/expense.types';
import { getMerchantRules, saveMerchantRules } from '@/utils/merchantMapping';

interface UseMerchantRulesResult {
  rules: MerchantRule[];
  updateRules: (updater: (prev: MerchantRule[]) => MerchantRule[]) => void;
  isLoaded: boolean;
}

/**
 * React hook for merchant classification rules with persistence.
 * Mirrors `useSettings`: reads once on mount to avoid hydration mismatch, and
 * re-normalizes from storage after each update so built-ins resolve correctly.
 */
export function useMerchantRules(): UseMerchantRulesResult {
  const [rules, setRules] = useState<MerchantRule[]>(() => getMerchantRules());
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setRules(getMerchantRules());
    setIsLoaded(true);
  }, []);

  const updateRules = useCallback(
    (updater: (prev: MerchantRule[]) => MerchantRule[]) => {
      setRules((prev) => {
        const next = updater(prev);
        saveMerchantRules(next);
        return getMerchantRules();
      });
    },
    []
  );

  return { rules, updateRules, isLoaded };
}
