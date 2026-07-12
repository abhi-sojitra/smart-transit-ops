import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type {
  BiChartPoint,
  BiExecutiveReport,
  BiKpiMetric,
  BiReportBase,
  BiReportType,
  BiScheduledReport,
  JwtPayload,
} from '@transitops/shared-types';
import { RoleCode } from '@transitops/shared-types';
import { ReportsRepository } from '../repository/reports.repository';
import { ReportInsightsService } from './insights.service';
import { ReportExportService } from '../export/report-export.service';
import type { ExportReportDto, ReportQueryDto, ScheduleReportDto } from '../dto/report-query.dto';
import { ReportSchedule, ReportScheduleDocument } from '../schema/report-schedule.schema';
import { round2, safeDiv } from '../aggregation/report-pipelines';

@Injectable()
export class ReportsService {
  constructor(
    private readonly repo: ReportsRepository,
    private readonly insights: ReportInsightsService,
    private readonly exporter: ReportExportService,
    @InjectModel(ReportSchedule.name)
    private readonly scheduleModel: Model<ReportScheduleDocument>,
  ) {}

  catalog() {
    return [
      {
        type: 'executive' as const,
        title: 'Executive Summary',
        description: 'Company-wide KPIs, profit, utilization, and leaders.',
        href: '/reports/executive',
      },
      {
        type: 'fleet' as const,
        title: 'Fleet Report',
        description: 'Utilization, downtime, ROI, and vehicle health.',
        href: '/reports/fleet',
      },
      {
        type: 'drivers' as const,
        title: 'Driver Report',
        description: 'Productivity, revenue, safety, and license risk.',
        href: '/reports/drivers',
      },
      {
        type: 'vehicles' as const,
        title: 'Vehicle Report',
        description: 'Per-vehicle trips, costs, revenue, and ROI.',
        href: '/reports/vehicles',
      },
      {
        type: 'trips' as const,
        title: 'Trip Report',
        description: 'Success rate, routes, delays, and revenue mix.',
        href: '/reports/trips',
      },
      {
        type: 'maintenance' as const,
        title: 'Maintenance Report',
        description: 'Active/overdue work, vendors, and cost trends.',
        href: '/reports/maintenance',
      },
      {
        type: 'fuel' as const,
        title: 'Fuel Report',
        description: 'Consumption, efficiency, and cost per kilometer.',
        href: '/reports/fuel',
      },
      {
        type: 'expenses' as const,
        title: 'Expense Report',
        description: 'Category spend, approvals, and trends.',
        href: '/reports/expenses',
      },
      {
        type: 'financial' as const,
        title: 'Financial Report',
        description: 'Revenue, operational cost, profit, and margins.',
        href: '/reports/financial',
      },
      {
        type: 'profitability' as const,
        title: 'Profitability Report',
        description: 'ROI and contribution by vehicle and route.',
        href: '/reports/profitability',
      },
    ];
  }

  async getReport(type: BiReportType, query: ReportQueryDto, user?: JwtPayload) {
    this.assertCanAccess(type, user);
    switch (type) {
      case 'executive':
        return this.getExecutive(query);
      case 'fleet':
        return this.getFleet(query);
      case 'drivers':
        return this.getDrivers(query, user);
      case 'vehicles':
        return this.getVehicles(query);
      case 'trips':
        return this.getTrips(query);
      case 'maintenance':
        return this.getMaintenance(query);
      case 'fuel':
        return this.getFuel(query);
      case 'expenses':
        return this.getExpenses(query);
      case 'financial':
        return this.getFinancial(query);
      case 'profitability':
        return this.getProfitability(query);
      default:
        return this.getExecutive(query);
    }
  }

  async export(dto: ExportReportDto, user?: JwtPayload) {
    const report = await this.getReport(dto.type, dto, user);
    return this.exporter.export(report, dto.format);
  }

