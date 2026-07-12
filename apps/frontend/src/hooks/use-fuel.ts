'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fuelService,
  type CreateFuelPayload,
  type FuelQueryParams,
  type UpdateFuelPayload,
} from '@/services/fuel-expense.service';

export const fuelKeys = {
  all: ['fuel'] as const,
  lists: () => [...fuelKeys.all, 'list'] as const,
  list: (params?: FuelQueryParams) => [...fuelKeys.lists(), params] as const,
  details: () => [...fuelKeys.all, 'detail'] as const,
  detail: (id: string) => [...fuelKeys.details(), id] as const,
  statistics: (dateFrom?: string, dateTo?: string) =>
    [...fuelKeys.all, 'statistics', dateFrom, dateTo] as const,
  comparison: () => [...fuelKeys.all, 'comparison'] as const,
};

export function useFuelList(params?: FuelQueryParams) {
  return useQuery({
    queryKey: fuelKeys.list(params),
    queryFn: () => fuelService.list(params),
  });
}

export function useFuelDetail(id: string, enabled = true) {
  return useQuery({
    queryKey: fuelKeys.detail(id),
    queryFn: () => fuelService.getById(id),
    enabled: enabled && Boolean(id),
  });
}

export function useFuelStatistics(dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: fuelKeys.statistics(dateFrom, dateTo),
    queryFn: () => fuelService.getStatistics(dateFrom, dateTo),
  });
}

export function useVehicleFuelComparison() {
  return useQuery({
    queryKey: fuelKeys.comparison(),
    queryFn: () => fuelService.getVehicleComparison(),
  });
}

export function useCreateFuel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateFuelPayload) => fuelService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fuelKeys.all });
    },
  });
}

export function useUpdateFuel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateFuelPayload }) =>
      fuelService.update(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: fuelKeys.all });
      queryClient.invalidateQueries({ queryKey: fuelKeys.detail(variables.id) });
    },
  });
}

export function useDeleteFuel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fuelService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fuelKeys.all });
    },
  });
}
