import { MerchantMatchResult, MerchantRule } from '@/types/expense.types';

const STORAGE_KEY = 'merchantRules';

/**
 * Built-in merchant rules covering common Indian merchants. Cannot be deleted.
 * Order matters: matching is first-match-wins, so more specific rules
 * (e.g. groceries) are listed before generic ones (e.g. online shopping).
 * All keywords are lowercase — matching lowercases the SMS text before comparing.
 */
export const BUILT_IN_MERCHANT_RULES: MerchantRule[] = [
  {
    id: 'builtin-groceries',
    label: 'Groceries',
    keywords: ['amazon pay groceries', 'bigbasket', 'blinkit', 'instamart', 'zepto', 'dmart'],
    category: 'Grocery',
    spentOn: 'Groceries',
    builtIn: true,
  },
  {
    id: 'builtin-food-delivery',
    label: 'Food & Dining',
    keywords: ['zomato', 'swiggy', 'dominos', 'mcdonald', 'kfc'],
    category: 'Food',
    builtIn: true,
  },
  {
    id: 'builtin-rides',
    label: 'Rides & Taxi',
    keywords: ['uber', 'ola', 'rapido'],
    category: 'Travel',
    spentOn: 'Taxi',
    builtIn: true,
  },
  {
    id: 'builtin-fuel',
    label: 'Fuel',
    keywords: ['hpcl', 'bpcl', 'iocl', 'indianoil', 'petrol', 'fuel'],
    category: 'Travel',
    spentOn: 'Fuel',
    builtIn: true,
  },
  {
    id: 'builtin-online-shopping',
    label: 'Online Shopping',
    keywords: ['amazon', 'flipkart', 'myntra', 'ajio', 'meesho'],
    category: 'Shopping',
    spentOn: 'Shopping',
    builtIn: true,
  },
];

/**
 * Normalizes keyword input: trims, lowercases, drops blanks, and de-duplicates.
 * The same normalization is applied on read so matching is always case-insensitive.
 */
export function normalizeKeywords(keywords: string[]): string[] {
  return [...new Set(keywords.map((k) => k.trim().toLowerCase()).filter(Boolean))];
}

/**
 * Reads merchant rules from localStorage, following the same built-in + override
 * pattern as the SMS parser settings:
 *   - Built-ins are always re-injected from source so they stay current.
 *   - A stored user rule with `overrideOf` set replaces the matching built-in.
 *   - Pure custom rules (no `overrideOf`) are appended after the built-ins.
 */
export function getMerchantRules(): MerchantRule[] {
  if (typeof window === 'undefined') return BUILT_IN_MERCHANT_RULES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return BUILT_IN_MERCHANT_RULES;
    const stored = JSON.parse(raw) as MerchantRule[];
    const storedUserRules = (stored ?? []).filter((r) => !r.builtIn);

    const overrideMap = new Map<string, MerchantRule>();
    for (const rule of storedUserRules) {
      if (rule.overrideOf) overrideMap.set(rule.overrideOf, rule);
    }

    const resolvedBuiltIns = BUILT_IN_MERCHANT_RULES.map(
      (builtIn) => overrideMap.get(builtIn.id) ?? builtIn
    );
    const customRules = storedUserRules.filter((r) => !r.overrideOf);

    return [...resolvedBuiltIns, ...customRules];
  } catch {
    return BUILT_IN_MERCHANT_RULES;
  }
}

/**
 * Persists merchant rules. Rules with `builtIn: true` are stripped before saving
 * since they are always re-injected on read. Override rules (`overrideOf` set) are
 * kept — they represent user customizations of a built-in rule.
 */
export function saveMerchantRules(rules: MerchantRule[]): void {
  if (typeof window === 'undefined') return;
  try {
    const toStore = rules.filter((r) => !r.builtIn);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  } catch (error) {
    console.error('Failed to save merchant rules:', error);
  }
}

/**
 * Matches an SMS against the given rules and returns the first rule whose keyword
 * appears (case-insensitively) in the text. Returns `null` when nothing matches.
 */
export function matchMerchant(
  smsText: string,
  rules: MerchantRule[]
): MerchantMatchResult | null {
  if (!smsText || !smsText.trim()) return null;
  const text = smsText.toLowerCase();
  for (const rule of rules) {
    if (rule.enabled === false) continue;
    const hit = rule.keywords.some((k) => {
      const kw = k.trim().toLowerCase();
      return kw.length > 0 && text.includes(kw);
    });
    if (hit) {
      const spentOn = rule.spentOn?.trim();
      return {
        category: rule.category,
        matchedMerchantRuleId: rule.id,
        ...(spentOn ? { spentOn } : {}),
      };
    }
  }
  return null;
}
