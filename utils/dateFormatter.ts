/**
 * Date formatting utilities for the Expense Tracker application.
 * Handles conversion between Date objects and ISO date strings without timezone shifts.
 */

/**
 * Formats a Date object to "YYYY-MM-DD" string without timezone shifting.
 * 
 * @param date The Date object to format
 * @returns A date string in "YYYY-MM-DD" format suitable for HTML date inputs
 * 
 * @example
 * formatDateForInput(new Date(2026, 3, 15)) // "2026-04-15"
 */
export function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
