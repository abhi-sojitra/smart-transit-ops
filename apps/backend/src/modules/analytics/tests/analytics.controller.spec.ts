import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsController } from '../controller/analytics.controller';
import { AnalyticsService } from '../service/analytics.service';

jest.mock('../../dashboard/repository/dashboard.repository', () => ({
  DashboardRepository: class DashboardRepository {},
}));

describe('AnalyticsController', () => {
  let controller: AnalyticsController;

  const analyticsService = {
    getCharts: jest.fn(),
    getBusinessSummary: jest.fn(),
    getReportPayload: jest.fn(),
    exportReport: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [{ provide: AnalyticsService, useValue: analyticsService }],
    }).compile();

    controller = module.get(AnalyticsController);
    jest.clearAllMocks();
  });

  it('returns charts for requested months', async () => {
    analyticsService.getCharts.mockResolvedValue({ tripTrend: [] });
    await expect(controller.getCharts({ months: 12 })).resolves.toEqual({
      tripTrend: [],
    });
    expect(analyticsService.getCharts).toHaveBeenCalledWith(12);
  });

  it('returns report payload', async () => {
    analyticsService.getReportPayload.mockResolvedValue({
      summary: { period: 'daily' },
    });
    await expect(controller.getReports({ period: 'daily' })).resolves.toMatchObject({
      summary: { period: 'daily' },
    });
  });
});
