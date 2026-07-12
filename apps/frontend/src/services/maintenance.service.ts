import type { ApiResponse } from '@transitops/shared-types';
import { apiClient } from '@/services/api';
import type {
  Maintenance,
  MaintenanceDetail,
  MaintenanceFormValues,
  MaintenanceListParams,
  MaintenanceListResponse,
  MaintenanceStatistics,
  VehicleLookup,
} from '@/types/maintenance';

function unwrap<T>(payload: ApiResponse<T> | T): T {
  if (payload && typeof payload === 'object' && 'data' in payload && 'success' in payload) {
    return (payload as ApiResponse<T>).data;
  }
  return payload as T;
}

function unwrapList(payload: unknown): MaintenanceListResponse {
  if (payload && typeof payload === 'object' && 'data' in payload && 'meta' in payload) {
    const p = payload as MaintenanceListResponse & { success?: boolean };
    return { data: p.data, meta: p.meta };
  }
  if (payload && typeof payload === 'object' && 'success' in payload && 'data' in payload) {
    const p = payload as ApiResponse<Maintenance[]> & { meta?: MaintenanceListResponse['meta'] };
    return {
      data: p.data,
      meta: p.meta ?? { page: 1, limit: 10, total: p.data.length, totalPages: 1 },
    };
  }
  return { data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 1 } };
}

export const maintenanceKeys = {
  all: ['maintenance'] as const,
  lists: () => [...maintenanceKeys.all, 'list'] as const,
  list: (params: MaintenanceListParams) => [...maintenanceKeys.lists(), params] as const,
  details: () => [...maintenanceKeys.all, 'detail'] as const,
  detail: (id: string) => [...maintenanceKeys.details(), id] as const,
  statistics: () => [...maintenanceKeys.all, 'statistics'] as const,
  vehicles: () => [...maintenanceKeys.all, 'vehicles'] as const,
};

export const maintenanceService = {
  async list(params: MaintenanceListParams = {}): Promise<MaintenanceListResponse> {
    const { data } = await apiClient.get('/maintenance', { params });
    return unwrapList(data);
  },

  async getById(id: string): Promise<MaintenanceDetail> {
    const { data } = await apiClient.get(`/maintenance/${id}`);
    return unwrap<MaintenanceDetail>(data);
  },

  async getStatistics(): Promise<MaintenanceStatistics> {
    const { data } = await apiClient.get('/maintenance/statistics');
    return unwrap<MaintenanceStatistics>(data);
  },

  async listVehicles(): Promise<VehicleLookup[]> {
    const { data } = await apiClient.get('/maintenance/lookups/vehicles');
    return unwrap<VehicleLookup[]>(data);
  },

  async create(payload: MaintenanceFormValues): Promise<Maintenance> {
    const { data } = await apiClient.post('/maintenance', toCreateBody(payload));
    return unwrap<Maintenance>(data);
  },

  async update(id: string, payload: Partial<MaintenanceFormValues>): Promise<Maintenance> {
    const { vehicleId: _, ...rest } = payload;
    void _;
    const { data } = await apiClient.patch(`/maintenance/${id}`, sanitizePayload(rest));
    return unwrap<Maintenance>(data);
  },

  async remove(id: string): Promise<{ id: string; deleted: boolean }> {
    const { data } = await apiClient.delete(`/maintenance/${id}`);
    return unwrap(data);
  },

  async start(id: string): Promise<Maintenance> {
    const { data } = await apiClient.patch(`/maintenance/${id}/start`);
    return unwrap<Maintenance>(data);
  },

  async complete(
    id: string,
    payload: { actualCost?: number; notes?: string } = {},
  ): Promise<Maintenance> {
    const { data } = await apiClient.patch(`/maintenance/${id}/complete`, payload);
    return unwrap<Maintenance>(data);
  },

  async cancel(id: string, payload: { notes?: string } = {}): Promise<Maintenance> {
    const { data } = await apiClient.patch(`/maintenance/${id}/cancel`, payload);
    return unwrap<Maintenance>(data);
  },

  async uploadAttachments(id: string, files: File[]): Promise<Maintenance> {
    const form = new FormData();
    files.forEach((file) => form.append('files', file));
    const { data } = await apiClient.post(`/maintenance/${id}/attachments`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return unwrap<Maintenance>(data);
  },
};

function sanitizePayload(payload: Partial<MaintenanceFormValues>) {
  const body: Record<string, unknown> = { ...payload };
  if (body.actualCost === '' || body.actualCost === undefined) delete body.actualCost;
  if (body.odometerReading === '' || body.odometerReading === undefined) delete body.odometerReading;
  if (body.nextServiceDue === '') delete body.nextServiceDue;
  if (typeof body.estimatedCost === 'string') body.estimatedCost = Number(body.estimatedCost);
  if (typeof body.actualCost === 'string') body.actualCost = Number(body.actualCost);
  if (typeof body.odometerReading === 'string') body.odometerReading = Number(body.odometerReading);
  delete body.vehicleId; // only on create — caller includes when needed
  return body;
}

// Fix create to keep vehicleId
export function toCreateBody(payload: MaintenanceFormValues) {
  const body = sanitizePayload(payload);
  body.vehicleId = payload.vehicleId;
  return body;
}
