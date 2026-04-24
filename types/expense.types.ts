export type ExpenseSource = 'manual' | 'sms';

/** Approval status for an expense.
 *  - 'approved' = visible in lists and totals (default for manual entries)
 *  - 'pending'  = parsed from SMS, awaiting user review
 */
export type ExpenseStatus = 'pending' | 'approved';

export interface Expense {
  id: string;
  amount: number;
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
  category: string;
  date: string;        // "YYYY-MM-DD"
  description: string;
  source: ExpenseSource;
  /** Optional for backward compatibility — missing = 'approved' */
  status?: ExpenseStatus;
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

/** App-wide settings persisted in localStorage. */
export interface AppSettings {
  parserRules: SmsParserRule[];
  notificationEnabled: boolean;
  /** 24-hour HH:mm */
  notificationTime: string;
}
