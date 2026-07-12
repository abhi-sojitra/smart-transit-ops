/** Input sanitization and live transform helpers for form fields. */

const EMOJI_REGEX =
  /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}]/gu;
const UNSAFE_CHARS_REGEX = /[<>'"`;\\]|(?:script|javascript|on\w+\s*=)/gi;

export function stripUnsafeInput(value: string): string {
  return value.replace(UNSAFE_CHARS_REGEX, '').replace(EMOJI_REGEX, '');
}

export function preventLeadingSpaces(value: string): string {
  return value.replace(/^\s+/, '');
}

export function collapseDoubleSpaces(value: string): string {
  return value.replace(/\s{2,}/g, ' ');
}

export function sanitizeTextInput(value: string, maxLength?: number): string {
  let next = stripUnsafeInput(value);
  next = preventLeadingSpaces(next);
  next = collapseDoubleSpaces(next);
  if (maxLength != null) next = next.slice(0, maxLength);
  return next;
}

export function digitsOnly(value: string, maxLength?: number): string {
  const next = value.replace(/\D/g, '');
  return maxLength != null ? next.slice(0, maxLength) : next;
}

export function lettersOnly(value: string, maxLength?: number): string {
  const next = value.replace(/[^a-zA-Z\s'-]/g, '');
  return maxLength != null ? next.slice(0, maxLength) : next;
}

export function uppercase(value: string, maxLength?: number): string {
  const next = value.toUpperCase();
  return maxLength != null ? next.slice(0, maxLength) : next;
}

export function lowercase(value: string, maxLength?: number): string {
  const next = value.toLowerCase();
  return maxLength != null ? next.slice(0, maxLength) : next;
}

/** Capitalize the first letter of each word (names). */
export function capitalizeWords(value: string): string {
  return value.replace(/\b([a-z])/g, (char) => char.toUpperCase());
}

export function positiveDecimal(value: string, maxDecimals = 2): string {
  let next = value.replace(/[^\d.]/g, '');
  const parts = next.split('.');
  if (parts.length > 2) next = `${parts[0]}.${parts.slice(1).join('')}`;
  if (parts.length === 2 && parts[1].length > maxDecimals) {
    next = `${parts[0]}.${parts[1].slice(0, maxDecimals)}`;
  }
  return next;
}

export function trimValue(value: string): string {
  return value.trim();
}

export function optionalString(value?: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}
