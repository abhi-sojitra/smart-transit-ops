import { Injectable } from '@nestjs/common';
import type {
  BusinessSummary,
  ChartPoint,
  DashboardAlert,
  DashboardActivityItem,
  DashboardCharts,
  NamedMetric,
  RecentTripItem,
  ReportPeriod,
  TopDriverItem,
  TopVehicleItem,
  UpcomingMaintenanceItem,
} from '@transitops/shared-types';
import { DashboardRepository } from '../repository/dashboard.repository';
import { StatisticsService } from './statistics.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly dashboardRepository: DashboardRepository,
    private readonly statisticsService: StatisticsService,
  ) {}

  getOverview() {
    return this.statisticsService.getOverview();
  }

  async getRecentActivity(limit = 20): Promise<DashboardActivityItem[]> {
    const rows = await this.dashboardRepository.getRecentActivity(limit);
    return rows.map((row) => ({
      id: String(row.id),
      type: row.type,
      title: String(row.title ?? ''),
      description: String(row.description ?? ''),
      status: row.status ? String(row.status) : undefined,
      occurredAt: new Date(row.occurredAt).toISOString(),
      entityId: row.entityId ? String(row.entityId) : undefined,
    }));
  }

  async getAlerts(): Promise<DashboardAlert[]> {
    const now = new Date();
    const [
      license,
      suspended,
      maintenance,
      delayed,
      capacity,
      fuelMissing,
    ] = await Promise.all([
      this.dashboardRepository.getLicenseExpiringAlerts(),
      this.dashboardRepository.getSuspendedDriverAlerts(),
      this.dashboardRepository.getMaintenanceDueAlerts(now),
      this.dashboardRepository.getDelayedTripAlerts(now),
      this.dashboardRepository.getOverCapacityTripAlerts(),
      this.dashboardRepository.getFuelMissingAlerts(),
    ]);

    const merged = [
      ...license,
      ...suspended,
      ...maintenance,
      ...delayed,
      ...capacity,
      ...fuelMissing,
    ].map((row) => ({
      id: String(row.id),
      severity: row.severity as DashboardAlert['severity'],
      category: String(row.category),
      title: String(row.title),
      message: String(row.message),
      entityId: row.entityId ? String(row.entityId) : undefined,
      entityLabel: row.entityLabel ? String(row.entityLabel) : undefined,
      dueDate: row.dueDate ? new Date(row.dueDate).toISOString() : undefined,
    }));

    const severityRank: Record<DashboardAlert['severity'], number> = {
      CRITICAL: 0,
      WARNING: 1,
      INFORMATION: 2,
    };

    return merged.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
  }

  async getTopDrivers(limit = 10): Promise<TopDriverItem[]> {
    return this.dashboardRepository.getTopDrivers(limit);
  }

  async getTopVehicles(limit = 10): Promise<TopVehicleItem[]> {
    const rows = await this.dashboardRepository.getTopVehicles(limit);
    return rows.map((row) => ({
      ...row,
      roi: Number(Number(row.roi).toFixed(1)),
      revenue: Number(Number(row.revenue).toFixed(2)),
      operationalCost: Number(Number(row.operationalCost).toFixed(2)),
    }));
  }

  async getUpcomingMaintenance(limit = 10): Promise<UpcomingMaintenanceItem[]> {
    const rows = await this.dashboardRepository.getUpcomingMaintenance(limit);
    return rows.map((row) => ({
      id: String(row.id),
      vehicleId: String(row.vehicleId),
      vehicleLabel: String(row.vehicleLabel ?? 'Unknown'),
      serviceType: String(row.serviceType),
      status: String(row.status),
      date: new Date(row.date).toISOString(),
      cost: Number(row.cost ?? 0),
    }));
  }

  async getRecentTrips(limit = 10): Promise<RecentTripItem[]> {
    const rows = await this.dashboardRepository.getRecentTrips(limit);
    const items: RecentTripItem[] = [];

    for (const row of rows) {
      const plannedStartDate =
        this.safeToIso(row.plannedStartDate) ?? this.safeToIso(row.createdAt);
      if (!plannedStartDate) continue;

      items.push({
        id: String(row.id),
        tripNumber: String(row.tripNumber),
        source: String(row.source),
        destination: String(row.destination),
        status: String(row.status),
        plannedStartDate,
        revenue: Number(row.revenue ?? 0),
        ...(row.driverName ? { driverName: String(row.driverName) } : {}),
        ...(row.vehicleLabel ? { vehicleLabel: String(row.vehicleLabel) } : {}),
      });
    }

    return items;
  }

  async getBusinessSummary(period: ReportPeriod = 'monthly'): Promise<BusinessSummary> {
    const range = this.dashboardRepository.resolvePeriodRange(period);
    const [periodStats, costTotals, activeCounts] = await Promise.all([
      this.dashboardRepository.getBusinessPeriodStats(range),
      this.dashboardRepository.getOperationalCostTotals(range.start, range.end),
      this.dashboardRepository.getActiveCounts(),
    ]);

    const stats = periodStats[0] ?? {
      tripsCompleted: 0,
      tripsCancelled: 0,
      revenue: 0,
    };
    const [fuelRows, expenseRows, maintenanceRows] = costTotals;
    const fuelCost = fuelRows[0]?.total ?? 0;
    const expenseCost = expenseRows[0]?.total ?? 0;
    const maintenanceCost = maintenanceRows[0]?.total ?? 0;
    const operationalCost = fuelCost + expenseCost + maintenanceCost;
    const [vehicles, drivers, utilization] = activeCounts;
    const totalVehicles = utilization[0]?.total ?? 0;
    const onTrip = utilization[0]?.onTrip ?? 0;

    return {
      period,
      periodStart: range.start.toISOString(),
      periodEnd: range.end.toISOString(),
      tripsCompleted: stats.tripsCompleted,
      tripsCancelled: stats.tripsCancelled,
      revenue: Number(stats.revenue.toFixed(2)),
      fuelCost: Number(fuelCost.toFixed(2)),
      expenseCost: Number(expenseCost.toFixed(2)),
      maintenanceCost: Number(maintenanceCost.toFixed(2)),
      operationalCost: Number(operationalCost.toFixed(2)),
      profit: Number((stats.revenue - operationalCost).toFixed(2)),
      activeVehicles: vehicles[0]?.count ?? 0,
      activeDrivers: drivers[0]?.count ?? 0,
      utilizationRate:
        totalVehicles > 0 ? Number(((onTrip / totalVehicles) * 100).toFixed(1)) : 0,
    };
  }

  async getCharts(months = 6): Promise<DashboardCharts> {
    const [
      fleetUtilization,
      monthlyRevenue,
      expenseParts,
      fuelConsumption,
      maintenanceCost,
      tripStatus,
      tripTrend,
      driverPerformance,
      vehicleRoi,
    ] = await Promise.all([
      this.dashboardRepository.getFleetUtilizationChart(),
      this.dashboardRepository.getMonthlyRevenue(months),
      this.dashboardRepository.getMonthlyExpense(months),
      this.dashboardRepository.getFuelConsumptionTrend(months),
      this.dashboardRepository.getMaintenanceCostTrend(months),
      this.dashboardRepository.getTripStatusBreakdown(),
      this.dashboardRepository.getTripTrend(months),
      this.dashboardRepository.getTopDrivers(8),
      this.dashboardRepository.getTopVehicles(8),
    ]);

    const monthlyExpense = this.mergeMonthlyExpense(expenseParts);
    const revenueByLabel = new Map(monthlyRevenue.map((p) => [p.label, p.value]));
    const expenseByLabel = new Map(monthlyExpense.map((p) => [p.label, p.value]));
    const labels = Array.from(
      new Set([...revenueByLabel.keys(), ...expenseByLabel.keys()]),
    ).sort();

    const revenueVsExpense: ChartPoint[] = labels.map((label) => ({
      label,
      value: Number(revenueByLabel.get(label) ?? 0),
      secondary: Number(expenseByLabel.get(label) ?? 0),
    }));

    return {
      fleetUtilization,
      monthlyRevenue,
      monthlyExpense,
      fuelConsumption,
      maintenanceCost,
      tripStatus,
      tripTrend,
      revenueVsExpense,
      driverPerformance: driverPerformance.map(
        (d): NamedMetric => ({
          name: d.name,
          value: d.revenue,
          secondary: d.completedTrips,
          meta: { safetyScore: d.safetyScore, employeeCode: d.employeeCode },
        }),
      ),
      vehicleRoi: vehicleRoi.map(
        (v): NamedMetric => ({
          name: v.label,
          value: Number(Number(v.roi).toFixed(1)),
          secondary: v.revenue,
          meta: { trips: v.completedTrips, cost: v.operationalCost },
        }),
      ),
    };
  }

  private safeToIso(value: unknown): string | undefined {
    if (value == null || value === '') return undefined;
    const date = value instanceof Date ? value : new Date(String(value));
    if (Number.isNaN(date.getTime())) return undefined;
    return date.toISOString();
  }

  private mergeMonthlyExpense(
    parts: [
      Array<{ _id: string; value: number }>,
      Array<{ _id: string; value: number }>,
      Array<{ _id: string; value: number }>,
    ],
  ): ChartPoint[] {
    const totals = new Map<string, number>();
    for (const group of parts) {
      for (const row of group) {
        totals.set(row._id, (totals.get(row._id) ?? 0) + row.value);
      }
    }
    return Array.from(totals.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, value]) => ({ label, value: Number(value.toFixed(2)) }));
  }
}
