'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import { driversApi } from '@/services/drivers';
import type { Driver, DriverFiltersState, DriverFormValues } from '@/types/driver';

export const driverKeys = {
  all: ['drivers'] as const,
  lists: () => [...driverKeys.all, 'list'] as const,
  list: (filters: DriverFiltersState) => [...driverKeys.lists(), filters] as const,
  details: () => [...driverKeys.all, 'detail'] as const,
  detail: (id: string) => [...driverKeys.details(), id] as const,
  statistics: () => [...driverKeys.all, 'statistics'] as const,
  available: () => [...driverKeys.all, 'available'] as const,
};

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    const msg = error.response?.data?.message;
    if (typeof msg === 'string') return msg;
    if (Array.isArray(msg)) return msg.join(', ');
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

export function useDriversQuery(filters: DriverFiltersState) {
  return useQuery({
    queryKey: driverKeys.list(filters),
    queryFn: () => driversApi.list(filters),
    placeholderData: (prev) => prev,
  });
}

export function useDriverQuery(id: string, enabled = true) {
  return useQuery({
    queryKey: driverKeys.detail(id),
    queryFn: () => driversApi.getById(id),
    enabled: Boolean(id) && enabled,
  });
}

export function useDriverStatisticsQuery() {
  return useQuery({
    queryKey: driverKeys.statistics(),
    queryFn: () => driversApi.getStatistics(),
  });
}

export function useAvailableDriversQuery(enabled = true) {
  return useQuery({
    queryKey: driverKeys.available(),
    queryFn: () => driversApi.getAvailable(),
    enabled,
  });
}

export function useCreateDriverMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: DriverFormValues) => driversApi.create(payload),
    onSuccess: () => {
      toast.success('Driver created successfully');
      void queryClient.invalidateQueries({ queryKey: driverKeys.all });
    },
    onError: (error) => toast.error(errorMessage(error, 'Failed to create driver')),
  });
}

export function useUpdateDriverMutation(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<DriverFormValues>) => driversApi.update(id, payload),
    onSuccess: (driver) => {
      toast.success('Driver updated successfully');
      queryClient.setQueryData(driverKeys.detail(id), driver);
      void queryClient.invalidateQueries({ queryKey: driverKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: driverKeys.statistics() });
    },
    onError: (error) => toast.error(errorMessage(error, 'Failed to update driver')),
  });
}

export function useDeleteDriverMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => driversApi.remove(id),
    onSuccess: () => {
      toast.success('Driver deleted successfully');
      void queryClient.invalidateQueries({ queryKey: driverKeys.all });
    },
    onError: (error) => toast.error(errorMessage(error, 'Failed to delete driver')),
  });
}

export function useUpdateDriverStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      driversApi.updateStatus(id, status),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: driverKeys.detail(id) });
      const previous = queryClient.getQueryData<Driver>(driverKeys.detail(id));
      if (previous) {
        queryClient.setQueryData(driverKeys.detail(id), {
          ...previous,
          status,
        });
      }
      return { previous };
    },
    onError: (error, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(driverKeys.detail(variables.id), context.previous);
      }
      toast.error(errorMessage(error, 'Failed to update status'));
    },
    onSuccess: (driver, variables) => {
      toast.success('Driver status updated');
      queryClient.setQueryData(driverKeys.detail(variables.id), driver);
      void queryClient.invalidateQueries({ queryKey: driverKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: driverKeys.statistics() });
      void queryClient.invalidateQueries({ queryKey: driverKeys.available() });
    },
  });
}
