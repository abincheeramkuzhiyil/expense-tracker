import { AppSettings, SmsParserRule } from '@/types/expense.types';

const SETTINGS_KEY = 'appSettings';

/** Built-in parser rules for common Indian banks. Cannot be edited or deleted. */
export const BUILT_IN_PARSER_RULES: SmsParserRule[] = [
  {
    id: 'builtin-hdfc',
    bankName: 'HDFC Bank',
    amountKeyword: 'INR',
    merchantKeyword: 'to ',
    builtIn: true,
  },
  {
    id: 'builtin-icici',
    bankName: 'ICICI Bank',
    amountKeyword: 'Rs',
    merchantKeyword: 'to ',
    builtIn: true,
  },
  {
    id: 'builtin-sbi',
    bankName: 'SBI',
    amountKeyword: 'Rs.',
    merchantKeyword: 'at ',
    builtIn: true,
  },
  {
    id: 'builtin-axis',
    bankName: 'Axis Bank',
    amountKeyword: 'INR',
    merchantKeyword: 'at ',
    builtIn: true,
  },
];

const DEFAULT_SETTINGS: AppSettings = {
  parserRules: BUILT_IN_PARSER_RULES,
  notificationEnabled: false,
  notificationTime: '21:00',
};

/**
 * Reads app settings from localStorage. Returns defaults when missing or invalid.
 *
 * Built-in rules are always re-injected from source so they stay current.
 * If a user has saved an override for a built-in rule (a rule with `overrideOf` set
 * matching the built-in's `id`), that override is substituted in place of the
 * original built-in. Pure custom rules (no `overrideOf`) are appended after the
 * resolved built-in list.
 */
export function getSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const appSettingsParsed = JSON.parse(raw) as Partial<AppSettings>;
    const storedUserRules = (appSettingsParsed.parserRules ?? []).filter((r) => !r.builtIn);

    // Build a map of builtInId → override rule for quick substitution.
    const overrideMap = new Map<string, SmsParserRule>();
    for (const rule of storedUserRules) {
      if (rule.overrideOf) overrideMap.set(rule.overrideOf, rule);
    }

    // Resolve each built-in: use the user's override if one exists, otherwise the original.
    const resolvedBuiltIns = BUILT_IN_PARSER_RULES.map(
      (builtIn) => overrideMap.get(builtIn.id) ?? builtIn
    );

    // Custom rules are those with no overrideOf (i.e. not shadowing any built-in).
    const customRules = storedUserRules.filter((r) => !r.overrideOf);

    return {
      parserRules: [...resolvedBuiltIns, ...customRules],
      notificationEnabled: appSettingsParsed.notificationEnabled ?? DEFAULT_SETTINGS.notificationEnabled,
      notificationTime: appSettingsParsed.notificationTime ?? DEFAULT_SETTINGS.notificationTime,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/**
 * Persists app settings to localStorage.
 * Rules with `builtIn: true` are stripped before saving since they are always
 * re-injected from source on read. Override rules (`builtIn: false`, `overrideOf` set)
 * are intentionally kept — they represent user customizations of built-in rules.
 */
export function saveSettings(settings: AppSettings): void {
  if (typeof window === 'undefined') return;
  try {
    const toStore: AppSettings = {
      ...settings,
      parserRules: settings.parserRules.filter((r) => !r.builtIn),
    };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(toStore));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}
