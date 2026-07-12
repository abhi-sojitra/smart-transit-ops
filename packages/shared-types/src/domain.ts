import type { RoleCode } from './auth';
import type {
  CargoType,
  ExpenseStatus,
  MaintenanceStatus,
  TripStatus,
  UserAccountStatus,
  VehicleStatus,
} from './status';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: RoleCode[];
  status: UserAccountStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  code: RoleCode;
  name: string;
  description?: string;
  permissions: string[];
}

export interface Vehicle {
  id: string;
  vehicleId: string;
  registrationNumber?: string;
  make?: string;
  model: string;
  year?: number;
  type?: string;
  status: VehicleStatus;
  maxCapacity: number;
  lastService?: string;
  mileage: number;
}

/** Re-exported from driver.ts for backward compatibility */
export type { Driver } from './driver';

export interface TripDocumentMeta {
  name: string;
  url: string;
  uploadedAt?: string;
}

export interface Trip {
  id: string;
  tripNumber: string;
  source: string;
  destination: string;
  vehicleId: string;
  driverId: string;
  cargoName: string;
  cargoWeight: number;
  cargoType: CargoType;
  plannedDistance: number;
  actualDistance?: number;
  plannedStartDate: string;
  plannedEndDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  fuelConsumed?: number;
  estimatedRevenue: number;
  actualRevenue?: number;
  notes?: string;
  status: TripStatus;
  tripDocuments?: TripDocumentMeta[];
  createdAt: string;
  updatedAt: string;
}

export interface TripStatistics {
  totalTrips: number;
  activeTrips: number;
  pendingTrips: number;
  completedTrips: number;
  cancelledTrips: number;
  revenue: number;
  averageDistance: number;
  fuelConsumption: number;
  distanceTravelled: number;
}

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  serviceType: string;
  status: MaintenanceStatus;
  date: string;
  cost: number;
  notes?: string;
}

export interface FuelExpense {
  id: string;
  date: string;
  vehicleId: string;
  type: 'FUEL' | 'OPERATING';
  amount: number;
  liters?: number;
  status: ExpenseStatus;
}
