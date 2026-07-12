export function formatChartValue(value: number | string): string {
  const num = Number(value);
  if (!Number.isFinite(num)) return String(value);
  return num.toFixed(2);
}

export const chartTooltipStyle = {
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: 8,
} as const;

export function chartTooltipFormatter(value: number | string) {
  return formatChartValue(value);
}
