import {
  VehicleStatus,
  VehicleType,
  FuelType,
  type Vehicle,
  type VehicleListQuery,
  type VehicleStatistics,
  type PaginationMeta,
} from '@transitops/shared-types';

export type {
  Vehicle,
  VehicleListQuery,
  VehicleStatistics,
  PaginationMeta,
};

export { VehicleStatus, VehicleType, FuelType };

export interface VehicleListResponse {
  items: Vehicle[];
  meta: PaginationMeta;
}

export interface VehicleFormValues {
  vehicleId: string;
  registrationNumber: string;
  vin?: string;
  make: string;
  model: string;
  year?: number;
  vehicleType: VehicleType;
  fuelType: FuelType;
  color?: string;
  seatingCapacity?: number;
  mileage: number;
  purchaseDate?: string;
  registrationExpiryDate: string;
  insuranceExpiryDate: string;
  fitnessCertificateExpiryDate: string;
  lastServiceDate?: string;
  nextServiceDueDate?: string;
  depotCity?: string;
  depotState?: string;
  country?: string;
  photo?: string;
  remarks?: string;
  status?: VehicleStatus;
}

export interface VehicleFiltersState {
  search: string;
  status: VehicleStatus | 'ALL';
  vehicleType: VehicleType | 'ALL';
  fuelType: FuelType | 'ALL';
  depotCity: string;
  depotState: string;
  yearMin: string;
  yearMax: string;
  mileageMin: string;
  mileageMax: string;
  sortBy: NonNullable<VehicleListQuery['sortBy']>;
  sortOrder: 'asc' | 'desc';
  page: number;
  limit: number;
}
