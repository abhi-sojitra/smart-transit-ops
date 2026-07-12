import type { ComplianceStatus, VehicleStatus } from './status';
import type { PaginationMeta } from './api';
import type { FuelType } from './fuel-expense';

export enum VehicleType {
  BUS = 'BUS',
  MINIBUS = 'MINIBUS',
  TRUCK = 'TRUCK',
  VAN = 'VAN',
  SEDAN = 'SEDAN',
  SUV = 'SUV',
  OTHER = 'OTHER',
}

export enum ServiceDueStatus {
  OK = 'OK',
  DUE_SOON = 'DUE_SOON',
  OVERDUE = 'OVERDUE',
}

export interface VehicleDocumentFile {
  name: string;
  url: string;
  type?: string;
  uploadedAt?: string;
}

export interface Vehicle {
  id: string;
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
  /** Maximum cargo/load capacity in kilograms */
  maxCapacity: number;
  mileage: number;
  purchaseDate?: string;
  registrationExpiryDate: string;
  insuranceExpiryDate: string;
  fitnessCertificateExpiryDate: string;
  registrationStatus?: ComplianceStatus;
  insuranceStatus?: ComplianceStatus;
  fitnessStatus?: ComplianceStatus;
  serviceDueStatus?: ServiceDueStatus;
  lastServiceDate?: string;
  nextServiceDueDate?: string;
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
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface VehicleStatistics {
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

export interface VehicleListQuery {
  page?: number;
  limit?: number;
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
  sortBy?: 'vehicleId' | 'make' | 'model' | 'mileage' | 'year' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface VehicleListResult {
  items: Vehicle[];
  meta: PaginationMeta;
}
