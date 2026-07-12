import type { ApiResponse } from '@transitops/shared-types';
import { apiClient } from '@/services/api';
import type {
  Driver,
  DriverFiltersState,
  DriverFormValues,
  DriverListResponse,
  DriverStatistics,
} from '@/types/driver';

function unwrap<T>(payload: ApiResponse<T> | T): T {
  if (payload && typeof payload === 'object' && 'success' in payload && 'data' in payload) {
    return (payload as ApiResponse<T>).data;
  }
  return payload as T;
}

function toQueryParams(filters: DriverFiltersState): Record<string, string | number> {
  const params: Record<string, string | number> = {
    page: filters.page,
    limit: filters.limit,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  };
  if (filters.search.trim()) params.search = filters.search.trim();
  if (filters.status !== 'ALL') params.status = filters.status;
  if (filters.licenseCategory !== 'ALL') params.licenseCategory = filters.licenseCategory;
  if (filters.city.trim()) params.city = filters.city.trim();
  if (filters.state.trim()) params.state = filters.state.trim();
  if (filters.experienceMin) params.experienceMin = Number(filters.experienceMin);
  if (filters.experienceMax) params.experienceMax = Number(filters.experienceMax);
  return params;
}

export const driversApi = {
  async list(filters: DriverFiltersState): Promise<DriverListResponse> {
    const { data } = await apiClient.get<
      ApiResponse<Driver[]> & { meta?: DriverListResponse['meta'] }
    >('/drivers', { params: toQueryParams(filters) });

    if (data && typeof data === 'object' && 'data' in data) {
      const envelope = data as ApiResponse<Driver[]> & {
        meta?: DriverListResponse['meta'];
      };
      // Service returns { data, meta } which interceptor wraps as { success, data, meta }
      // Or if service returns nested — handle both shapes
      const inner = envelope.data as unknown;
      if (inner && typeof inner === 'object' && 'items' in (inner as object)) {
        return inner as DriverListResponse;
      }
      return {
        items: (envelope.data as Driver[]) ?? [],
        meta: envelope.meta ?? { page: 1, limit: 10, total: 0, totalPages: 0 },
      };
    }

    return data as unknown as DriverListResponse;
  },

  async getById(id: string): Promise<Driver> {
    const { data } = await apiClient.get<ApiResponse<Driver>>(`/drivers/${id}`);
    return unwrap(data);
  },

  async create(payload: DriverFormValues): Promise<Driver> {
    const { data } = await apiClient.post<ApiResponse<Driver>>('/drivers', payload);
    return unwrap(data);
  },

  async update(id: string, payload: Partial<DriverFormValues>): Promise<Driver> {
    const { data } = await apiClient.patch<ApiResponse<Driver>>(`/drivers/${id}`, payload);
    return unwrap(data);
  },

  async remove(id: string): Promise<{ id: string; deleted: boolean }> {
    const { data } = await apiClient.delete<ApiResponse<{ id: string; deleted: boolean }>>(
      `/drivers/${id}`,
    );
    return unwrap(data);
  },

  async updateStatus(id: string, status: string): Promise<Driver> {
    const { data } = await apiClient.patch<ApiResponse<Driver>>(`/drivers/${id}/status`, {
      status,
    });
    return unwrap(data);
  },

  async updateSafetyScore(id: string, safetyScore: number): Promise<Driver> {
    const { data } = await apiClient.patch<ApiResponse<Driver>>(`/drivers/${id}/safety-score`, {
      safetyScore,
    });
    return unwrap(data);
  },

  async getAvailable(): Promise<Driver[]> {
    const { data } = await apiClient.get<ApiResponse<Driver[]>>('/drivers/available');
    return unwrap(data);
  },

  async getStatistics(): Promise<DriverStatistics> {
    const { data } = await apiClient.get<ApiResponse<DriverStatistics>>('/drivers/statistics');
    return unwrap(data);
  },
};
