import type { Driver } from '@/types/driver';

const EXPORT_COLUMNS: Array<{ key: keyof Driver | 'licenseStatusLabel'; header: string }> = [
  { key: 'employeeCode', header: 'Employee Code' },
  { key: 'fullName', header: 'Driver Name' },
  { key: 'email', header: 'Email' },
  { key: 'phone', header: 'Phone' },
  { key: 'licenseNumber', header: 'License Number' },
  { key: 'licenseCategory', header: 'License Category' },
  { key: 'licenseExpiryDate', header: 'License Expiry' },
  { key: 'licenseStatus', header: 'License Status' },
  { key: 'status', header: 'Status' },
  { key: 'safetyScore', header: 'Safety Score' },
  { key: 'experienceYears', header: 'Experience Years' },
  { key: 'city', header: 'City' },
  { key: 'state', header: 'State' },
  { key: 'joiningDate', header: 'Joining Date' },
];

function escapeCsv(value: unknown): string {
  if (value == null) return '';
  const raw =
    typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)
      ? new Date(value).toLocaleDateString()
      : String(value);
  if (/[",\n\r]/.test(raw)) {
    return `"${raw.replaceAll('"', '""')}"`;
  }
  return raw;
}

export function driversToCsv(drivers: Driver[]): string {
  const header = EXPORT_COLUMNS.map((col) => col.header).join(',');
  const rows = drivers.map((driver) =>
    EXPORT_COLUMNS.map((col) => escapeCsv(driver[col.key as keyof Driver])).join(','),
  );
  return [header, ...rows].join('\n');
}

export function downloadDriversCsv(drivers: Driver[], filename?: string) {
  const csv = driversToCsv(drivers);
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = filename ?? `drivers-export-${stamp}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