  async schedule(dto: ScheduleReportDto, user?: JwtPayload): Promise<BiScheduledReport> {
    this.assertCanAccess(dto.type, user);
    const nextRunAt = this.nextRun(dto.frequency);
    const created = await this.scheduleModel.create({
      name: dto.name ?? `${dto.type}-${dto.frequency}`,
      type: dto.type,
      frequency: dto.frequency,
      format: dto.format,
      filters: this.pickFilters(dto),
      email: dto.email,
      nextRunAt,
      isActive: true,
      createdBy: user?.sub,
    });
    return this.mapSchedule(created);
  }

  async listSchedules(user?: JwtPayload): Promise<BiScheduledReport[]> {
    const filter =
      user && this.isDriverOnly(user)
        ? { createdBy: user.sub, isActive: true }
        : { isActive: true };
    const rows = await this.scheduleModel.find(filter).sort({ createdAt: -1 }).limit(50).exec();
    return rows.map((row) => this.mapSchedule(row));
  }

  private async getExecutive(query: ReportQueryDto): Promise<BiExecutiveReport> {
    const { start, end } = this.repo.getDateRange(query);
    const [fleet, drivers, trips, costs, trends, topVehicles, topDrivers, lowVehicles, highCost, highFuel, licenseExpiring] =
      await Promise.all([
        this.repo.getFleetStatusCounts(),
        this.repo.getDriverStatusCounts(),
        this.repo.getTripFinancials(query),
        this.repo.getOperationalCosts(query),
        this.repo.getMonthlyTrends(query),
        this.repo.getTopVehiclesByRevenue(5, query),
        this.repo.getTopDriversByRevenue(5, query),
        this.repo.getLowestVehiclesByRevenue(5, query),
        this.repo.getHighestCostVehicles(5, query),
        this.repo.getHighestFuelVehicles(5, query),
        this.repo.countLicenseExpiring(30),
      ]);

    const operationalCost = costs.fuelCost + costs.expenseCost + costs.maintenanceCost;
    const profit = trips.revenue - operationalCost;
    const fleetUtilization = safeDiv(trips.completed * 100, fleet.total || 1);
    const vehicleRoi = safeDiv((trips.revenue - operationalCost) * 100, operationalCost || 1);

    const summary = {
      totalRevenue: round2(trips.revenue),
      totalOperationalCost: round2(operationalCost),
      profit: round2(profit),
      fleetUtilization,
      tripsCompleted: trips.completed,
      tripsCancelled: trips.cancelled,
      vehiclesAvailable: fleet.available,
      vehiclesInMaintenance: fleet.maintenance,
      driversAvailable: drivers.available,
      driversSuspended: drivers.suspended,
      fuelConsumption: round2(costs.fuelQty),
      maintenanceCost: round2(costs.maintenanceCost),
      expenseCost: round2(costs.expenseCost),
      vehicleRoi,
    };

    const kpis: BiKpiMetric[] = [
      { key: 'totalRevenue', label: 'Total Revenue', value: summary.totalRevenue, unit: 'USD' },
      {
        key: 'totalOperationalCost',
        label: 'Operational Cost',
        value: summary.totalOperationalCost,
        unit: 'USD',
      },
      { key: 'profit', label: 'Profit', value: summary.profit, unit: 'USD' },
      {
        key: 'fleetUtilization',
        label: 'Fleet Utilization',
        value: summary.fleetUtilization,
        unit: '%',
      },
      { key: 'tripsCompleted', label: 'Trips Completed', value: summary.tripsCompleted },
      { key: 'tripsCancelled', label: 'Trips Cancelled', value: summary.tripsCancelled },
      { key: 'maintenanceCost', label: 'Maintenance Cost', value: summary.maintenanceCost, unit: 'USD' },
      { key: 'vehicleRoi', label: 'Vehicle ROI', value: summary.vehicleRoi, unit: '%' },
    ];

    const charts = {
      revenueTrend: toPoints(trends.revenue),
      expenseTrend: mergeCostTrends(trends.fuel, trends.expenses, trends.maintenance),
      fuelConsumption: trends.fuel.map((r: { _id: string; qty?: number; value: number }) => ({
        label: r._id,
        value: round2(r.qty ?? 0),
        secondary: round2(r.value),
      })),
      profitTrend: toPoints(trends.revenue).map((point, index) => {
        const fuel = Number(trends.fuel[index]?.value ?? 0);
        const expense = Number(trends.expenses[index]?.value ?? 0);
        const maint = Number(trends.maintenance[index]?.value ?? 0);
        return {
          label: point.label,
          value: round2(point.value - fuel - expense - maint),
        };
      }),
      fleetUtilization: [
        { label: 'Available', value: fleet.available },
        { label: 'On Trip', value: fleet.onTrip },
        { label: 'In Shop', value: fleet.maintenance },
        { label: 'Retired', value: fleet.retired },
      ],
    };

    const leaderboards = {
      topRevenueVehicles: topVehicles,
      topRevenueDrivers: topDrivers,
      lowestPerformingVehicles: lowVehicles,
      highestCostVehicles: highCost,
      highestMaintenanceVehicles: highCost.map((r) => ({
        ...r,
        value: Number(r.meta?.maintenance ?? r.secondary ?? 0),
      })),
      highestFuelVehicles: highFuel,
    };

    const base: BiReportBase = {
      type: 'executive',
      title: 'Executive Summary',
      generatedAt: new Date().toISOString(),
      periodStart: start.toISOString(),
      periodEnd: end.toISOString(),
      kpis,
      charts,
      leaderboards,
      insights: [],
    };
    base.insights = this.insights.build({
      ...base,
      extras: { licenseExpiringSoon: licenseExpiring },
    });

    return { ...base, type: 'executive', summary };
  }

