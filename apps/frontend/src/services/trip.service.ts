import { apiClient } from '@/services/api';
import type {
  CancelTripInput,
  CompleteTripInput,
  CreateTripInput,
  PaginatedTrips,
  TripListParams,
  TripRecord,
  UpdateTripInput,
} from '@/types/trip';
import type { TripStatistics } from '@transitops/shared-types';

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
}

function unwrap<T>(payload: ApiEnvelope<T> | T): T {
  if (payload && typeof payload === 'object' && 'success' in payload && 'data' in payload) {
    return (payload as ApiEnvelope<T>).data;
  }
  return payload as T;
}

export const tripService = {
  async list(params: TripListParams = {}): Promise<PaginatedTrips> {
    const { data } = await apiClient.get<ApiEnvelope<TripRecord[]> | PaginatedTrips>('/trips', {
      params,
    });
    if (data && typeof data === 'object' && 'data' in data && 'meta' in data && !('success' in data)) {
      return data as PaginatedTrips;
    }
    const envelope = data as ApiEnvelope<TripRecord[]>;
    return {
      data: envelope.data ?? [],
      meta: (envelope.meta as PaginatedTrips['meta']) ?? {
        page: params.page ?? 1,
        limit: params.limit ?? 10,
        total: 0,
        totalPages: 1,
      },
    };
  },

  async getById(id: string): Promise<TripRecord> {
    const { data } = await apiClient.get<ApiEnvelope<TripRecord>>(`/trips/${id}`);
    return unwrap(data);
  },

  async statistics(): Promise<TripStatistics> {
    const { data } = await apiClient.get<ApiEnvelope<TripStatistics>>('/trips/statistics');
    return unwrap(data);
  },

  async create(payload: CreateTripInput): Promise<TripRecord> {
    const { data } = await apiClient.post<ApiEnvelope<TripRecord>>('/trips', payload);
    return unwrap(data);
  },

  async update(id: string, payload: UpdateTripInput): Promise<TripRecord> {
    const { data } = await apiClient.patch<ApiEnvelope<TripRecord>>(`/trips/${id}`, payload);
    return unwrap(data);
  },

  async remove(id: string): Promise<TripRecord> {
    const { data } = await apiClient.delete<ApiEnvelope<TripRecord>>(`/trips/${id}`);
    return unwrap(data);
  },

  async dispatch(id: string): Promise<TripRecord> {
    const { data } = await apiClient.patch<ApiEnvelope<TripRecord>>(`/trips/${id}/dispatch`);
    return unwrap(data);
  },

  async start(id: string): Promise<TripRecord> {
    const { data } = await apiClient.patch<ApiEnvelope<TripRecord>>(`/trips/${id}/start`);
    return unwrap(data);
  },

  async complete(id: string, payload: CompleteTripInput): Promise<TripRecord> {
    const { data } = await apiClient.patch<ApiEnvelope<TripRecord>>(`/trips/${id}/complete`, payload);
    return unwrap(data);
  },

  async cancel(id: string, payload: CancelTripInput = {}): Promise<TripRecord> {
    const { data } = await apiClient.patch<ApiEnvelope<TripRecord>>(`/trips/${id}/cancel`, payload);
    return unwrap(data);
  },

  async availableVehicles() {
    const { data } = await apiClient.get('/trips/available/vehicles');
    return unwrap(data) as Array<{
      _id: string;
      vehicleId: string;
      model: string;
      maxCapacity: number;
      status: string;
    }>;
  },

  async availableDrivers() {
    const { data } = await apiClient.get('/trips/available/drivers');
    return unwrap(data) as Array<{
      _id: string;
      firstName: string;
      lastName: string;
      employeeId: string;
      status: string;
      licenseStatus: string;
    }>;
  },
};
