import { AppSettings, SmsParserRule } from '@/types/expense.types';

const SETTINGS_KEY = 'appSettings';

/** Built-in parser rules for common Indian banks. Cannot be edited or deleted. */
export const BUILT_IN_PARSER_RULES: SmsParserRule[] = [
  {
    id: 'builtin-hdfc',
    bankName: 'HDFC Bank',
    amountKeyword: 'INR',
    merchantKeyword: 'at ',
    currency: '₹',
    builtIn: true,
  },
  {
    id: 'builtin-icici',
    bankName: 'ICICI Bank',
    amountKeyword: 'Rs',
    merchantKeyword: 'to ',
    currency: '₹',
    builtIn: true,
  },
  {
    id: 'builtin-sbi',
    bankName: 'SBI',
    amountKeyword: 'Rs.',
    merchantKeyword: 'at ',
    currency: '₹',
    builtIn: true,
  },
  {
    id: 'builtin-axis',
    bankName: 'Axis Bank',
    amountKeyword: 'INR',
    merchantKeyword: 'at ',
    currency: '₹',
    builtIn: true,
  },
];

const DEFAULT_SETTINGS: AppSettings = {
  parserRules: BUILT_IN_PARSER_RULES,
  notificationEnabled: false,
  notificationTime: '21:00',
};

/** Reads app settings from localStorage. Returns defaults when missing or invalid. */
export function getSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    // Merge with defaults to ensure all fields exist; always re-inject built-in rules
    // so that they stay up to date even if the user previously saved an older snapshot.
    const userRules = (parsed.parserRules ?? []).filter((r) => !r.builtIn);
    return {
      parserRules: [...BUILT_IN_PARSER_RULES, ...userRules],
      notificationEnabled: parsed.notificationEnabled ?? DEFAULT_SETTINGS.notificationEnabled,
      notificationTime: parsed.notificationTime ?? DEFAULT_SETTINGS.notificationTime,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/** Persists app settings. Built-in rules are stripped before saving. */
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
