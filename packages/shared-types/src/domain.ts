import type { RoleCode } from './auth';
import type {
  DriverStatus,
  ExpenseStatus,
  LicenseStatus,
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
  model: string;
  year?: number;
  type?: string;
  status: VehicleStatus;
  lastService?: string;
  mileage: number;
}

export interface Driver {
  id: string;
  name: string;
  employeeId: string;
  licenseType?: string;
  licenseStatus: LicenseStatus;
  lastTrip?: string;
  safetyScore: number;
  status: DriverStatus;
}

export interface Trip {
  id: string;
  tripId: string;
  origin: string;
  destination: string;
  departureTime?: string;
  estimatedArrival?: string;
  vehicleId?: string;
  driverId?: string;
  status: TripStatus;
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