  private async getFleet(query: ReportQueryDto): Promise<BiReportBase> {
    const exec = await this.getExecutive(query);
    const downtime = exec.summary.vehiclesInMaintenance + (exec.charts.fleetUtilization.find((x) => x.label === 'On Trip')?.value ?? 0);
    return {
      ...exec,
      type: 'fleet',
      title: 'Fleet Report',
      kpis: [
        ...exec.kpis.filter((k) =>
          ['fleetUtilization', 'vehicleRoi', 'tripsCompleted', 'maintenanceCost'].includes(k.key),
        ),
        {
          key: 'availability',
          label: 'Vehicles Available',
          value: exec.summary.vehiclesAvailable,
        },
        { key: 'downtimeUnits', label: 'Busy / In-Shop Units', value: downtime },
        {
          key: 'avgRevenuePerVehicle',
          label: 'Avg Revenue / Vehicle',
          value: safeDiv(exec.summary.totalRevenue, Math.max(1, exec.charts.fleetUtilization.reduce((s, p) => s + p.value, 0))),
          unit: 'USD',
        },
      ],
      insights: this.insights.build(exec),
    };
  }

  private async getDrivers(query: ReportQueryDto, user?: JwtPayload): Promise<BiReportBase> {
    const { start, end } = this.repo.getDateRange(query);
    let board = await this.repo.getDriverLeaderboard(query);
    if (user && this.isDriverOnly(user)) {
      board = board.filter((row) => row.id === user.sub || row.subtitle === user.email);
    }
    const completed = board.reduce((s, r) => s + Number(r.secondary ?? 0), 0);
    const revenue = board.reduce((s, r) => s + Number(r.value ?? 0), 0);
    const cancelled = board.reduce((s, r) => s + Number(r.meta?.cancelled ?? 0), 0);
    const licenseExpiring = board.reduce(
      (s, r) => s + Number(r.meta?.licenseExpiringSoon ?? 0),
      0,
    );
    const workingDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86_400_000));
    const kpis: BiKpiMetric[] = [
      { key: 'totalTrips', label: 'Total Trips', value: board.reduce((s, r) => s + Number(r.meta?.totalTrips ?? 0), 0) },
      { key: 'completedTrips', label: 'Completed Trips', value: completed },
      { key: 'cancelledTrips', label: 'Cancelled Trips', value: cancelled },
      { key: 'revenue', label: 'Revenue Generated', value: round2(revenue), unit: 'USD' },
      {
        key: 'driverProductivity',
        label: 'Driver Productivity',
        value: safeDiv(completed, workingDays),
      },
      { key: 'avgRevenue', label: 'Avg Revenue / Driver', value: safeDiv(revenue, board.length || 1), unit: 'USD' },
    ];
    const base: BiReportBase = {
      type: 'drivers',
      title: 'Driver Report',
      generatedAt: new Date().toISOString(),
      periodStart: start.toISOString(),
      periodEnd: end.toISOString(),
      kpis,
      charts: {
        driverPerformance: board.slice(0, 10).map((r) => ({
          label: String(r.label),
          value: Number(r.value),
          secondary: Number(r.secondary ?? 0),
        })),
      },
      leaderboards: {
        topRevenueDrivers: board.slice(0, 5),
        lowestPerformingDrivers: [...board].sort((a, b) => Number(a.value) - Number(b.value)).slice(0, 5),
      },
      insights: [],
      table: {
        columns: [
          { key: 'label', label: 'Driver' },
          { key: 'subtitle', label: 'Code' },
          { key: 'value', label: 'Revenue' },
          { key: 'secondary', label: 'Completed' },
        ],
        rows: board.slice(0, query.limit ?? 10).map((r) => ({
          label: r.label,
          subtitle: r.subtitle ?? '',
          value: Number(r.value),
          secondary: Number(r.secondary ?? 0),
        })),
        meta: {
          page: query.page ?? 1,
          limit: query.limit ?? 10,
          total: board.length,
          totalPages: Math.max(1, Math.ceil(board.length / (query.limit ?? 10))),
        },
      },
    };
    base.insights = this.insights.build({ ...base, extras: { licenseExpiringSoon: licenseExpiring } });
    return base;
  }

  private async getVehicles(query: ReportQueryDto): Promise<BiReportBase> {
    const { start, end } = this.repo.getDateRange(query);
    const [table, costs, trips, highCost] = await Promise.all([
      this.repo.getVehiclePerformanceTable(query),
      this.repo.getOperationalCosts(query),
      this.repo.getTripFinancials(query),
      this.repo.getHighestCostVehicles(5, query),
    ]);
    const operationalCost = costs.fuelCost + costs.expenseCost + costs.maintenanceCost;
    const kpis: BiKpiMetric[] = [
      { key: 'revenue', label: 'Revenue', value: round2(trips.revenue), unit: 'USD' },
      { key: 'operationalCost', label: 'Operational Cost', value: round2(operationalCost), unit: 'USD' },
      { key: 'profit', label: 'Profit', value: round2(trips.revenue - operationalCost), unit: 'USD' },
      {
        key: 'roi',
        label: 'ROI',
        value: safeDiv((trips.revenue - operationalCost) * 100, operationalCost || 1),
        unit: '%',
      },
      { key: 'tripsCompleted', label: 'Completed Trips', value: trips.completed },
      { key: 'maintenanceCost', label: 'Maintenance Cost', value: round2(costs.maintenanceCost), unit: 'USD' },
    ];
    const base: BiReportBase = {
      type: 'vehicles',
      title: 'Vehicle Report',
      generatedAt: new Date().toISOString(),
      periodStart: start.toISOString(),
      periodEnd: end.toISOString(),
      kpis,
      charts: {
        vehiclePerformance: table.rows.map((r: Record<string, unknown>) => ({
          label: String(r.vehicleId),
          value: Number(r.revenue ?? 0),
          secondary: Number(r.maintenanceCost ?? 0),
        })),
      },
      leaderboards: {
        highestCostVehicles: highCost,
        highestMaintenanceVehicles: highCost,
      },
      insights: [],
      table: {
        columns: [
          { key: 'vehicleId', label: 'Vehicle' },
          { key: 'status', label: 'Status' },
          { key: 'trips', label: 'Trips' },
          { key: 'revenue', label: 'Revenue' },
          { key: 'distance', label: 'Distance' },
          { key: 'maintenanceCost', label: 'Maint. Cost' },
        ],
        rows: table.rows,
        meta: table.meta,
      },
    };
    base.insights = this.insights.build(base);
    return base;
  }

  private async getTrips(query: ReportQueryDto): Promise<BiReportBase> {
    const { start, end } = this.repo.getDateRange(query);
    const [trips, routes, extremes, costs] = await Promise.all([
      this.repo.getTripFinancials(query),
      this.repo.getRouteRevenue(query),
      this.repo.getTripExtremes(query),
      this.repo.getOperationalCosts(query),
    ]);
    const successRate = safeDiv(trips.completed * 100, trips.total || 1);
    const operationalCost = costs.fuelCost + costs.expenseCost + costs.maintenanceCost;
    const kpis: BiKpiMetric[] = [
      { key: 'successRate', label: 'Trip Success Rate', value: successRate, unit: '%' },
      { key: 'avgDistance', label: 'Avg Distance', value: safeDiv(trips.distance, trips.completed || 1) },
      {
        key: 'avgRevenue',
        label: 'Avg Revenue',
        value: safeDiv(trips.revenue, trips.completed || 1),
        unit: 'USD',
      },
      {
        key: 'avgCost',
        label: 'Avg Cost',
        value: safeDiv(operationalCost, trips.completed || 1),
        unit: 'USD',
      },
      { key: 'cancelledTrips', label: 'Cancelled Trips', value: trips.cancelled },
      { key: 'delayedTrips', label: 'Delayed Trips', value: trips.delayed },
    ];
    const base: BiReportBase = {
      type: 'trips',
      title: 'Trip Report',
      generatedAt: new Date().toISOString(),
      periodStart: start.toISOString(),
      periodEnd: end.toISOString(),
      kpis,
      charts: {
        tripCompletion: [
          { label: 'Completed', value: trips.completed },
          { label: 'Cancelled', value: trips.cancelled },
          { label: 'Delayed', value: trips.delayed },
        ],
        revenueByRoute: routes,
      },
      leaderboards: {
        topRoutes: routes.slice(0, 5).map((r: BiChartPoint, i: number) => ({
          id: String(i),
          label: r.label,
          value: r.value,
          secondary: r.secondary,
        })),
      },
      insights: [],
      table: {
        columns: [
          { key: 'metric', label: 'Metric' },
          { key: 'value', label: 'Value' },
        ],
        rows: [
          {
            metric: 'Longest Trip',
            value: extremes.longest
              ? `${extremes.longest.tripNumber} (${extremes.longest.distance})`
              : '—',
          },
          {
            metric: 'Shortest Trip',
            value: extremes.shortest
              ? `${extremes.shortest.tripNumber} (${extremes.shortest.distance})`
              : '—',
          },
          { metric: 'Most Frequent Route', value: routes[0]?.label ?? '—' },
        ],
        meta: { page: 1, limit: 10, total: 3, totalPages: 1 },
      },
    };
    base.insights = this.insights.build(base);
    return base;
  }

  private async getMaintenance(query: ReportQueryDto): Promise<BiReportBase> {
    const { start, end } = this.repo.getDateRange(query);
    const [costs, trends, vendors, highCost] = await Promise.all([
      this.repo.getOperationalCosts(query),
      this.repo.getMonthlyTrends(query),
      this.repo.getVendorPerformance(query),
      this.repo.getHighestCostVehicles(5, query),
    ]);
    const kpis: BiKpiMetric[] = [
      { key: 'active', label: 'Active Maintenance', value: costs.maintenanceActive },
      { key: 'completed', label: 'Completed Maintenance', value: costs.maintenanceCompleted },
      { key: 'overdue', label: 'Overdue Maintenance', value: costs.maintenanceOverdue },
      { key: 'maintenanceCost', label: 'Maintenance Cost', value: round2(costs.maintenanceCost), unit: 'USD' },
      {
        key: 'avgRepairJobs',
        label: 'Jobs / Vendor (top)',
        value: vendors[0] ? Number(vendors[0].secondary ?? 0) : 0,
      },
    ];
    const base: BiReportBase = {
      type: 'maintenance',
      title: 'Maintenance Report',
      generatedAt: new Date().toISOString(),
      periodStart: start.toISOString(),
      periodEnd: end.toISOString(),
      kpis,
      charts: {
        maintenanceCost: toPoints(trends.maintenance),
      },
      leaderboards: {
        vendorPerformance: vendors,
        highestMaintenanceVehicles: highCost,
      },
      insights: [],
    };
    base.insights = this.insights.build(base);
    return base;
  }

  private async getFuel(query: ReportQueryDto): Promise<BiReportBase> {
    const { start, end } = this.repo.getDateRange(query);
    const [costs, trips, trends, highFuel] = await Promise.all([
      this.repo.getOperationalCosts(query),
      this.repo.getTripFinancials(query),
      this.repo.getMonthlyTrends(query),
      this.repo.getHighestFuelVehicles(5, query),
    ]);
    const kpis: BiKpiMetric[] = [
      { key: 'fuelConsumption', label: 'Fuel Consumption', value: round2(costs.fuelQty), unit: 'L' },
      { key: 'fuelCost', label: 'Fuel Cost', value: round2(costs.fuelCost), unit: 'USD' },
      {
        key: 'costPerKm',
        label: 'Cost Per KM',
        value: safeDiv(costs.fuelCost, trips.distance || 1),
        unit: 'USD',
      },
      {
        key: 'fuelEfficiency',
        label: 'Avg Fuel Efficiency',
        value: safeDiv(trips.distance, costs.fuelQty || 1),
        unit: 'km/L',
      },
    ];
    const base: BiReportBase = {
      type: 'fuel',
      title: 'Fuel Report',
      generatedAt: new Date().toISOString(),
      periodStart: start.toISOString(),
      periodEnd: end.toISOString(),
      kpis,
      charts: {
        fuelCost: toPoints(trends.fuel),
        fuelConsumption: trends.fuel.map((r: { _id: string; qty?: number; value: number }) => ({
          label: r._id,
          value: round2(r.qty ?? 0),
          secondary: round2(r.value),
        })),
      },
      leaderboards: { highestFuelVehicles: highFuel },
      insights: [],
    };
    base.insights = this.insights.build(base);
    return base;
  }

  private async getExpenses(query: ReportQueryDto): Promise<BiReportBase> {
    const { start, end } = this.repo.getDateRange(query);
    const [costs, byCategory, approval, trends] = await Promise.all([
      this.repo.getOperationalCosts(query),
      this.repo.getExpenseByCategory(query),
      this.repo.getExpenseApprovalBreakdown(query),
      this.repo.getMonthlyTrends(query),
    ]);
    const kpis: BiKpiMetric[] = [
      { key: 'expenseCost', label: 'Total Expenses', value: round2(costs.expenseCost), unit: 'USD' },
      {
        key: 'categories',
        label: 'Categories',
        value: byCategory.length,
      },
      {
        key: 'approved',
        label: 'Approved Count',
        value: Number(approval.find((a: BiChartPoint) => a.label === 'APPROVED')?.value ?? 0),
      },
    ];
    const base: BiReportBase = {
      type: 'expenses',
      title: 'Expense Report',
      generatedAt: new Date().toISOString(),
      periodStart: start.toISOString(),
      periodEnd: end.toISOString(),
      kpis,
      charts: {
        expenseCategories: byCategory,
        expenseTrend: toPoints(trends.expenses),
        approvalStatus: approval,
      },
      leaderboards: {
        expenseCategories: byCategory.slice(0, 5).map((r: BiChartPoint, i: number) => ({
          id: String(i),
          label: r.label,
          value: r.value,
          secondary: r.secondary,
        })),
      },
      insights: [],
    };
    base.insights = this.insights.build(base);
    return base;
  }

  private async getFinancial(query: ReportQueryDto): Promise<BiReportBase> {
    const exec = await this.getExecutive(query);
    const margin = safeDiv(exec.summary.profit * 100, exec.summary.totalRevenue || 1);
    return {
      ...exec,
      type: 'financial',
      title: 'Financial Report',
      kpis: [
        ...exec.kpis,
        { key: 'profitMargin', label: 'Profit Margin', value: margin, unit: '%' },
        { key: 'loss', label: 'Loss (if negative profit)', value: Math.min(0, exec.summary.profit), unit: 'USD' },
      ],
      insights: this.insights.build(exec),
    };
  }

  private async getProfitability(query: ReportQueryDto): Promise<BiReportBase> {
    const [exec, routes, vehicles] = await Promise.all([
      this.getExecutive(query),
      this.repo.getRouteRevenue(query),
      this.repo.getTopVehiclesByRevenue(10, query),
    ]);
    return {
      ...exec,
      type: 'profitability',
      title: 'Profitability Report',
      charts: {
        ...exec.charts,
        vehicleRoi: vehicles.map((v) => ({
          label: v.label,
          value: Number(v.value),
          secondary: Number(v.secondary ?? 0),
        })),
        revenueByRoute: routes,
      },
      insights: this.insights.build(exec),
    };
  }

  private assertCanAccess(type: BiReportType, user?: JwtPayload) {
    if (!user?.roles?.length) return;
    const roles = user.roles;
    if (roles.includes(RoleCode.SUPER_ADMIN) || roles.includes(RoleCode.ADMIN)) return;
    if (roles.includes(RoleCode.VIEWER) || roles.includes(RoleCode.OPERATOR)) return;

    if (this.isDriverOnly(user)) {
      if (type !== 'drivers') {
        throw new ForbiddenException('Drivers can only access their performance report');
      }
      return;
    }

    if (roles.includes(RoleCode.FINANCIAL_ANALYST)) {
      if (!['executive', 'financial', 'profitability', 'expenses', 'fuel'].includes(type)) {
        throw new ForbiddenException('Financial analysts can only access financial report suites');
      }
      return;
    }

    if (roles.includes(RoleCode.SAFETY_OFFICER)) {
      if (!['drivers', 'maintenance', 'executive', 'fleet', 'vehicles'].includes(type)) {
        throw new ForbiddenException('Safety officers can access maintenance and driver reports');
      }
      return;
    }
  }

  private isDriverOnly(user: JwtPayload) {
    return user.roles.length === 1 && user.roles[0] === RoleCode.OPERATOR;
  }

  private nextRun(frequency: ScheduleReportDto['frequency']) {
    const date = new Date();
    if (frequency === 'daily') date.setDate(date.getDate() + 1);
    if (frequency === 'weekly') date.setDate(date.getDate() + 7);
    if (frequency === 'monthly') date.setMonth(date.getMonth() + 1);
    if (frequency === 'yearly') date.setFullYear(date.getFullYear() + 1);
    return date;
  }

  private pickFilters(dto: ReportQueryDto) {
    const {
      startDate,
      endDate,
      vehicleId,
      driverId,
      status,
      fuelType,
      expenseCategory,
      maintenanceType,
      vendor,
      route,
      region,
      search,
    } = dto;
    return {
      startDate,
      endDate,
      vehicleId,
      driverId,
      status,
      fuelType,
      expenseCategory,
      maintenanceType,
      vendor,
      route,
      region,
      search,
    };
  }

  private mapSchedule(doc: ReportScheduleDocument): BiScheduledReport {
    return {
      id: String(doc._id),
      name: doc.name,
      type: doc.type,
      frequency: doc.frequency,
      format: doc.format,
      filters: doc.filters as BiScheduledReport['filters'],
      email: doc.email,
      nextRunAt: doc.nextRunAt.toISOString(),
      createdAt: (doc as unknown as { createdAt: Date }).createdAt?.toISOString?.() ?? new Date().toISOString(),
      updatedAt: (doc as unknown as { updatedAt: Date }).updatedAt?.toISOString?.() ?? new Date().toISOString(),
      createdBy: doc.createdBy,
      isActive: doc.isActive,
    };
  }
}

function toPoints(rows: Array<{ _id: string; value: number }>): BiChartPoint[] {
  return rows.map((r) => ({ label: r._id, value: round2(Number(r.value ?? 0)) }));
}

function mergeCostTrends(
  fuel: Array<{ _id: string; value: number }>,
  expenses: Array<{ _id: string; value: number }>,
  maintenance: Array<{ _id: string; value: number }>,
): BiChartPoint[] {
  const map = new Map<string, number>();
  for (const row of [...fuel, ...expenses, ...maintenance]) {
    map.set(row._id, round2((map.get(row._id) ?? 0) + Number(row.value ?? 0)));
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, value]) => ({ label, value }));
}
