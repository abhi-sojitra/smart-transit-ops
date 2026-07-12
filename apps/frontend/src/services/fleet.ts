import type { ApiResponse } from '@transitops/shared-types';
import { apiClient } from '@/services/api';
import type {
  Vehicle,
  VehicleFiltersState,
  VehicleFormValues,
  VehicleListResponse,
  VehicleStatistics,
} from '@/types/fleet';

function unwrap<T>(payload: ApiResponse<T> | T): T {
  if (payload && typeof payload === 'object' && 'success' in payload && 'data' in payload) {
    return (payload as ApiResponse<T>).data;
  }
  return payload as T;
}

function toQueryParams(filters: VehicleFiltersState): Record<string, string | number> {
  const params: Record<string, string | number> = {
    page: filters.page,
    limit: filters.limit,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  };
  if (filters.search.trim()) params.search = filters.search.trim();
  if (filters.status !== 'ALL') params.status = filters.status;
  if (filters.vehicleType !== 'ALL') params.vehicleType = filters.vehicleType;
  if (filters.fuelType !== 'ALL') params.fuelType = filters.fuelType;
  if (filters.depotCity.trim()) params.depotCity = filters.depotCity.trim();
  if (filters.depotState.trim()) params.depotState = filters.depotState.trim();
  if (filters.yearMin) params.yearMin = Number(filters.yearMin);
  if (filters.yearMax) params.yearMax = Number(filters.yearMax);
  if (filters.mileageMin) params.mileageMin = Number(filters.mileageMin);
  if (filters.mileageMax) params.mileageMax = Number(filters.mileageMax);
  return params;
}

export const fleetApi = {
  async list(filters: VehicleFiltersState): Promise<VehicleListResponse> {
    const { data } = await apiClient.get<
      ApiResponse<Vehicle[]> & { meta?: VehicleListResponse['meta'] }
    >('/vehicles', { params: toQueryParams(filters) });

    if (data && typeof data === 'object' && 'data' in data) {
      const envelope = data as ApiResponse<Vehicle[]> & {
        meta?: VehicleListResponse['meta'];
      };
      const inner = envelope.data as unknown;
      if (inner && typeof inner === 'object' && 'items' in (inner as object)) {
        return inner as VehicleListResponse;
      }
      return {
        items: (envelope.data as Vehicle[]) ?? [],
        meta: envelope.meta ?? { page: 1, limit: 10, total: 0, totalPages: 0 },
      };
    }

    return data as unknown as VehicleListResponse;
  },

  async getById(id: string): Promise<Vehicle> {
    const { data } = await apiClient.get<ApiResponse<Vehicle>>(`/vehicles/${id}`);
    return unwrap(data);
  },

  async create(payload: VehicleFormValues): Promise<Vehicle> {
    const { data } = await apiClient.post<ApiResponse<Vehicle>>('/vehicles', payload);
    return unwrap(data);
  },

  async update(id: string, payload: Partial<VehicleFormValues>): Promise<Vehicle> {
    const { data } = await apiClient.patch<ApiResponse<Vehicle>>(`/vehicles/${id}`, payload);
    return unwrap(data);
  },

  async remove(id: string): Promise<{ id: string; deleted: boolean }> {
    const { data } = await apiClient.delete<ApiResponse<{ id: string; deleted: boolean }>>(
      `/vehicles/${id}`,
    );
    return unwrap(data);
  },

  async updateStatus(id: string, status: string): Promise<Vehicle> {
    const { data } = await apiClient.patch<ApiResponse<Vehicle>>(`/vehicles/${id}/status`, {
      status,
    });
    return unwrap(data);
  },

  async updateMileage(id: string, mileage: number): Promise<Vehicle> {
    const { data } = await apiClient.patch<ApiResponse<Vehicle>>(`/vehicles/${id}/mileage`, {
      mileage,
    });
    return unwrap(data);
  },

  async getAvailable(): Promise<Vehicle[]> {
    const { data } = await apiClient.get<ApiResponse<Vehicle[]>>('/vehicles/available');
    return unwrap(data);
  },

  async getStatistics(): Promise<VehicleStatistics> {
    const { data } = await apiClient.get<ApiResponse<VehicleStatistics>>('/vehicles/statistics');
    return unwrap(data);
  },
};
