'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  BiExportFormat,
  BiReportFilters,
  BiReportType,
  BiScheduleFrequency,
} from '@/types/reports';
import { downloadBlob, reportsService } from '@/services/reports.service';

export const reportKeys = {
  all: ['reports'] as const,
  catalog: () => [...reportKeys.all, 'catalog'] as const,
  schedules: () => [...reportKeys.all, 'schedules'] as const,
  detail: (type: BiReportType, filters: BiReportFilters) =>
    [...reportKeys.all, type, filters] as const,
};

export function useReportCatalog() {
  return useQuery({
    queryKey: reportKeys.catalog(),
    queryFn: () => reportsService.catalog(),
  });
}

export function useReportQuery(type: BiReportType, filters: BiReportFilters) {
  return useQuery({
    queryKey: reportKeys.detail(type, filters),
    queryFn: () => reportsService.getReport(type, filters),
  });
}

export function useReportSchedules() {
  return useQuery({
    queryKey: reportKeys.schedules(),
    queryFn: () => reportsService.listSchedules(),
  });
}

export function useExportReportMutation() {
  return useMutation({
    mutationFn: async (input: {
      type: BiReportType;
      format: BiExportFormat;
      filters?: BiReportFilters;
    }) => {
      const file = await reportsService.export(input);
      downloadBlob(file.blob, file.filename);
      return file.filename;
    },
  });
}

export function useScheduleReportMutation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      type: BiReportType;
      frequency: BiScheduleFrequency;
      format: BiExportFormat;
      name?: string;
      email?: string;
      filters?: BiReportFilters;
    }) => reportsService.schedule(input),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: reportKeys.schedules() });
    },
  });
}
