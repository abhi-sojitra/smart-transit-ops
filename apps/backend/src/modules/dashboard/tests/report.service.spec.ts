import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from '../service/dashboard.service';
import { ReportService } from '../service/report.service';

jest.mock('../repository/dashboard.repository', () => ({
  DashboardRepository: class DashboardRepository {},
}));

describe('ReportService', () => {
  let service: ReportService;

  const dashboardService = {
    getBusinessSummary: jest.fn(),
    getTopDrivers: jest.fn(),
    getTopVehicles: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportService,
        { provide: DashboardService, useValue: dashboardService },
      ],
    }).compile();

    service = module.get(ReportService);
    jest.clearAllMocks();

    dashboardService.getBusinessSummary.mockResolvedValue({
      period: 'monthly',
      periodStart: '2026-07-01',
      periodEnd: '2026-07-12',
      tripsCompleted: 10,
      tripsCancelled: 1,
      revenue: 5000,
      fuelCost: 800,
      expenseCost: 200,
      maintenanceCost: 100,
      operationalCost: 1100,
      profit: 3900,
      activeVehicles: 12,
      activeDrivers: 9,
      utilizationRate: 40,
    });
    dashboardService.getTopDrivers.mockResolvedValue([
      {
        driverId: '1',
        name: 'Ada',
        employeeCode: 'DR-1',
        completedTrips: 5,
        revenue: 2000,
        safetyScore: 95,
        distance: 1000,
      },
    ]);
    dashboardService.getTopVehicles.mockResolvedValue([
      {
        vehicleId: '1',
        label: 'VH-1',
        completedTrips: 4,
        revenue: 1800,
        operationalCost: 400,
        roi: 350,
        utilizationTrips: 4,
      },
    ]);
  });

  it('exports csv content', async () => {
    const file = await service.export('monthly', 'csv');
    expect(file.contentType).toContain('text/csv');
    expect(file.filename).toContain('monthly');
    expect(file.body.toString('utf8')).toContain('TransitOps Business Report');
    expect(file.body.toString('utf8')).toContain('Ada');
  });

  it('exports pdf buffer', async () => {
    const file = await service.export('weekly', 'pdf');
    expect(file.contentType).toBe('application/pdf');
    expect(file.body.toString('utf8').startsWith('%PDF')).toBe(true);
  });
});
