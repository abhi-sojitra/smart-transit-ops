import { AxiosError } from 'axios';

const UNIQUE_FIELDS = ['registrationNumber', 'vehicleId', 'vin'] as const;

export type VehicleUniqueField = (typeof UNIQUE_FIELDS)[number];

export function parseVehicleUniqueConflict(
  error: unknown,
): { field: VehicleUniqueField; message: string } | null {
  if (!(error instanceof AxiosError) || error.response?.status !== 409) {
    return null;
  }

  const raw = error.response?.data?.message;
  const message = Array.isArray(raw) ? raw.join(', ') : typeof raw === 'string' ? raw : '';
  if (!message) return null;

  const lower = message.toLowerCase();
  for (const field of UNIQUE_FIELDS) {
    if (lower.includes(field.toLowerCase())) {
      return { field, message };
    }
  }

  // Backend message: "Vehicle with this registrationNumber already exists"
  if (lower.includes('registration')) {
    return { field: 'registrationNumber', message };
  }
  if (lower.includes('vehicleid') || lower.includes('vehicle id')) {
    return { field: 'vehicleId', message };
  }
  if (lower.includes('vin')) {
    return { field: 'vin', message };
  }

  return null;
}

export function isVehicleUniqueConflict(error: unknown): boolean {
  return parseVehicleUniqueConflict(error) !== null;
}
