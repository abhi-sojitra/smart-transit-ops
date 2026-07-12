import { VehicleStatus, VehicleType, FuelType } from '@transitops/shared-types';
import type { VehicleSortField } from '../constants/fleet.constants';

export interface VehicleDocumentFile {
  name: string;
  url: string;
  type?: string;
  uploadedAt?: Date;
}

export interface VehicleEntity {
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
  maxCapacity: number;
  mileage: number;
  purchaseDate?: Date;
  registrationExpiryDate: Date;
  insuranceExpiryDate: Date;
  fitnessCertificateExpiryDate: Date;
  lastServiceDate?: Date;
  nextServiceDueDate?: Date;
  depotCity?: string;
  depotState?: string;
  country?: string;
  photo?: string;
  documents?: VehicleDocumentFile[];
  status: VehicleStatus;
  remarks?: string;
  isDeleted: boolean;
  createdBy?: string;
  updatedBy?: string;
  deletedBy?: string;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface VehicleListFilters {
  search?: string;
  status?: VehicleStatus;
  vehicleType?: VehicleType;
  fuelType?: FuelType;
  depotCity?: string;
  depotState?: string;
  yearMin?: number;
  yearMax?: number;
  mileageMin?: number;
  mileageMax?: number;
}

export interface VehicleListOptions {
  page: number;
  limit: number;
  sortBy: VehicleSortField;
  sortOrder: 'asc' | 'desc';
  filters: VehicleListFilters;
}

export interface VehicleListResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface VehicleStatisticsResult {
  totalVehicles: number;
  available: number;
  onTrip: number;
  maintenance: number;
  retired: number;
  insuranceExpiring: number;
  fitnessExpiring: number;
  serviceDueSoon: number;
  averageMileage: number;
}

export interface SoftDeletePayload {
  deletedBy?: string;
  deletedAt: Date;
}
