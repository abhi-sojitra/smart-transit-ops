import {
  MaintenancePriority,
  MaintenanceStatus,
  MaintenanceType,
} from '@transitops/shared-types';

export const MAINTENANCE_ACTIVE_STATUSES: MaintenanceStatus[] = [
  MaintenanceStatus.SCHEDULED,
  MaintenanceStatus.IN_PROGRESS,
];

export const MAINTENANCE_SORT_FIELDS = [
  'createdAt',
  'startDate',
  'expectedCompletionDate',
  'completedDate',
  'estimatedCost',
  'actualCost',
] as const;

export type MaintenanceSortField = (typeof MAINTENANCE_SORT_FIELDS)[number];

export const MAINTENANCE_TYPE_LABELS: Record<MaintenanceType, string> = {
  [MaintenanceType.PREVENTIVE]: 'Preventive',
  [MaintenanceType.CORRECTIVE]: 'Corrective',
  [MaintenanceType.EMERGENCY]: 'Emergency',
  [MaintenanceType.OIL_CHANGE]: 'Oil Change',
  [MaintenanceType.TYRE_REPLACEMENT]: 'Tyre Replacement',
  [MaintenanceType.ENGINE_REPAIR]: 'Engine Repair',
  [MaintenanceType.BRAKE_SERVICE]: 'Brake Service',
  [MaintenanceType.BATTERY_REPLACEMENT]: 'Battery Replacement',
  [MaintenanceType.INSPECTION]: 'Inspection',
};

export const MAINTENANCE_PRIORITY_LABELS: Record<MaintenancePriority, string> = {
  [MaintenancePriority.LOW]: 'Low',
  [MaintenancePriority.MEDIUM]: 'Medium',
  [MaintenancePriority.HIGH]: 'High',
  [MaintenancePriority.CRITICAL]: 'Critical',
};

export const MAINTENANCE_NUMBER_PREFIX = 'MNT';
