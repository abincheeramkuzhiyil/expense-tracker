/**
 * Local-only notification scheduler.
 *
 * Uses `setTimeout` to fire a daily Notification at the user's configured time.
 * No backend / Push API server is involved.
 */

import { getPendingExpenses } from './expenseStorage';

const TITLE = 'Expense Tracker';
const TEST_BODY = 'Test notification — this is what your daily reminder will look like.';
const ICON = '/expense-tracker/icon-192x192.png';
const REVIEW_URL = '/expense-tracker/expenses?review=1';

let scheduledTimeoutId: ReturnType<typeof setTimeout> | null = null;

/** Returns true if a notification was actually shown. */
export function sendTestNotification(): boolean {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') return false;
  if (Notification.permission !== 'granted') return false;
  try {
    new Notification(TITLE, {
      body: TEST_BODY,
      icon: ICON,
      tag: 'expense-tracker-test',
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Compute the next occurrence of HH:mm (24h) after `now`.
 * If the time today has already passed, returns tomorrow at that time.
 */
export function nextOccurrence(time: string, now: Date = new Date()): Date {
  const [hStr, mStr] = time.split(':');
  const h = Number.parseInt(hStr ?? '0', 10);
  const m = Number.parseInt(mStr ?? '0', 10);
  const next = new Date(now);
  next.setHours(h, m, 0, 0);
  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

function fireDailyNotification() {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  const pending = getPendingExpenses();
  if (pending.length === 0) return;

  try {
    const notification = new Notification(TITLE, {
      body: `You have ${pending.length} expense${pending.length === 1 ? '' : 's'} to review`,
      icon: ICON,
      tag: 'expense-tracker-daily',
    });
    notification.onclick = () => {
      try {
        window.focus();
        window.location.href = REVIEW_URL;
      } catch {
        // ignore
      }
      notification.close();
    };
  } catch {
    // swallow — notifications are best-effort
  }
}

/**
 * Schedule (or reschedule) the daily reminder. Cancels any existing schedule first.
 * After the notification fires, it auto-reschedules for the next day.
 */
export function scheduleNotification(time: string): void {
  if (typeof window === 'undefined') return;
  cancelNotification();

  const fireAt = nextOccurrence(time);
  const delayMs = Math.max(0, fireAt.getTime() - Date.now());

  scheduledTimeoutId = setTimeout(() => {
    fireDailyNotification();
    // Re-arm for the next day.
    scheduleNotification(time);
  }, delayMs);
}

/** Clear any pending scheduled notification. */
export function cancelNotification(): void {
  if (scheduledTimeoutId !== null) {
    clearTimeout(scheduledTimeoutId);
    scheduledTimeoutId = null;
  }
}

/** Returns true if a notification is currently scheduled (test helper). */
export function isScheduled(): boolean {
  return scheduledTimeoutId !== null;
}
