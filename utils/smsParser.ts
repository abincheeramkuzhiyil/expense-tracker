import { ParsedSmsResult, SmsParserRule } from '@/types/expense.types';

/**
 * Extracts a numeric amount that immediately follows the given keyword.
 * Handles common formats like "INR 1,250.00", "Rs. 320", "$45.99".
 */
function extractAmount(text: string, keyword: string): number | undefined {
  if (!keyword) return undefined;
  // Escape regex special chars in the keyword
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`${escaped}\\s*([0-9][0-9,]*(?:\\.[0-9]{1,2})?)`, 'i');
  const match = text.match(re);
  if (!match) return undefined;
  const numeric = match[1].replace(/,/g, '');
  const value = parseFloat(numeric);
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

/**
 * Extracts the merchant name that follows the given keyword.
 * Stops at common terminators: period, comma, semicolon, " on ", " for ", line break.
 */
function extractMerchant(text: string, keyword: string): string | undefined {
  if (!keyword) return undefined;
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Match keyword followed by a merchant name (up to the next terminator)
  const re = new RegExp(`${escaped}\\s*([A-Z0-9][A-Z0-9 _\\-&.]*?)(?=[.,;]|\\s+on\\s+|\\s+for\\s+|\\s+Avl|\\s+Bal|\\s+UPI|\\n|$)`, 'i');
  const match = text.match(re);
  if (!match) return undefined;
  const merchant = match[1].trim();
  return merchant.length > 0 ? merchant : undefined;
}

/**
 * Extracts a date in DD-MMM-YY/YYYY or DD/MM/YYYY format and returns YYYY-MM-DD.
 * Returns today if no date is found in the SMS.
 */
function extractDate(text: string): string {
  // Try DD-MMM-YY or DD-MMM-YYYY (e.g., "21-Apr-26", "21-Apr-2026")
  const monthMap: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
  };
  const m1 = text.match(/(\d{1,2})[-\s]([A-Za-z]{3})[-\s](\d{2,4})/);
  if (m1) {
    const day = m1[1].padStart(2, '0');
    const month = monthMap[m1[2].toLowerCase()];
    if (month) {
      let year = m1[3];
      if (year.length === 2) year = `20${year}`;
      return `${year}-${month}-${day}`;
    }
  }
  // Try DD/MM/YYYY or DD-MM-YYYY
  const m2 = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (m2) {
    const day = m2[1].padStart(2, '0');
    const month = m2[2].padStart(2, '0');
    let year = m2[3];
    if (year.length === 2) year = `20${year}`;
    return `${year}-${month}-${day}`;
  }
  // Fallback: today
  const today = new Date();
  const y = today.getFullYear();
  const mo = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  return `${y}-${mo}-${d}`;
}

/**
 * Tries to extract amount + merchant + date using a single rule.
 * Returns a result only if at least the amount could be extracted.
 */
export function testParserRule(smsText: string, rule: SmsParserRule): ParsedSmsResult | null {
  if (!smsText || !smsText.trim()) return null;
  const amount = extractAmount(smsText, rule.amountKeyword);
  if (amount === undefined) return null;
  const description = extractMerchant(smsText, rule.merchantKeyword);
  const date = extractDate(smsText);
  return {
    amount,
    description,
    date,
    matchedRuleId: rule.id,
  };
}

/**
 * Tries all rules and returns the best match, or null if no rule extracts an amount.
 *
 * Scoring (higher = better):
 *   2 — amount + description both extracted  → perfect match, loop exits early
 *   1 — amount only (description missing)
 *
 * Date is excluded from scoring because extractDate() always returns a value
 * (falling back to today), making it a non-discriminator between rules.
 */
export function parseSms(text: string, rules: SmsParserRule[]): ParsedSmsResult | null {
  if (!text || !text.trim()) return null;
  let bestResult: ParsedSmsResult | null = null;
  let bestScore = 0;
  for (const rule of rules) {
    const result = testParserRule(text, rule);
    if (!result) continue;
    const score = result.description ? 2 : 1;
    if (score > bestScore) {
      bestResult = result;
      bestScore = score;
    }
    if (bestScore === 2) break; // amount + merchant found — no need to check more rules
  }
  return bestResult;
}
