import { Test, TestingModule } from '@nestjs/testing';
import { DriverStatus, VehicleStatus } from '@transitops/shared-types';
import { DashboardRepository } from '../repository/dashboard.repository';
import { StatisticsService } from '../service/statistics.service';

jest.mock('../repository/dashboard.repository', () => ({
  DashboardRepository: class DashboardRepository {},
}));

describe('StatisticsService', () => {
  let service: StatisticsService;

  const repository = {
    monthStart: jest.fn(() => new Date('2026-07-01T00:00:00.000Z')),
    getFleetStatusCounts: jest.fn(),
    getDriverStatusCounts: jest.fn(),
    getLicenseExpiringCount: jest.fn(),
    getTripOverview: jest.fn(),
    getMaintenanceOverview: jest.fn(),
    getFuelMonthlyStats: jest.fn(),
    getFuelEfficiency: jest.fn(),
    getExpenseMonthlyStats: jest.fn(),
    getOperationalCostTotals: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatisticsService,
        { provide: DashboardRepository, useValue: repository },
      ],
    }).compile();

    service = module.get(StatisticsService);
    jest.clearAllMocks();
  });

  it('assembles overview from aggregation results', async () => {
    repository.getFleetStatusCounts.mockResolvedValue([
      { _id: VehicleStatus.AVAILABLE, count: 10 },
      { _id: VehicleStatus.ON_TRIP, count: 5 },
      { _id: VehicleStatus.MAINTENANCE, count: 2 },
      { _id: VehicleStatus.RETIRED, count: 1 },
    ]);
    repository.getDriverStatusCounts.mockResolvedValue([
      { _id: DriverStatus.AVAILABLE, count: 8, avgSafety: 90 },
      { _id: DriverStatus.SUSPENDED, count: 2, avgSafety: 70 },
    ]);
    repository.getLicenseExpiringCount.mockResolvedValue([{ count: 3 }]);
    repository.getTripOverview.mockResolvedValue([
      { active: 4, completedToday: 2, cancelled: 1, total: 20, revenue: 1000 },
    ]);
    repository.getMaintenanceOverview.mockResolvedValue([
      { active: 3, overdue: 1, completed: 5, cost: 400 },
    ]);
    repository.getFuelMonthlyStats.mockResolvedValue([
      { monthlyCost: 200, monthlyQuantity: 50 },
    ]);
    repository.getFuelEfficiency.mockResolvedValue([{ fuelEfficiency: 8.5 }]);
    repository.getExpenseMonthlyStats.mockResolvedValue([
      { monthlyExpense: 150, pending: 50, approved: 100 },
    ]);
    repository.getOperationalCostTotals.mockResolvedValue([
      [{ total: 200 }],
      [{ total: 150 }],
      [{ total: 50 }],
    ]);

    const overview = await service.getOverview();

    expect(overview.fleet.totalVehicles).toBe(18);
    expect(overview.fleet.onTrip).toBe(5);
    expect(overview.fleet.utilizationRate).toBe(27.8);
    expect(overview.drivers.licenseExpiring).toBe(3);
    expect(overview.trips.revenue).toBe(1000);
    expect(overview.finance.operationalCost).toBe(400);
    expect(overview.finance.profit).toBe(600);
    expect(overview.finance.roi).toBe(150);
  });
});
