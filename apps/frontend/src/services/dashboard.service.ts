import type {
  ApiResponse,
  BusinessSummary,
  DashboardAlert,
  DashboardActivityItem,
  DashboardCharts,
  DashboardOverview,
  DashboardReportPayload,
  RecentTripItem,
  ReportFormat,
  ReportPeriod,
  TopDriverItem,
  TopVehicleItem,
  UpcomingMaintenanceItem,
} from '@transitops/shared-types';
import { apiClient } from './api';

function unwrap<T>(response: { data: ApiResponse<T> }): T {
  return response.data.data;
}

export interface DashboardLimitParams {
  limit?: number;
}

export interface ReportParams {
  period?: ReportPeriod;
  format?: ReportFormat;
}

export const dashboardService = {
  getOverview: async () =>
    unwrap(await apiClient.get<ApiResponse<DashboardOverview>>('/dashboard/overview')),

  getRecentActivity: async (params?: DashboardLimitParams) =>
    unwrap(
      await apiClient.get<ApiResponse<DashboardActivityItem[]>>('/dashboard/recent-activity', {
        params,
      }),
    ),

  getCharts: async () =>
    unwrap(await apiClient.get<ApiResponse<DashboardCharts>>('/dashboard/charts')),

  getAlerts: async () =>
    unwrap(await apiClient.get<ApiResponse<DashboardAlert[]>>('/dashboard/alerts')),

  getTopDrivers: async (params?: DashboardLimitParams) =>
    unwrap(
      await apiClient.get<ApiResponse<TopDriverItem[]>>('/dashboard/top-drivers', { params }),
    ),

  getTopVehicles: async (params?: DashboardLimitParams) =>
    unwrap(
      await apiClient.get<ApiResponse<TopVehicleItem[]>>('/dashboard/top-vehicles', { params }),
    ),

  getUpcomingMaintenance: async (params?: DashboardLimitParams) =>
    unwrap(
      await apiClient.get<ApiResponse<UpcomingMaintenanceItem[]>>(
        '/dashboard/upcoming-maintenance',
        { params },
      ),
    ),

  getRecentTrips: async (params?: DashboardLimitParams) =>
    unwrap(
      await apiClient.get<ApiResponse<RecentTripItem[]>>('/dashboard/recent-trips', { params }),
    ),

  getBusinessSummary: async (params?: ReportParams) =>
    unwrap(
      await apiClient.get<ApiResponse<BusinessSummary>>('/dashboard/business-summary', {
        params,
      }),
    ),
};

export const analyticsService = {
  getCharts: async (months = 6) =>
    unwrap(
      await apiClient.get<ApiResponse<DashboardCharts>>('/analytics/charts', {
        params: { months },
      }),
    ),

  getSummary: async (period: ReportPeriod = 'monthly') =>
    unwrap(
      await apiClient.get<ApiResponse<BusinessSummary>>('/analytics/summary', {
        params: { period },
      }),
    ),

  getReports: async (period: ReportPeriod = 'monthly') =>
    unwrap(
      await apiClient.get<ApiResponse<DashboardReportPayload>>('/analytics/reports', {
        params: { period },
      }),
    ),

  exportReport: async (period: ReportPeriod = 'monthly', format: ReportFormat = 'csv') => {
    const response = await apiClient.get<Blob>('/analytics/reports/export', {
      params: { period, format },
      responseType: 'blob',
    });
    return {
      blob: response.data,
      filename:
        format === 'pdf'
          ? `transitops-${period}-report.pdf`
          : `transitops-${period}-report.csv`,
    };
  },
};

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
