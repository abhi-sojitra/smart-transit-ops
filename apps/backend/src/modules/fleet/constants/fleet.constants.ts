import { VehicleStatus, VehicleType, FuelType } from '@transitops/shared-types';

export const VEHICLE_COLLECTION = 'vehicles';

export const VEHICLE_SORT_FIELDS = [
  'vehicleId',
  'make',
  'model',
  'mileage',
  'year',
  'createdAt',
] as const;

export type VehicleSortField = (typeof VEHICLE_SORT_FIELDS)[number];

export const VEHICLE_DEFAULT_PAGE = 1;
export const VEHICLE_DEFAULT_LIMIT = 10;
export const VEHICLE_MAX_LIMIT = 100;

export const COMPLIANCE_EXPIRING_DAYS = 30;
export const SERVICE_DUE_SOON_DAYS = 14;

export const VEHICLE_STATUS_VALUES = Object.values(VehicleStatus);
export const VEHICLE_TYPE_VALUES = Object.values(VehicleType);
export const FUEL_TYPE_VALUES = Object.values(FuelType);

export const VEHICLE_UNIQUE_FIELDS = ['vehicleId', 'registrationNumber', 'vin'] as const;

export type VehicleUniqueField = (typeof VEHICLE_UNIQUE_FIELDS)[number];
