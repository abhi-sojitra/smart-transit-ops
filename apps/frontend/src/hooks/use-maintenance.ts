'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  maintenanceKeys,
  maintenanceService,
} from '@/services/maintenance.service';
import type { MaintenanceFormValues, MaintenanceListParams } from '@/types/maintenance';

export function useMaintenanceList(params: MaintenanceListParams) {
  return useQuery({
    queryKey: maintenanceKeys.list(params),
    queryFn: () => maintenanceService.list(params),
  });
}

export function useMaintenanceDetail(id: string, enabled = true) {
  return useQuery({
    queryKey: maintenanceKeys.detail(id),
    queryFn: () => maintenanceService.getById(id),
    enabled: Boolean(id) && enabled,
  });
}

export function useMaintenanceStatistics() {
  return useQuery({
    queryKey: maintenanceKeys.statistics(),
    queryFn: () => maintenanceService.getStatistics(),
  });
}

export function useMaintenanceVehicles() {
  return useQuery({
    queryKey: maintenanceKeys.vehicles(),
    queryFn: () => maintenanceService.listVehicles(),
  });
}

export function useCreateMaintenance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: MaintenanceFormValues) => maintenanceService.create(payload),
    onSuccess: () => {
      toast.success('Maintenance created');
      void queryClient.invalidateQueries({ queryKey: maintenanceKeys.all });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Failed to create maintenance'));
    },
  });
}

export function useUpdateMaintenance(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<MaintenanceFormValues>) =>
      maintenanceService.update(id, payload),
    onSuccess: (data) => {
      toast.success('Maintenance updated');
      void queryClient.invalidateQueries({ queryKey: maintenanceKeys.all });
      queryClient.setQueryData(maintenanceKeys.detail(id), data);
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Failed to update maintenance'));
    },
  });
}

export function useDeleteMaintenance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => maintenanceService.remove(id),
    onSuccess: () => {
      toast.success('Maintenance deleted');
      void queryClient.invalidateQueries({ queryKey: maintenanceKeys.all });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Failed to delete maintenance'));
    },
  });
}

export function useStartMaintenance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => maintenanceService.start(id),
    onSuccess: () => {
      toast.success('Maintenance started — status is now In Progress');
      void queryClient.invalidateQueries({ queryKey: maintenanceKeys.all });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Failed to start maintenance'));
    },
  });
}

export function useCompleteMaintenance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      actualCost,
      notes,
    }: {
      id: string;
      actualCost?: number;
      notes?: string;
    }) => maintenanceService.complete(id, { actualCost, notes }),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: maintenanceKeys.detail(id) });
      const previous = queryClient.getQueryData(maintenanceKeys.detail(id));
      queryClient.setQueryData(maintenanceKeys.detail(id), (old: Record<string, unknown> | undefined) =>
        old ? { ...old, status: 'COMPLETED' } : old,
      );
      return { previous, id };
    },
    onError: (error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(maintenanceKeys.detail(context.id), context.previous);
      }
      toast.error(getErrorMessage(error, 'Failed to complete maintenance'));
    },
    onSuccess: () => {
      toast.success('Maintenance completed — vehicle restored to Available');
      void queryClient.invalidateQueries({ queryKey: maintenanceKeys.all });
    },
  });
}

export function useCancelMaintenance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      maintenanceService.cancel(id, { notes }),
    onSuccess: () => {
      toast.success('Maintenance cancelled');
      void queryClient.invalidateQueries({ queryKey: maintenanceKeys.all });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Failed to cancel maintenance'));
    },
  });
}

export function useUploadMaintenanceAttachments(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (files: File[]) => maintenanceService.uploadAttachments(id, files),
    onSuccess: () => {
      toast.success('Attachments uploaded');
      void queryClient.invalidateQueries({ queryKey: maintenanceKeys.detail(id) });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Failed to upload attachments'));
    },
  });
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string | string[] } } }).response;
    const message = response?.data?.message;
    if (Array.isArray(message)) return message.join(', ');
    if (typeof message === 'string') return message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
