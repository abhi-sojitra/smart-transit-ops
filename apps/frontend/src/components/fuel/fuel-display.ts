export function getFuelInitials(station: string): string {
  const words = station.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return 'FL';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0] ?? ''}${words[1][0] ?? ''}`.toUpperCase();
}

export function getExpenseInitials(title: string): string {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return 'EX';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0] ?? ''}${words[1][0] ?? ''}`.toUpperCase();
}

function formatCurrency(value: number) {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Relative cost bar width vs a reference max (default $500). */
export function costBarPercent(amount: number, max = 500): number {
  return Math.max(4, Math.min(100, (amount / max) * 100));
}

export function formatFuelCost(value: number) {
  return formatCurrency(value);
}

export function formatExpenseAmount(value: number) {
  return formatCurrency(value);
}
