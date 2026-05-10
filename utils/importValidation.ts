/** Keys that can appear in an import JSON file. */
export const VALID_FIXED_KEYS = [
  'expenseCategories',
  'expensesPending',
  'expenseYearIndex',
  'appSettings',
  'userPreferences',
  'spentOnCategoryMapping',
] as const;

const VALID_FIXED_KEY_SET = new Set<string>(VALID_FIXED_KEYS);

/** Returns true if the key is a 4-digit year string, e.g. "2025". */
export function isValidYearKey(key: string): boolean {
  return /^\d{4}$/.test(key);
}

/** Returns true if the key is a valid importable localStorage key. */
export function isValidImportKey(key: string): boolean {
  return VALID_FIXED_KEY_SET.has(key) || isValidYearKey(key);
}

/**
 * Validates the shape of a value for a given import key.
 * Returns null when valid, or an error message string when invalid.
 */
export function validateKeyShape(key: string, value: unknown): string | null {
  if (key === 'expenseCategories') {
    if (!Array.isArray(value)) return 'must be an array of strings';
    const bad = value.findIndex((v) => typeof v !== 'string');
    if (bad !== -1) return `item at index ${bad} is not a string`;
    return null;
  }

  if (key === 'expenseYearIndex') {
    if (!Array.isArray(value)) return 'must be an array of year strings';
    const bad = value.findIndex((v) => typeof v !== 'string');
    if (bad !== -1) return `item at index ${bad} is not a string`;
    return null;
  }

  if (key === 'expensesPending') {
    if (!Array.isArray(value)) return 'must be an array of pending expense objects';
    const REQUIRED = ['id', 'amount', 'spentOn', 'category', 'date', 'source', 'createdAt', 'updatedAt'];
    for (let i = 0; i < value.length; i++) {
      const item = value[i];
      if (typeof item !== 'object' || item === null || Array.isArray(item)) {
        return `item at index ${i} is not an object`;
      }
      for (const field of REQUIRED) {
        if (!(field in (item as Record<string, unknown>))) {
          return `item at index ${i} is missing required field "${field}"`;
        }
      }
      if (typeof (item as Record<string, unknown>).amount !== 'number') {
        return `item at index ${i}: "amount" must be a number`;
      }
    }
    return null;
  }

  if (key === 'appSettings') {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return 'must be an object';
    }
    const obj = value as Record<string, unknown>;
    if (!Array.isArray(obj.parserRules)) return '"parserRules" must be an array';
    if (typeof obj.notificationEnabled !== 'boolean') return '"notificationEnabled" must be a boolean';
    if (typeof obj.notificationTime !== 'string' || !/^\d{2}:\d{2}$/.test(obj.notificationTime as string)) {
      return '"notificationTime" must be a string in HH:mm format';
    }
    return null;
  }

  if (key === 'userPreferences') {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return 'must be an object';
    }
    const obj = value as Record<string, unknown>;
    if (obj.bottomSheetMode !== 'minimized' && obj.bottomSheetMode !== 'maximized') {
      return '"bottomSheetMode" must be "minimized" or "maximized"';
    }
    return null;
  }

  if (key === 'spentOnCategoryMapping') {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return 'must be an object with string keys and string values';
    }
    const obj = value as Record<string, unknown>;
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v !== 'string') return `value for key "${k}" must be a string`;
    }
    return null;
  }

  if (isValidYearKey(key)) {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return 'must be an object with month keys ("1"–"12") mapping to arrays of expense objects';
    }
    const obj = value as Record<string, unknown>;
    const REQUIRED = ['id', 'amount', 'spentOn', 'category', 'date', 'source', 'createdAt', 'updatedAt'];
    for (const [monthKey, monthExpenses] of Object.entries(obj)) {
      if (!Array.isArray(monthExpenses)) {
        return `month key "${monthKey}" must be an array of expense objects`;
      }
      for (let i = 0; i < monthExpenses.length; i++) {
        const item = monthExpenses[i];
        if (typeof item !== 'object' || item === null || Array.isArray(item)) {
          return `month "${monthKey}", item at index ${i} is not an object`;
        }
        for (const field of REQUIRED) {
          if (!(field in (item as Record<string, unknown>))) {
            return `month "${monthKey}", item at index ${i} is missing required field "${field}"`;
          }
        }
        if (typeof (item as Record<string, unknown>).amount !== 'number') {
          return `month "${monthKey}", item at index ${i}: "amount" must be a number`;
        }
      }
    }
    return null;
  }

  return null;
}
