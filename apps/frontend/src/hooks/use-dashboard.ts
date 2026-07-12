'use client';

import { useQuery } from '@tanstack/react-query';
import type { ReportPeriod } from '@transitops/shared-types';
import {
  analyticsService,
  dashboardService,
  type DashboardLimitParams,
} from '@/services/dashboard.service';

const REFRESH_MS = 60_000;

export const dashboardKeys = {
  all: ['dashboard'] as const,
  overview: () => [...dashboardKeys.all, 'overview'] as const,
  activity: (limit?: number) => [...dashboardKeys.all, 'activity', limit] as const,
  charts: () => [...dashboardKeys.all, 'charts'] as const,
  alerts: () => [...dashboardKeys.all, 'alerts'] as const,
  topDrivers: (limit?: number) => [...dashboardKeys.all, 'top-drivers', limit] as const,
  topVehicles: (limit?: number) => [...dashboardKeys.all, 'top-vehicles', limit] as const,
  upcomingMaintenance: (limit?: number) =>
    [...dashboardKeys.all, 'upcoming-maintenance', limit] as const,
  recentTrips: (limit?: number) => [...dashboardKeys.all, 'recent-trips', limit] as const,
  businessSummary: (period?: ReportPeriod) =>
    [...dashboardKeys.all, 'business-summary', period] as const,
};

export const analyticsKeys = {
  all: ['analytics'] as const,
  charts: (months?: number) => [...analyticsKeys.all, 'charts', months] as const,
  summary: (period?: ReportPeriod) => [...analyticsKeys.all, 'summary', period] as const,
  reports: (period?: ReportPeriod) => [...analyticsKeys.all, 'reports', period] as const,
};

export function useDashboardOverview() {
  return useQuery({
    queryKey: dashboardKeys.overview(),
    queryFn: () => dashboardService.getOverview(),
    refetchInterval: REFRESH_MS,
  });
}

export function useDashboardActivity(limit = 20) {
  return useQuery({
    queryKey: dashboardKeys.activity(limit),
    queryFn: () => dashboardService.getRecentActivity({ limit }),
    refetchInterval: REFRESH_MS,
  });
}

export function useDashboardCharts() {
  return useQuery({
    queryKey: dashboardKeys.charts(),
    queryFn: () => dashboardService.getCharts(),
    refetchInterval: REFRESH_MS,
  });
}

export function useDashboardAlerts() {
  return useQuery({
    queryKey: dashboardKeys.alerts(),
    queryFn: () => dashboardService.getAlerts(),
    refetchInterval: REFRESH_MS,
  });
}

export function useTopDrivers(params?: DashboardLimitParams) {
  return useQuery({
    queryKey: dashboardKeys.topDrivers(params?.limit),
    queryFn: () => dashboardService.getTopDrivers(params),
  });
}

export function useTopVehicles(params?: DashboardLimitParams) {
  return useQuery({
    queryKey: dashboardKeys.topVehicles(params?.limit),
    queryFn: () => dashboardService.getTopVehicles(params),
  });
}

export function useUpcomingMaintenance(params?: DashboardLimitParams) {
  return useQuery({
    queryKey: dashboardKeys.upcomingMaintenance(params?.limit),
    queryFn: () => dashboardService.getUpcomingMaintenance(params),
  });
}

export function useRecentTrips(params?: DashboardLimitParams) {
  return useQuery({
    queryKey: dashboardKeys.recentTrips(params?.limit),
    queryFn: () => dashboardService.getRecentTrips(params),
  });
}

export function useBusinessSummary(period: ReportPeriod = 'monthly') {
  return useQuery({
    queryKey: dashboardKeys.businessSummary(period),
    queryFn: () => dashboardService.getBusinessSummary({ period }),
  });
}

export function useAnalyticsCharts(months = 6) {
  return useQuery({
    queryKey: analyticsKeys.charts(months),
    queryFn: () => analyticsService.getCharts(months),
    refetchInterval: REFRESH_MS,
  });
}

export function useAnalyticsReports(period: ReportPeriod = 'monthly') {
  return useQuery({
    queryKey: analyticsKeys.reports(period),
    queryFn: () => analyticsService.getReports(period),
  });
}
