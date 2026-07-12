import {
  CargoType,
  TripStatus,
  type Trip,
  type TripStatistics,
} from '@transitops/shared-types';

export type { Trip, TripStatistics };

export interface TripVehicleRef {
  _id?: string;
  id?: string;
  vehicleId?: string;
  vehicleNumber?: string;
  registrationNumber?: string;
  make?: string;
  model?: string;
  status?: string;
  maxCapacity?: number;
}

export interface TripDriverRef {
  _id?: string;
  id?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  name?: string;
  employeeCode?: string;
  employeeId?: string;
  status?: string;
  licenseStatus?: string;
  licenseExpiry?: string;
  licenseExpiryDate?: string;
}

export interface TripRecord extends Omit<Trip, 'id' | 'vehicleId' | 'driverId' | 'createdAt' | 'updatedAt'> {
  _id: string;
  id?: string;
  vehicleId: string | TripVehicleRef;
  driverId: string | TripDriverRef;
  createdAt: string;
  updatedAt: string;
  isDeleted?: boolean;
}

export interface TripListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: TripStatus | '';
  driverId?: string;
  vehicleId?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedTrips {
  data: TripRecord[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateTripInput {
  source: string;
  destination: string;
  vehicleId: string;
  driverId: string;
  cargoName: string;
  cargoWeight: number;
  cargoType: CargoType;
  plannedDistance: number;
  plannedStartDate: string;
  plannedEndDate: string;
  estimatedRevenue: number;
  notes?: string;
}

export type UpdateTripInput = Partial<CreateTripInput>;

export interface CompleteTripInput {
  actualDistance: number;
  fuelConsumed: number;
  actualRevenue: number;
  notes?: string;
}

export interface CancelTripInput {
  reason?: string;
  notes?: string;
}

export interface TripValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

export { CargoType, TripStatus };
