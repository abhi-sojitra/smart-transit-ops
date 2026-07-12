import type {
  ApiResponse,
  ExpenseRecord,
  ExpenseStatistics,
  FuelLog,
  FuelStatistics,
  OperationalCost,
  PaginationMeta,
  TripCostSummary,
} from '@transitops/shared-types';
import { ExpenseStatus } from '@transitops/shared-types';
import { apiClient } from './api';

export interface FuelQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  vehicleId?: string;
  tripId?: string;
  driverId?: string;
  fuelType?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: string;
}

export interface ExpenseQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  vehicleId?: string;
  tripId?: string;
  driverId?: string;
  expenseType?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: string;
}

export type CreateFuelPayload = Omit<
  FuelLog,
  'id' | 'totalCost' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'
>;

export type UpdateFuelPayload = Partial<CreateFuelPayload>;

export type CreateExpensePayload = Omit<
  ExpenseRecord,
  'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'approvedBy' | 'status'
> & { status?: ExpenseStatus };

export type UpdateExpensePayload = Partial<CreateExpensePayload> & { approvedBy?: string };

function unwrap<T>(response: { data: ApiResponse<T> }): T {
  return response.data.data;
}

function unwrapPaginated<T>(response: {
  data: ApiResponse<T[], PaginationMeta>;
}): { data: T[]; meta: PaginationMeta } {
  return {
    data: response.data.data,
    meta: response.data.meta ?? { page: 1, limit: 20, total: 0, totalPages: 1 },
  };
}

export const fuelService = {
  list: (params?: FuelQueryParams) =>
    apiClient
      .get<ApiResponse<FuelLog[], PaginationMeta>>('/fuel', { params })
      .then(unwrapPaginated),

  getById: (id: string) =>
    apiClient.get<ApiResponse<FuelLog>>(`/fuel/${id}`).then(unwrap),

  create: (payload: CreateFuelPayload) =>
    apiClient.post<ApiResponse<FuelLog>>('/fuel', payload).then(unwrap),

  update: (id: string, payload: UpdateFuelPayload) =>
    apiClient.patch<ApiResponse<FuelLog>>(`/fuel/${id}`, payload).then(unwrap),

  remove: (id: string) =>
    apiClient.delete<ApiResponse<{ deleted: boolean }>>(`/fuel/${id}`).then(unwrap),

  getStatistics: (dateFrom?: string, dateTo?: string) =>
    apiClient
      .get<ApiResponse<FuelStatistics>>('/fuel/statistics', { params: { dateFrom, dateTo } })
      .then(unwrap),

  getVehicleHistory: (vehicleId: string) =>
    apiClient
      .get<ApiResponse<FuelLog[]>>(`/fuel/vehicle/${vehicleId}/history`)
      .then(unwrap),

  getVehicleCost: (vehicleId: string) =>
    apiClient
      .get<ApiResponse<OperationalCost>>(`/fuel/vehicle/${vehicleId}/cost`)
      .then(unwrap),

  getTripCost: (tripId: string) =>
    apiClient.get<ApiResponse<TripCostSummary>>(`/fuel/trip/${tripId}/cost`).then(unwrap),

  getVehicleComparison: () =>
    apiClient
      .get<ApiResponse<{ vehicleId: string; fuelCost: number; quantity: number }[]>>(
        '/fuel/comparison/vehicles',
      )
      .then(unwrap),
};

export const expenseService = {
  list: (params?: ExpenseQueryParams) =>
    apiClient
      .get<ApiResponse<ExpenseRecord[], PaginationMeta>>('/expenses', { params })
      .then(unwrapPaginated),

  getById: (id: string) =>
    apiClient.get<ApiResponse<ExpenseRecord>>(`/expenses/${id}`).then(unwrap),

  create: (payload: CreateExpensePayload) =>
    apiClient.post<ApiResponse<ExpenseRecord>>('/expenses', payload).then(unwrap),

  update: (id: string, payload: UpdateExpensePayload) =>
    apiClient.patch<ApiResponse<ExpenseRecord>>(`/expenses/${id}`, payload).then(unwrap),

  remove: (id: string) =>
    apiClient.delete<ApiResponse<{ deleted: boolean }>>(`/expenses/${id}`).then(unwrap),

  getStatistics: (dateFrom?: string, dateTo?: string) =>
    apiClient
      .get<ApiResponse<ExpenseStatistics>>('/expenses/statistics', { params: { dateFrom, dateTo } })
      .then(unwrap),

  getTripExpenses: (tripId: string) =>
    apiClient.get<ApiResponse<ExpenseRecord[]>>(`/expenses/trip/${tripId}`).then(unwrap),

  getVehicleCost: (vehicleId: string) =>
    apiClient
      .get<ApiResponse<OperationalCost>>(`/expenses/vehicle/${vehicleId}/cost`)
      .then(unwrap),
};
