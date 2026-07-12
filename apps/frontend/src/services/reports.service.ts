import type { ApiResponse } from '@transitops/shared-types';
import { apiClient } from '@/services/api';
import type {
  BiExportFormat,
  BiReportBase,
  BiReportCatalogItem,
  BiReportFilters,
  BiReportType,
  BiScheduleFrequency,
  BiScheduledReport,
} from '@/types/reports';

function unwrap<T>(payload: ApiResponse<T> | T): T {
  if (payload && typeof payload === 'object' && 'data' in payload && 'success' in payload) {
    return (payload as ApiResponse<T>).data;
  }
  return payload as T;
}

function toParams(filters: BiReportFilters = {}) {
  const params: Record<string, string | number> = {};
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params[key] = value as string | number;
    }
  });
  return params;
}

export const reportsService = {
  catalog: async () => {
    const { data } = await apiClient.get<ApiResponse<BiReportCatalogItem[]>>('/reports/catalog');
    return unwrap(data);
  },

  getReport: async (type: BiReportType, filters: BiReportFilters = {}) => {
    const { data } = await apiClient.get<ApiResponse<BiReportBase>>(`/reports/${type}`, {
      params: toParams(filters),
    });
    return unwrap(data);
  },

  listSchedules: async () => {
    const { data } = await apiClient.get<ApiResponse<BiScheduledReport[]>>('/reports/schedules');
    return unwrap(data);
  },

  schedule: async (payload: {
    type: BiReportType;
    frequency: BiScheduleFrequency;
    format: BiExportFormat;
    name?: string;
    email?: string;
    filters?: BiReportFilters;
  }) => {
    const { data } = await apiClient.post<ApiResponse<BiScheduledReport>>('/reports/schedule', {
      ...payload,
      ...payload.filters,
    });
    return unwrap(data);
  },

  export: async (payload: {
    type: BiReportType;
    format: BiExportFormat;
    filters?: BiReportFilters;
  }) => {
    const response = await apiClient.post(
      '/reports/export',
      {
        type: payload.type,
        format: payload.format,
        ...payload.filters,
      },
      { responseType: 'blob' },
    );
    const disposition = String(response.headers['content-disposition'] ?? '');
    const match = /filename="([^"]+)"/.exec(disposition);
    return {
      blob: response.data as Blob,
      filename: match?.[1] ?? `report.${payload.format === 'excel' ? 'xls' : payload.format}`,
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
