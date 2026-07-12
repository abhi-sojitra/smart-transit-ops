import type { Vehicle } from '@/types/fleet';

const EXPORT_COLUMNS: Array<{ key: keyof Vehicle; header: string }> = [
  { key: 'vehicleId', header: 'Vehicle ID' },
  { key: 'registrationNumber', header: 'Registration' },
  { key: 'make', header: 'Make' },
  { key: 'model', header: 'Model' },
  { key: 'year', header: 'Year' },
  { key: 'vehicleType', header: 'Type' },
  { key: 'fuelType', header: 'Fuel' },
  { key: 'status', header: 'Status' },
  { key: 'mileage', header: 'Mileage' },
  { key: 'insuranceExpiryDate', header: 'Insurance Expiry' },
  { key: 'insuranceStatus', header: 'Insurance Status' },
  { key: 'fitnessCertificateExpiryDate', header: 'Fitness Expiry' },
  { key: 'fitnessStatus', header: 'Fitness Status' },
  { key: 'depotCity', header: 'Depot City' },
  { key: 'depotState', header: 'Depot State' },
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

export function vehiclesToCsv(vehicles: Vehicle[]): string {
  const header = EXPORT_COLUMNS.map((col) => col.header).join(',');
  const rows = vehicles.map((vehicle) =>
    EXPORT_COLUMNS.map((col) => escapeCsv(vehicle[col.key])).join(','),
  );
  return [header, ...rows].join('\n');
}

export function downloadVehiclesCsv(vehicles: Vehicle[], filename?: string) {
  const csv = vehiclesToCsv(vehicles);
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = filename ?? `fleet-export-${stamp}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
