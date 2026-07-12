import type { RoleCode } from './auth';
import type {
  CargoType,
  ExpenseStatus,
  MaintenancePriority,
  MaintenanceStatus,
  MaintenanceType,
  TripStatus,
  UserAccountStatus,
} from './status';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  roles: RoleCode[];
  status: UserAccountStatus;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  code: RoleCode;
  name: string;
  description?: string;
  permissions: string[];
  isSystem?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/** Re-exported from vehicle.ts for backward compatibility */
export type { Vehicle } from './vehicle';

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

export interface MaintenanceAttachment {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: string;
}

/** @deprecated Prefer Maintenance — kept for scaffold mock compatibility */
export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  serviceType: string;
  status: MaintenanceStatus;
  date: string;
  cost: number;
  notes?: string;
}

export interface Maintenance {
  id: string;
  vehicleId: string;
  vehicleNumber?: string;
  vehicleModel?: string;
  maintenanceNumber: string;
  maintenanceType: MaintenanceType;
  title: string;
  description?: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  startDate: string;
  expectedCompletionDate: string;
  completedDate?: string;
  estimatedCost: number;
  actualCost?: number;
  vendorName?: string;
  vendorPhone?: string;
  serviceCenter?: string;
  odometerReading?: number;
  nextServiceDue?: string;
  attachments: MaintenanceAttachment[];
  notes?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceStatistics {
  totalRecords: number;
  active: number;
  completed: number;
  overdue: number;
  vehiclesInShop: number;
  costThisMonth: number;
  costThisYear: number;
  averageRepairTimeDays: number;
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
