export type ExpenseSource = 'manual' | 'sms';

/** Approval status for an expense.
 *  - 'approved' = visible in lists and totals (default for manual entries)
 *  - 'pending'  = parsed from SMS, awaiting user review
 */
export type ExpenseStatus = 'pending' | 'approved';

export interface Expense {
  id: string;
  amount: number;
  /** Specific item the money was spent on, e.g. "Breakfast", "Fuel" */
  spentOn: string;
  /** High-level group category, e.g. "Food", "Travel" */
  category: string;
  date: Date;
  description: string;
  source: ExpenseSource;
  status: ExpenseStatus;
  createdAt: Date;
  updatedAt: Date;
}

/** Expense as stored in localStorage — all dates are ISO strings */
export interface StoredExpense {
  id: string;
  amount: number;
  /** Specific item the money was spent on, e.g. "Breakfast", "Fuel" */
  spentOn: string;
  /** High-level group category, e.g. "Food", "Travel" */
  category: string;
  date: string;        // "YYYY-MM-DD"
  description: string;
  source: ExpenseSource;
  createdAt: string;   // ISO string
  updatedAt: string;   // ISO string
}

/**
 * A pending expense stored in the dedicated pending queue (localStorage key `expense-tracker-pending`).
 * No `status` field — presence in this bucket implies the expense is pending review.
 */
export interface PendingStoredExpense {
  id: string;
  amount: number;
  /** Specific item the money was spent on, e.g. "Breakfast", "Fuel" */
  spentOn: string;
  /** High-level group category, e.g. "Food", "Travel" */
  category: string;
  date: string;        // "YYYY-MM-DD"
  description: string;
  source: ExpenseSource;
  createdAt: string;   // ISO string
  updatedAt: string;   // ISO string
}

/** Keys are numeric month strings "1"–"12"; only months with data are present */
export interface StoredYear {
  [monthKey: string]: StoredExpense[];
}

export type ViewMode = 'day' | 'month' | 'year';

// ─── Settings & SMS Parser ────────────────────────────────────────────────────

/** A user-defined or built-in rule for parsing a bank SMS into expense fields. */
export interface SmsParserRule {
  id: string;
  bankName: string;
  /** Word/symbol that appears immediately before the amount, e.g. "INR", "Rs.", "$" */
  amountKeyword: string;
  /** Word that appears immediately before the merchant/description, e.g. "at ", "to " */
  merchantKeyword: string;
  /** True only for rules hardcoded in source (BUILT_IN_PARSER_RULES). Cannot be edited or deleted. */
  builtIn?: boolean;
  /**
   * When set, this user rule is a custom override for the built-in rule whose `id` matches this value.
   * `builtIn` remains `false` on override rules so they are persisted to localStorage.
   * At read time, `getSettings()` substitutes the built-in entry with this override.
   */
  overrideOf?: string;
}

/** Result of parsing an SMS — fields the parser was able to extract. */
export interface ParsedSmsResult {
  amount?: number;
  description?: string;
  date?: string; // YYYY-MM-DD
  /** Which rule matched */
  matchedRuleId?: string;
}

// ─── Merchant Classification Rules ────────────────────────────────────────────

/**
 * A configurable rule that classifies a shared SMS into a Category + Spent On
 * by matching merchant keyword(s) as a case-insensitive substring of the SMS text.
 */
export interface MerchantRule {
  id: string;
  /** Display name, e.g. "Food Delivery". */
  label: string;
  /** Case-insensitive substrings matched against the full SMS text (stored lowercase). */
  keywords: string[];
  /** Category to auto-fill; may be an existing or new category. */
  category: string;
  /** Optional Spent On value to auto-fill; often left blank since it varies per transaction. */
  spentOn?: string;
  /** When false, the rule is skipped during matching. Defaults to enabled. */
  enabled?: boolean;
  /** True only for rules hardcoded in source (BUILT_IN_MERCHANT_RULES). Cannot be deleted. */
  builtIn?: boolean;
  /** When set, this user rule overrides the built-in rule whose `id` matches this value. */
  overrideOf?: string;
}

/** Result of matching an SMS against the merchant rules (first match wins). */
export interface MerchantMatchResult {
  category: string;
  /** Present only when the matched rule defines a Spent On value. */
  spentOn?: string;
  matchedMerchantRuleId: string;
}

/** App-wide settings persisted in localStorage. */
export interface AppSettings {
  parserRules: SmsParserRule[];
  notificationEnabled: boolean;
  /** 24-hour HH:mm */
  notificationTime: string;
}
