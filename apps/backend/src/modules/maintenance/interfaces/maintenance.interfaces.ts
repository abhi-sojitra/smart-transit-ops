import type {
  MaintenancePriority,
  MaintenanceStatus,
  MaintenanceType,
  PaginationMeta,
} from '@transitops/shared-types';
import type { MaintenanceSortField } from '../constants/maintenance.constants';

export interface MaintenanceQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?: MaintenanceStatus;
  priority?: MaintenancePriority;
  maintenanceType?: MaintenanceType;
  vehicleId?: string;
  startDateFrom?: string;
  startDateTo?: string;
  sortBy?: MaintenanceSortField;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface MaintenanceTimelineEvent {
  status: string;
  label: string;
  timestamp?: string;
  completed: boolean;
}

export interface CreateMaintenanceInput {
  vehicleId: string;
  maintenanceType: MaintenanceType;
  title: string;
  description?: string;
  priority?: MaintenancePriority;
  status?: MaintenanceStatus;
  startDate: string | Date;
  expectedCompletionDate: string | Date;
  estimatedCost: number;
  actualCost?: number;
  vendorName?: string;
  vendorPhone?: string;
  serviceCenter?: string;
  odometerReading?: number;
  nextServiceDue?: string | Date;
  notes?: string;
  createdBy?: string;
}

export interface UpdateMaintenanceInput {
  maintenanceType?: MaintenanceType;
  title?: string;
  description?: string;
  priority?: MaintenancePriority;
  status?: MaintenanceStatus;
  startDate?: string | Date;
  expectedCompletionDate?: string | Date;
  estimatedCost?: number;
  actualCost?: number;
  vendorName?: string;
  vendorPhone?: string;
  serviceCenter?: string;
  odometerReading?: number;
  nextServiceDue?: string | Date;
  notes?: string;
  updatedBy?: string;
}

export interface CompleteMaintenanceInput {
  actualCost?: number;
  notes?: string;
  completedDate?: string | Date;
  updatedBy?: string;
}

export interface CancelMaintenanceInput {
  notes?: string;
  updatedBy?: string;
}
