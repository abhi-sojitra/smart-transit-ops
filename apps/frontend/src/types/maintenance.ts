import {
  MaintenancePriority,
  MaintenanceStatus,
  MaintenanceType,
  type Maintenance,
  type MaintenanceStatistics,
  type PaginationMeta,
} from '@transitops/shared-types';

export type MaintenanceListParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: MaintenanceStatus | '';
  priority?: MaintenancePriority | '';
  maintenanceType?: MaintenanceType | '';
  vehicleId?: string;
  startDateFrom?: string;
  startDateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

export type MaintenanceFormValues = {
  vehicleId: string;
  maintenanceType: MaintenanceType;
  title: string;
  description?: string;
  priority: MaintenancePriority;
  startDate: string;
  expectedCompletionDate: string;
  estimatedCost: number;
  actualCost?: number | '';
  vendorName?: string;
  vendorPhone?: string;
  serviceCenter?: string;
  odometerReading?: number | '';
  nextServiceDue?: string;
  notes?: string;
};

export type VehicleLookup = {
  id: string;
  vehicleNumber: string;
  model: string;
  status: string;
  odometerReading: number;
};

export type MaintenanceTimelineEvent = {
  status: string;
  label: string;
  timestamp?: string;
  completed: boolean;
};

export type MaintenanceDetail = Maintenance & {
  timeline?: MaintenanceTimelineEvent[];
};

export type MaintenanceListResponse = {
  data: Maintenance[];
  meta: PaginationMeta;
};

export type { Maintenance, MaintenanceStatistics };

export const MAINTENANCE_TYPE_OPTIONS = Object.values(MaintenanceType).map((value) => ({
  value,
  label: value.replaceAll('_', ' '),
}));

export const MAINTENANCE_PRIORITY_OPTIONS = Object.values(MaintenancePriority).map((value) => ({
  value,
  label: value.charAt(0) + value.slice(1).toLowerCase(),
}));

export const MAINTENANCE_STATUS_OPTIONS = Object.values(MaintenanceStatus).map((value) => ({
  value,
  label: value.replaceAll('_', ' '),
}));
