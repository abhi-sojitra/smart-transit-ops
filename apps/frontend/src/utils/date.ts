import { addDays, format, isValid, parseISO, startOfDay } from 'date-fns';
import type { Matcher } from 'react-day-picker';

/** Parse YYYY-MM-DD or ISO string to Date (local midnight). */
export function parseDateInput(value?: string | null): Date | undefined {
  if (!value) return undefined;
  const dateOnly = value.length >= 10 ? value.slice(0, 10) : value;
  const parsed = parseISO(dateOnly);
  return isValid(parsed) ? parsed : undefined;
}

/** Format Date to YYYY-MM-DD for API / form values. */
export function toDateInput(value?: Date | null): string {
  if (!value || !isValid(value)) return '';
  return format(value, 'yyyy-MM-dd');
}

/** Local midnight for today. */
export function startOfToday(): Date {
  return startOfDay(new Date());
}

/** YYYY-MM-DD for a date offset from another date string. */
export function addDaysToDateInput(value: string | undefined, days: number): string | undefined {
  const base = parseDateInput(value);
  if (!base) return undefined;
  return toDateInput(addDays(base, days));
}

export interface DateConstraintOptions {
  /** Disables dates before today; today remains selectable. */
  disablePast?: boolean;
  /** Disables dates after today; today remains selectable. */
  disableFuture?: boolean;
  /** Disables today and all past dates (expiry fields must be strictly after today). */
  requireFuture?: boolean;
  minDate?: string;
  maxDate?: string;
}

/** Build react-day-picker disabled matchers from form validation rules. */
export function buildDisabledDates(
  options: DateConstraintOptions,
): Matcher | Matcher[] | undefined {
  const matchers: Matcher[] = [];

  if (options.requireFuture) {
    matchers.push({ before: addDays(startOfToday(), 1) });
  } else if (options.disablePast) {
    matchers.push({ before: startOfToday() });
  }

  if (options.disableFuture) {
    matchers.push({ after: startOfToday() });
  }

  const min = parseDateInput(options.minDate);
  if (min) {
    matchers.push({ before: startOfDay(min) });
  }

  const max = parseDateInput(options.maxDate);
  if (max) {
    matchers.push({ after: startOfDay(max) });
  }

  if (matchers.length === 0) return undefined;
  if (matchers.length === 1) return matchers[0];
  return matchers;
}

/** Whether "Today" quick action should appear for the given constraints. */
export function isTodaySelectable(options: DateConstraintOptions): boolean {
  const today = startOfToday();
  const disabled = buildDisabledDates(options);
  if (!disabled) return true;

  const matchers = Array.isArray(disabled) ? disabled : [disabled];
  return !matchers.some((matcher) => {
    if (typeof matcher === 'function') return matcher(today);
    if (matcher instanceof Date) return matcher.getTime() === today.getTime();
    if (typeof matcher === 'object' && matcher !== null) {
      if ('before' in matcher && matcher.before) {
        const before = startOfDay(matcher.before as Date);
        if (today.getTime() < before.getTime()) return true;
      }
      if ('after' in matcher && matcher.after) {
        const after = startOfDay(matcher.after as Date);
        if (today.getTime() > after.getTime()) return true;
      }
    }
    return false;
  });
}

/** Display date in a consistent locale format. */
export function formatDisplayDate(value?: string | Date | null, fallback = '—'): string {
  if (!value) return fallback;
  const date = value instanceof Date ? value : parseDateInput(value);
  if (!date) return fallback;
  return format(date, 'dd MMM yyyy');
}

/** Format a date range for filter button labels. */
export function formatDateRangeLabel(from?: string, to?: string, placeholder = 'Pick dates'): string {
  if (from && to) return `${formatDisplayDate(from)} – ${formatDisplayDate(to)}`;
  if (from) return `From ${formatDisplayDate(from)}`;
  if (to) return `Until ${formatDisplayDate(to)}`;
  return placeholder;
}
