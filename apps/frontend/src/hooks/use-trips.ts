'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { tripService } from '@/services/trip.service';
import type {
  CancelTripInput,
  CompleteTripInput,
  CreateTripInput,
  TripListParams,
  UpdateTripInput,
} from '@/types/trip';

export const tripKeys = {
  all: ['trips'] as const,
  lists: () => [...tripKeys.all, 'list'] as const,
  list: (params: TripListParams) => [...tripKeys.lists(), params] as const,
  details: () => [...tripKeys.all, 'detail'] as const,
  detail: (id: string) => [...tripKeys.details(), id] as const,
  stats: () => [...tripKeys.all, 'statistics'] as const,
  availableVehicles: () => [...tripKeys.all, 'available-vehicles'] as const,
  availableDrivers: () => [...tripKeys.all, 'available-drivers'] as const,
};

function errorMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string | string[]; errors?: string[] } } })
      .response;
    const message = response?.data?.message;
    const errors = response?.data?.errors;
    if (Array.isArray(errors) && errors.length) return errors.join('\n');
    if (typeof message === 'string') return message;
    if (Array.isArray(message)) return message.join('\n');
  }
  return fallback;
}

export function useTrips(params: TripListParams) {
  return useQuery({
    queryKey: tripKeys.list(params),
    queryFn: () => tripService.list(params),
  });
}

export function useTrip(id: string) {
  return useQuery({
    queryKey: tripKeys.detail(id),
    queryFn: () => tripService.getById(id),
    enabled: Boolean(id),
  });
}

export function useTripStatistics() {
  return useQuery({
    queryKey: tripKeys.stats(),
    queryFn: () => tripService.statistics(),
  });
}

export function useAvailableVehicles() {
  return useQuery({
    queryKey: tripKeys.availableVehicles(),
    queryFn: () => tripService.availableVehicles(),
  });
}

export function useAvailableDrivers() {
  return useQuery({
    queryKey: tripKeys.availableDrivers(),
    queryFn: () => tripService.availableDrivers(),
  });
}

export function useCreateTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTripInput) => tripService.create(payload),
    onSuccess: () => {
      toast.success('Trip created');
      qc.invalidateQueries({ queryKey: tripKeys.all });
    },
    onError: (error) => toast.error(errorMessage(error, 'Validation failed')),
  });
}

export function useUpdateTrip(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateTripInput) => tripService.update(id, payload),
    onSuccess: () => {
      toast.success('Trip updated');
      qc.invalidateQueries({ queryKey: tripKeys.all });
    },
    onError: (error) => toast.error(errorMessage(error, 'Validation failed')),
  });
}

export function useDispatchTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tripService.dispatch(id),
    onSuccess: () => {
      toast.success('Trip dispatched');
      qc.invalidateQueries({ queryKey: tripKeys.all });
    },
    onError: (error) => toast.error(errorMessage(error, 'Validation failed')),
  });
}

export function useStartTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tripService.start(id),
    onSuccess: () => {
      toast.success('Trip started');
      qc.invalidateQueries({ queryKey: tripKeys.all });
    },
    onError: (error) => toast.error(errorMessage(error, 'Failed to start trip')),
  });
}

export function useCompleteTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CompleteTripInput }) =>
      tripService.complete(id, payload),
    onSuccess: () => {
      toast.success('Trip completed');
      qc.invalidateQueries({ queryKey: tripKeys.all });
    },
    onError: (error) => toast.error(errorMessage(error, 'Validation failed')),
  });
}

export function useCancelTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload?: CancelTripInput }) =>
      tripService.cancel(id, payload),
    onSuccess: () => {
      toast.success('Trip cancelled');
      qc.invalidateQueries({ queryKey: tripKeys.all });
    },
    onError: (error) => toast.error(errorMessage(error, 'Validation failed')),
  });
}

export function useDeleteTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tripService.remove(id),
    onSuccess: () => {
      toast.success('Trip deleted');
      qc.invalidateQueries({ queryKey: tripKeys.all });
    },
    onError: (error) => toast.error(errorMessage(error, 'Failed to delete trip')),
  });
}
