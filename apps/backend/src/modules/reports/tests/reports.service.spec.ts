import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { RoleCode } from '@transitops/shared-types';
import { ReportsService } from '../service/reports.service';
import { ReportsRepository } from '../repository/reports.repository';
import { ReportInsightsService } from '../service/insights.service';
import { ReportExportService } from '../export/report-export.service';
import { ReportSchedule } from '../schema/report-schedule.schema';

describe('ReportsService', () => {
  let service: ReportsService;
  let repo: jest.Mocked<ReportsRepository>;
  let exporter: ReportExportService;

  const range = {
    start: new Date('2026-06-01'),
    end: new Date('2026-07-01'),
  };

  beforeEach(async () => {
    repo = {
      getDateRange: jest.fn().mockReturnValue(range),
      getFleetStatusCounts: jest.fn().mockResolvedValue({
        total: 10,
        available: 4,
        onTrip: 3,
        maintenance: 2,
        retired: 1,
      }),
      getDriverStatusCounts: jest.fn().mockResolvedValue({
        total: 8,
        available: 5,
        onTrip: 2,
        suspended: 1,
        offDuty: 0,
      }),
      getTripFinancials: jest.fn().mockResolvedValue({
        completed: 20,
        cancelled: 2,
        total: 25,
        revenue: 10000,
        distance: 5000,
        fuel: 400,
        delayed: 1,
      }),
      getOperationalCosts: jest.fn().mockResolvedValue({
        fuelCost: 1000,
        fuelQty: 500,
        expenseCost: 400,
        maintenanceCost: 600,
        maintenanceActive: 2,
        maintenanceCompleted: 5,
        maintenanceOverdue: 1,
      }),
      getMonthlyTrends: jest.fn().mockResolvedValue({
        revenue: [{ _id: '2026-06', value: 5000 }],
        fuel: [{ _id: '2026-06', value: 500, qty: 200 }],
        expenses: [{ _id: '2026-06', value: 200 }],
        maintenance: [{ _id: '2026-06', value: 300 }],
      }),
      getTopVehiclesByRevenue: jest.fn().mockResolvedValue([
        { id: '1', label: 'VH-1', value: 2000, secondary: 4 },
      ]),
      getTopDriversByRevenue: jest.fn().mockResolvedValue([
        { id: 'd1', label: 'Alex', value: 1500, secondary: 3 },
      ]),
      getLowestVehiclesByRevenue: jest.fn().mockResolvedValue([
        { id: '2', label: 'VH-2', value: 100, secondary: 1 },
      ]),
      getHighestCostVehicles: jest.fn().mockResolvedValue([
        {
          id: '1',
          label: 'VH-1',
          value: 900,
          secondary: 400,
          meta: { maintenance: 400, fuel: 300, expense: 200 },
        },
      ]),
      getHighestFuelVehicles: jest.fn().mockResolvedValue([
        { id: 'VH-1', label: 'VH-1', value: 220, secondary: 400 },
      ]),
      countLicenseExpiring: jest.fn().mockResolvedValue(2),
      getDriverLeaderboard: jest.fn().mockResolvedValue([
        {
          id: 'd1',
          label: 'Alex',
          subtitle: 'DR-1',
          value: 1500,
          secondary: 3,
          meta: { totalTrips: 4, cancelled: 1, distance: 100, licenseExpiringSoon: 1 },
        },
      ]),
      getVehiclePerformanceTable: jest.fn().mockResolvedValue({
        rows: [{ vehicleId: 'VH-1', status: 'AVAILABLE', trips: 3, revenue: 1000, distance: 200, maintenanceCost: 50 }],
        meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
      }),
      getRouteRevenue: jest.fn().mockResolvedValue([{ label: 'A → B', value: 800, secondary: 2 }]),
      getTripExtremes: jest.fn().mockResolvedValue({
        longest: { tripNumber: 'T1', distance: 400 },
        shortest: { tripNumber: 'T2', distance: 40 },
      }),
      getVendorPerformance: jest.fn().mockResolvedValue([
        { id: 'FleetCare', label: 'FleetCare', value: 300, secondary: 2 },
      ]),
      getExpenseByCategory: jest.fn().mockResolvedValue([{ label: 'TOLL', value: 120, secondary: 3 }]),
      getExpenseApprovalBreakdown: jest.fn().mockResolvedValue([
        { label: 'APPROVED', value: 4, secondary: 200 },
      ]),
    } as unknown as jest.Mocked<ReportsRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        ReportInsightsService,
        ReportExportService,
        { provide: ReportsRepository, useValue: repo },
        {
          provide: getModelToken(ReportSchedule.name),
          useValue: {
            create: jest.fn().mockImplementation(async (doc) => ({
              ...doc,
              _id: 'sched1',
              createdAt: new Date(),
              updatedAt: new Date(),
            })),
            find: jest.fn().mockReturnValue({
              sort: () => ({
                limit: () => ({
                  exec: async () => [],
                }),
              }),
            }),
          },
        },
      ],
    }).compile();

    service = module.get(ReportsService);
    exporter = module.get(ReportExportService);
  });

  it('builds executive report with KPIs and insights', async () => {
    const report = await service.getReport('executive', {});
    expect(report.type).toBe('executive');
    expect(report.kpis.length).toBeGreaterThan(3);
    expect(report.insights.length).toBeGreaterThan(0);
    expect(report.summary.totalRevenue).toBe(10000);
  });

  it('exports csv from report payload', async () => {
    const report = await service.getReport('financial', {});
    const file = exporter.export(report, 'csv');
    expect(file.contentType).toContain('text/csv');
    expect(file.body.toString('utf8')).toContain('Financial Report');
  });

  it('creates a schedule', async () => {
    const created = await service.schedule(
      {
        type: 'executive',
        format: 'pdf',
        frequency: 'weekly',
        name: 'Weekly exec',
      },
      { sub: 'u1', email: 'a@b.com', roles: [RoleCode.ADMIN] },
    );
    expect(created.type).toBe('executive');
    expect(created.frequency).toBe('weekly');
  });

  it('returns catalog entries', () => {
    expect(service.catalog().length).toBe(10);
  });
});
