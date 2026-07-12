'use client';

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import { fleetApi } from '@/services/fleet';
import type { Vehicle, VehicleFiltersState, VehicleFormValues } from '@/types/fleet';

export const fleetKeys = {
  all: ['fleet'] as const,
  lists: () => [...fleetKeys.all, 'list'] as const,
  list: (filters: VehicleFiltersState) => [...fleetKeys.lists(), filters] as const,
  details: () => [...fleetKeys.all, 'detail'] as const,
  detail: (id: string) => [...fleetKeys.details(), id] as const,
  statistics: () => [...fleetKeys.all, 'statistics'] as const,
  available: () => [...fleetKeys.all, 'available'] as const,
  infinite: (search: string) => [...fleetKeys.lists(), 'infinite', search] as const,
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

export function useFleetQuery(filters: VehicleFiltersState) {
  return useQuery({
    queryKey: fleetKeys.list(filters),
    queryFn: () => fleetApi.list(filters),
    placeholderData: (prev) => prev,
  });
}

const FLEET_INFINITE_BASE: Omit<VehicleFiltersState, 'page' | 'limit' | 'search'> = {
  status: 'ALL',
  vehicleType: 'ALL',
  fuelType: 'ALL',
  depotCity: '',
  depotState: '',
  yearMin: '',
  yearMax: '',
  mileageMin: '',
  mileageMax: '',
  sortBy: 'vehicleId',
  sortOrder: 'asc',
};

const FLEET_PAGE_SIZE = 20;

/** Paginated fleet list for scroll-loading vehicle pickers. */
export function useFleetInfiniteQuery(search = '', enabled = true) {
  return useInfiniteQuery({
    queryKey: fleetKeys.infinite(search),
    queryFn: ({ pageParam }) =>
      fleetApi.list({
        ...FLEET_INFINITE_BASE,
        search,
        page: pageParam,
        limit: FLEET_PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const meta = lastPage.meta;
      if (!meta || meta.page >= meta.totalPages) return undefined;
      return meta.page + 1;
    },
    enabled,
  });
}

export function useVehicleQuery(id: string, enabled = true) {
  return useQuery({
    queryKey: fleetKeys.detail(id),
    queryFn: () => fleetApi.getById(id),
    enabled: Boolean(id) && enabled,
  });
}

export function useVehicleStatisticsQuery() {
  return useQuery({
    queryKey: fleetKeys.statistics(),
    queryFn: () => fleetApi.getStatistics(),
  });
}

export function useAvailableVehiclesQuery(enabled = true) {
  return useQuery({
    queryKey: fleetKeys.available(),
    queryFn: () => fleetApi.getAvailable(),
    enabled,
  });
}

export function useCreateVehicleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: VehicleFormValues) => fleetApi.create(payload),
    onSuccess: () => {
      toast.success('Vehicle created successfully');
      void queryClient.invalidateQueries({ queryKey: fleetKeys.all });
    },
    onError: (error) => toast.error(errorMessage(error, 'Failed to create vehicle')),
  });
}

export function useUpdateVehicleMutation(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<VehicleFormValues>) => fleetApi.update(id, payload),
    onSuccess: (vehicle) => {
      toast.success('Vehicle updated successfully');
      queryClient.setQueryData(fleetKeys.detail(id), vehicle);
      void queryClient.invalidateQueries({ queryKey: fleetKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: fleetKeys.statistics() });
    },
    onError: (error) => toast.error(errorMessage(error, 'Failed to update vehicle')),
  });
}

export function useDeleteVehicleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fleetApi.remove(id),
    onSuccess: () => {
      toast.success('Vehicle deleted successfully');
      void queryClient.invalidateQueries({ queryKey: fleetKeys.all });
    },
    onError: (error) => toast.error(errorMessage(error, 'Failed to delete vehicle')),
  });
}

export function useUpdateVehicleStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      fleetApi.updateStatus(id, status),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: fleetKeys.detail(id) });
      const previous = queryClient.getQueryData<Vehicle>(fleetKeys.detail(id));
      if (previous) {
        queryClient.setQueryData(fleetKeys.detail(id), { ...previous, status });
      }
      return { previous };
    },
    onError: (error, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(fleetKeys.detail(variables.id), context.previous);
      }
      toast.error(errorMessage(error, 'Failed to update status'));
    },
    onSuccess: (vehicle, variables) => {
      toast.success('Vehicle status updated');
      queryClient.setQueryData(fleetKeys.detail(variables.id), vehicle);
      void queryClient.invalidateQueries({ queryKey: fleetKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: fleetKeys.statistics() });
      void queryClient.invalidateQueries({ queryKey: fleetKeys.available() });
    },
  });
}
