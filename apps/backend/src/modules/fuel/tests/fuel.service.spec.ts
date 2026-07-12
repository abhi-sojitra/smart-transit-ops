import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { FuelType, RoleCode } from '@transitops/shared-types';
import { FuelRepository } from '../../../repositories/fuel.repository';
import { ReferenceValidationService } from '../../integration/reference-validation.service';
import { CostCalculationService } from '../../integration/cost-calculation.service';
import { FuelService } from '../fuel.service';

describe('FuelService', () => {
  let service: FuelService;

  const mockFuelRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    findPaginated: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getStatistics: jest.fn(),
    getMonthlyFuelCost: jest.fn(),
    getConsumptionTrend: jest.fn(),
    findByVehicle: jest.fn(),
    getVehicleCostComparison: jest.fn(),
  };

  const mockReferenceValidation = {
    validateReferences: jest.fn(),
  };

  const mockCostCalculation = {
    calculateOperationalCost: jest.fn(),
    calculateTripCost: jest.fn(),
    calculateVehicleCost: jest.fn(),
  };

  const adminUser = { sub: '507f1f77bcf86cd799439011', roles: [RoleCode.ADMIN] };

  const fuelDoc = {
    _id: { toString: () => 'abc123' },
    vehicleId: 'VH-1001',
    fuelStation: 'Shell',
    fuelType: FuelType.DIESEL,
    quantity: 50,
    pricePerLiter: 1.8,
    totalCost: 90,
    filledAt: new Date('2026-03-15'),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FuelService,
        { provide: FuelRepository, useValue: mockFuelRepository },
        { provide: ReferenceValidationService, useValue: mockReferenceValidation },
        { provide: CostCalculationService, useValue: mockCostCalculation },
      ],
    }).compile();

    service = module.get(FuelService);
    jest.clearAllMocks();
    mockReferenceValidation.validateReferences.mockResolvedValue(undefined);
  });

  describe('createFuelLog', () => {
    it('should create fuel log with calculated total cost', async () => {
      mockFuelRepository.create.mockResolvedValue(fuelDoc);

      const result = await service.createFuelLog({
        vehicleId: 'VH-1001',
        fuelStation: 'Shell',
        fuelType: FuelType.DIESEL,
        quantity: 50,
        pricePerLiter: 1.8,
        filledAt: '2026-03-15',
      });

      expect(mockFuelRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ totalCost: 90, vehicleId: 'VH-1001' }),
      );
      expect(result.vehicleId).toBe('VH-1001');
      expect(result.totalCost).toBe(90);
    });

    it('should throw BadRequestException for invalid vehicle', async () => {
      mockReferenceValidation.validateReferences.mockRejectedValue(
        new Error('Vehicle "VH-9999" not found'),
      );

      await expect(
        service.createFuelLog({
          vehicleId: 'VH-9999',
          fuelStation: 'Shell',
          fuelType: FuelType.DIESEL,
          quantity: 50,
          pricePerLiter: 1.8,
          filledAt: '2026-03-15',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findById', () => {
    it('should throw NotFoundException when fuel log not found', async () => {
      mockFuelRepository.findById.mockResolvedValue(null);
      await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getFuelStatistics', () => {
    it('should return aggregated statistics', async () => {
      mockFuelRepository.getStatistics.mockResolvedValue([
        {
          totalFuelCost: 5000,
          totalFuelQuantity: 2500,
          avgPrice: 1.8,
          count: 50,
          totalOdometer: 125000,
        },
      ]);
      mockFuelRepository.getMonthlyFuelCost.mockResolvedValue([{ month: '2026-03', cost: 1200 }]);
      mockFuelRepository.getConsumptionTrend.mockResolvedValue([
        { date: '2026-03-01', quantity: 100, cost: 180 },
      ]);

      const stats = await service.getFuelStatistics();
      expect(stats.totalFuelCost).toBe(5000);
      expect(stats.totalFuelQuantity).toBe(2500);
      expect(stats.averageFuelCost).toBe(100);
      expect(stats.monthlyFuelCost).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('should update fuel log', async () => {
      mockFuelRepository.findById.mockResolvedValue({
        ...fuelDoc,
        createdBy: { toString: () => 'user-1' },
      });
      mockFuelRepository.update.mockResolvedValue(fuelDoc);

      const result = await service.update('abc123', { quantity: 60 }, adminUser);
      expect(result.totalCost).toBe(90);
    });
  });

  describe('remove', () => {
    it('should soft delete fuel log', async () => {
      mockFuelRepository.findById.mockResolvedValue(fuelDoc);
      mockFuelRepository.delete.mockResolvedValue(true);

      const result = await service.remove('abc123', adminUser);
      expect(result.deleted).toBe(true);
    });
  });

  describe('getVehicleFuelHistory', () => {
    it('should return vehicle fuel history', async () => {
      mockFuelRepository.findByVehicle.mockResolvedValue([fuelDoc]);
      const result = await service.getVehicleFuelHistory('VH-1001');
      expect(result).toHaveLength(1);
    });
  });

  describe('owner access', () => {
    it('should filter by createdBy for operator-only users', async () => {
      mockFuelRepository.findPaginated.mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        limit: 20,
      });

      await service.findAll({ page: 1, limit: 20 }, {
        sub: 'user-1',
        roles: [RoleCode.OPERATOR],
      });

      expect(mockFuelRepository.findPaginated).toHaveBeenCalledWith(
        expect.objectContaining({ createdBy: 'user-1' }),
      );
    });
  });
});
