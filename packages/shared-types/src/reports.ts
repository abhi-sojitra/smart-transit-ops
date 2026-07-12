import type { PaginationMeta } from './api';

export type BiReportType =
  | 'executive'
  | 'fleet'
  | 'drivers'
  | 'vehicles'
  | 'trips'
  | 'maintenance'
  | 'fuel'
  | 'expenses'
  | 'financial'
  | 'profitability';

export type BiExportFormat = 'csv' | 'pdf' | 'excel';

export type BiScheduleFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface BiReportFilters {
  startDate?: string;
  endDate?: string;
  vehicleId?: string;
  driverId?: string;
  tripId?: string;
  maintenanceType?: string;
  expenseCategory?: string;
  fuelType?: string;
  region?: string;
  status?: string;
  vendor?: string;
  route?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface BiKpiMetric {
  key: string;
  label: string;
  value: number;
  unit?: string;
  changePercent?: number;
  trend?: 'up' | 'down' | 'flat';
}

export interface BiChartPoint {
  label: string;
  value: number;
  secondary?: number;
}

export interface BiLeaderboardRow {
  id: string;
  label: string;
  subtitle?: string;
  value: number;
  secondary?: number;
  meta?: Record<string, number | string>;
}

export interface BiInsight {
  id: string;
  severity: 'info' | 'warning' | 'critical' | 'positive';
  title: string;
  detail: string;
}

export interface BiTableColumn {
  key: string;
  label: string;
}

export interface BiTableResult {
  columns: BiTableColumn[];
  rows: Record<string, string | number | null>[];
  meta: PaginationMeta;
}

export interface BiReportBase {
  type: BiReportType;
  title: string;
  generatedAt: string;
  periodStart: string;
  periodEnd: string;
  kpis: BiKpiMetric[];
  charts: Record<string, BiChartPoint[]>;
  leaderboards: Record<string, BiLeaderboardRow[]>;
  insights: BiInsight[];
  table?: BiTableResult;
}

export interface BiExecutiveReport extends BiReportBase {
  type: 'executive';
  summary: {
    totalRevenue: number;
    totalOperationalCost: number;
    profit: number;
    fleetUtilization: number;
    tripsCompleted: number;
    tripsCancelled: number;
    vehiclesAvailable: number;
    vehiclesInMaintenance: number;
    driversAvailable: number;
    driversSuspended: number;
    fuelConsumption: number;
    maintenanceCost: number;
    expenseCost: number;
    vehicleRoi: number;
  };
}

export interface BiExportRequest {
  type: BiReportType;
  format: BiExportFormat;
  filters?: BiReportFilters;
}

export interface BiScheduleRequest {
  type: BiReportType;
  frequency: BiScheduleFrequency;
  format: BiExportFormat;
  filters?: BiReportFilters;
  email?: string;
  name?: string;
}

export interface BiScheduledReport {
  id: string;
  name: string;
  type: BiReportType;
  frequency: BiScheduleFrequency;
  format: BiExportFormat;
  filters?: BiReportFilters;
  email?: string;
  nextRunAt: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  isActive: boolean;
}

export interface BiReportCatalogItem {
  type: BiReportType;
  title: string;
  description: string;
  href: string;
}
