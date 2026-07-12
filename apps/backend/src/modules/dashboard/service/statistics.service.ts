import { Injectable } from '@nestjs/common';
import {
  DriverStatus,
  VehicleStatus,
  type DashboardOverview,
  type FinanceOverviewStats,
  type FleetOverviewStats,
  type DriverOverviewStats,
} from '@transitops/shared-types';
import { DashboardRepository } from '../repository/dashboard.repository';

function countByStatus(
  rows: Array<{ _id: string; count: number }>,
  status: string,
): number {
  return rows.find((row) => row._id === status)?.count ?? 0;
}

function sumCounts(rows: Array<{ _id: string; count: number }>): number {
  return rows.reduce((sum, row) => sum + row.count, 0);
}

@Injectable()
export class StatisticsService {
  constructor(private readonly dashboardRepository: DashboardRepository) {}

  async getOverview(): Promise<DashboardOverview> {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);
    const monthStart = this.dashboardRepository.monthStart(now);

    const [
      fleetRows,
      driverRows,
      licenseExpiring,
      tripOverview,
      maintenanceOverview,
      fuelMonthly,
      fuelEfficiency,
      expenseMonthly,
      costTotals,
    ] = await Promise.all([
      this.dashboardRepository.getFleetStatusCounts(),
      this.dashboardRepository.getDriverStatusCounts(),
      this.dashboardRepository.getLicenseExpiringCount(),
      this.dashboardRepository.getTripOverview(todayStart, todayEnd),
      this.dashboardRepository.getMaintenanceOverview(now),
      this.dashboardRepository.getFuelMonthlyStats(monthStart),
      this.dashboardRepository.getFuelEfficiency(),
      this.dashboardRepository.getExpenseMonthlyStats(monthStart),
      this.dashboardRepository.getOperationalCostTotals(monthStart),
    ]);

    const fleet = this.mapFleet(fleetRows);
    const drivers = this.mapDrivers(driverRows, licenseExpiring[0]?.count ?? 0);
    const trips = tripOverview[0] ?? {
      active: 0,
      completedToday: 0,
      cancelled: 0,
      total: 0,
      revenue: 0,
    };
    const maintenance = maintenanceOverview[0] ?? {
      active: 0,
      overdue: 0,
      completed: 0,
      cost: 0,
    };
    const fuel = {
      monthlyCost: fuelMonthly[0]?.monthlyCost ?? 0,
      monthlyQuantity: fuelMonthly[0]?.monthlyQuantity ?? 0,
      fuelEfficiency: Number((fuelEfficiency[0]?.fuelEfficiency ?? 0).toFixed(2)),
    };
    const expense = expenseMonthly[0] ?? {
      monthlyExpense: 0,
      pending: 0,
      approved: 0,
    };

    const [fuelCostRows, expenseCostRows, maintenanceCostRows] = costTotals;
    const operationalCost =
      (fuelCostRows[0]?.total ?? 0) +
      (expenseCostRows[0]?.total ?? 0) +
      (maintenanceCostRows[0]?.total ?? 0);

    const finance = this.mapFinance(trips.revenue, operationalCost);

    return {
      fleet,
      drivers,
      trips,
      maintenance,
      fuel,
      expense,
      finance,
      generatedAt: now.toISOString(),
    };
  }

  private mapFleet(rows: Array<{ _id: string; count: number }>): FleetOverviewStats {
    const totalVehicles = sumCounts(rows);
    const available =
      countByStatus(rows, VehicleStatus.AVAILABLE) +
      countByStatus(rows, VehicleStatus.ACTIVE);
    const onTrip = countByStatus(rows, VehicleStatus.ON_TRIP);
    const inShop =
      countByStatus(rows, VehicleStatus.MAINTENANCE) +
      countByStatus(rows, VehicleStatus.IN_SERVICE);
    const retired = countByStatus(rows, VehicleStatus.RETIRED);
    const utilizationRate =
      totalVehicles > 0 ? Number(((onTrip / totalVehicles) * 100).toFixed(1)) : 0;

    return {
      totalVehicles,
      available,
      onTrip,
      inShop,
      retired,
      utilizationRate,
    };
  }

  private mapDrivers(
    rows: Array<{ _id: string; count: number; avgSafety: number }>,
    licenseExpiring: number,
  ): DriverOverviewStats {
    const totalDrivers = sumCounts(rows);
    const weightedSafety = rows.reduce(
      (sum, row) => sum + (row.avgSafety ?? 0) * row.count,
      0,
    );

    return {
      totalDrivers,
      available: countByStatus(rows, DriverStatus.AVAILABLE),
      onTrip: countByStatus(rows, DriverStatus.ON_TRIP),
      suspended: countByStatus(rows, DriverStatus.SUSPENDED),
      offDuty: countByStatus(rows, DriverStatus.OFF_DUTY),
      licenseExpiring,
      averageSafetyScore:
        totalDrivers > 0 ? Number((weightedSafety / totalDrivers).toFixed(1)) : 0,
    };
  }

  private mapFinance(revenue: number, operationalCost: number): FinanceOverviewStats {
    const profit = revenue - operationalCost;
    const roi =
      operationalCost > 0
        ? Number(((profit / operationalCost) * 100).toFixed(1))
        : revenue > 0
          ? 100
          : 0;

    return {
      revenue: Number(revenue.toFixed(2)),
      profit: Number(profit.toFixed(2)),
      operationalCost: Number(operationalCost.toFixed(2)),
      roi,
    };
  }
}
