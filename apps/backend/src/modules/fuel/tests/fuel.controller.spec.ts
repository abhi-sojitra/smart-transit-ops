import { Test, TestingModule } from '@nestjs/testing';
import { FuelType, RoleCode } from '@transitops/shared-types';
import { FuelController } from '../fuel.controller';
import { FuelService } from '../fuel.service';

describe('FuelController', () => {
  let controller: FuelController;

  const mockFuelService = {
    createFuelLog: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getFuelStatistics: jest.fn(),
    getVehicleFuelHistory: jest.fn(),
    calculateVehicleCost: jest.fn(),
    calculateTripCost: jest.fn(),
    getVehicleCostComparison: jest.fn(),
  };

  const user = { sub: 'user-1', roles: [RoleCode.FLEET_MANAGER] };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FuelController],
      providers: [{ provide: FuelService, useValue: mockFuelService }],
    }).compile();

    controller = module.get(FuelController);
    jest.clearAllMocks();
  });

  it('should create fuel log', async () => {
    const dto = {
      vehicleId: 'VH-1001',
      fuelStation: 'Shell',
      fuelType: FuelType.DIESEL,
      quantity: 50,
      pricePerLiter: 1.8,
      filledAt: '2026-03-15',
    };
    mockFuelService.createFuelLog.mockResolvedValue({ id: '1', ...dto, totalCost: 90 });

    const result = await controller.create(dto, user);
    expect(mockFuelService.createFuelLog).toHaveBeenCalledWith(dto, user);
    expect(result.totalCost).toBe(90);
  });

  it('should return paginated fuel logs', async () => {
    mockFuelService.findAll.mockResolvedValue({
      data: [],
      meta: { page: 1, limit: 20, total: 0, totalPages: 1 },
    });

    const result = await controller.findAll({ page: 1, limit: 20 }, user);
    expect(result.meta.total).toBe(0);
  });

  it('should return fuel statistics', async () => {
    mockFuelService.getFuelStatistics.mockResolvedValue({
      totalFuelCost: 5000,
      totalFuelQuantity: 2500,
      averageFuelCost: 100,
      averageFuelEfficiency: 50,
    });

    const stats = await controller.getStatistics();
    expect(stats.totalFuelCost).toBe(5000);
  });
});
