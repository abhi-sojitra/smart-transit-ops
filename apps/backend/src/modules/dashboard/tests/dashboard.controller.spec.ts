import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from '../controller/dashboard.controller';
import { DashboardService } from '../service/dashboard.service';
import { ReportService } from '../service/report.service';

jest.mock('../repository/dashboard.repository', () => ({
  DashboardRepository: class DashboardRepository {},
}));

describe('DashboardController', () => {
  let controller: DashboardController;

  const dashboardService = {
    getOverview: jest.fn(),
    getRecentActivity: jest.fn(),
    getCharts: jest.fn(),
    getAlerts: jest.fn(),
    getTopDrivers: jest.fn(),
    getTopVehicles: jest.fn(),
    getUpcomingMaintenance: jest.fn(),
    getRecentTrips: jest.fn(),
    getBusinessSummary: jest.fn(),
  };

  const reportService = {
    export: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        { provide: DashboardService, useValue: dashboardService },
        { provide: ReportService, useValue: reportService },
      ],
    }).compile();

    controller = module.get(DashboardController);
    jest.clearAllMocks();
  });

  it('returns overview', async () => {
    dashboardService.getOverview.mockResolvedValue({ finance: { revenue: 100 } });
    await expect(controller.getOverview()).resolves.toEqual({
      finance: { revenue: 100 },
    });
  });

  it('passes activity limit', async () => {
    dashboardService.getRecentActivity.mockResolvedValue([]);
    await controller.getRecentActivity({ limit: 5 });
    expect(dashboardService.getRecentActivity).toHaveBeenCalledWith(5);
  });

  it('exports report file', async () => {
    const res = {
      setHeader: jest.fn(),
      send: jest.fn(),
    };
    reportService.export.mockResolvedValue({
      filename: 'report.csv',
      contentType: 'text/csv',
      body: Buffer.from('a'),
    });

    await controller.exportReport({ period: 'weekly', format: 'csv' }, res as never);

    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
    expect(res.send).toHaveBeenCalled();
  });
});
