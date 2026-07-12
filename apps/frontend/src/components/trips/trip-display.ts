import type { TripDriverRef, TripRecord, TripVehicleRef } from '@/types/trip';
import { TripStatus } from '@/types/trip';

const OBJECT_ID_RE = /^[a-f\d]{24}$/i;

function isObjectIdString(value: string): boolean {
  return OBJECT_ID_RE.test(value);
}

export function getTripId(trip: TripRecord): string {
  return trip._id || trip.id || '';
}

export function vehicleLabel(vehicle: TripRecord['vehicleId']): string {
  if (!vehicle) return '—';
  if (typeof vehicle === 'string') {
    return isObjectIdString(vehicle) ? 'Unknown vehicle' : vehicle;
  }

  const v = vehicle as TripVehicleRef;
  const name = [v.make, v.model].filter(Boolean).join(' ').trim();
  if (name) return name;
  if (v.model) return v.model;
  if (v.vehicleNumber) return v.vehicleNumber;
  if (v.registrationNumber) return v.registrationNumber;
  if (v.vehicleId && !isObjectIdString(v.vehicleId)) return v.vehicleId;
  return 'Unknown vehicle';
}

export function driverLabel(driver: TripRecord['driverId']): string {
  if (!driver) return '—';
  if (typeof driver === 'string') {
    return isObjectIdString(driver) ? 'Unknown driver' : driver;
  }

  const d = driver as TripDriverRef;
  const composed = `${d.firstName ?? ''} ${d.lastName ?? ''}`.trim();
  if (d.fullName?.trim()) return d.fullName.trim();
  if (d.name?.trim()) return d.name.trim();
  if (composed) return composed;
  if (d.employeeCode) return d.employeeCode;
  if (d.employeeId) return d.employeeId;
  return 'Unknown driver';
}

export function formatMoney(value?: number): string {
  if (value == null || Number.isNaN(value)) return '—';
  return `$${Math.round(value).toLocaleString()}`;
}

export function formatMiles(value?: number): string {
  if (value == null || Number.isNaN(value)) return '—';
  return `${value.toLocaleString()} mi`;
}

export function formatTripDate(value?: string): string {
  if (!value) return '—';
  return new Date(value).toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function tripRoute(trip: TripRecord): string {
  return `${trip.source} → ${trip.destination}`;
}

export const TRIP_STATUS_LABEL: Record<string, string> = {
  [TripStatus.DRAFT]: 'Draft',
  [TripStatus.DISPATCHED]: 'Dispatched',
  [TripStatus.IN_PROGRESS]: 'In Progress',
  [TripStatus.COMPLETED]: 'Completed',
  [TripStatus.CANCELLED]: 'Cancelled',
};
