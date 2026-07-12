import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ExpenseStatus, ExpenseType, RoleCode } from '@transitops/shared-types';
import { ExpenseRepository } from '../../../repositories/expense.repository';
import { ReferenceValidationService } from '../../integration/reference-validation.service';
import { CostCalculationService } from '../../integration/cost-calculation.service';
import { ExpenseService } from '../expense.service';

describe('ExpenseService', () => {
  let service: ExpenseService;

  const mockExpenseRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    findPaginated: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getStatistics: jest.fn(),
    getMonthlyExpenses: jest.fn(),
    findByTrip: jest.fn(),
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

  const expenseDoc = {
    _id: { toString: () => 'exp123' },
    vehicleId: 'VH-1001',
    expenseType: ExpenseType.TOLL,
    title: 'Highway Toll',
    amount: 25,
    expenseDate: new Date('2026-03-15'),
    status: ExpenseStatus.PENDING,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpenseService,
        { provide: ExpenseRepository, useValue: mockExpenseRepository },
        { provide: ReferenceValidationService, useValue: mockReferenceValidation },
        { provide: CostCalculationService, useValue: mockCostCalculation },
      ],
    }).compile();

    service = module.get(ExpenseService);
    jest.clearAllMocks();
    mockReferenceValidation.validateReferences.mockResolvedValue(undefined);
  });

  describe('createExpense', () => {
    it('should create expense record', async () => {
      mockExpenseRepository.create.mockResolvedValue(expenseDoc);

      const result = await service.createExpense({
        vehicleId: 'VH-1001',
        expenseType: ExpenseType.TOLL,
        title: 'Highway Toll',
        amount: 25,
        expenseDate: '2026-03-15',
      });

      expect(result.title).toBe('Highway Toll');
      expect(result.amount).toBe(25);
    });
  });

  describe('getExpenseStatistics', () => {
    it('should return expense statistics by status and category', async () => {
      mockExpenseRepository.getStatistics.mockResolvedValue([
        [
          { _id: ExpenseStatus.PENDING, total: 500, count: 10 },
          { _id: ExpenseStatus.APPROVED, total: 3000, count: 30 },
          { _id: ExpenseStatus.REJECTED, total: 200, count: 5 },
        ],
        [{ _id: ExpenseType.TOLL, amount: 800, count: 15 }],
        [{ total: 3700 }],
      ]);
      mockExpenseRepository.getMonthlyExpenses.mockResolvedValue([
        { month: '2026-03', amount: 1200 },
      ]);

      const stats = await service.getExpenseStatistics();
      expect(stats.totalExpenses).toBe(3700);
      expect(stats.pending).toBe(500);
      expect(stats.approved).toBe(3000);
      expect(stats.expenseByCategory).toHaveLength(1);
    });
  });

  describe('remove', () => {
    it('should throw NotFoundException when expense not found', async () => {
      mockExpenseRepository.findById.mockResolvedValue(null);
      await expect(service.remove('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update expense', async () => {
      mockExpenseRepository.findById.mockResolvedValue(expenseDoc);
      mockExpenseRepository.update.mockResolvedValue(expenseDoc);

      const result = await service.update('exp123', { amount: 30 }, adminUser);
      expect(result.amount).toBe(25);
    });
  });

  describe('getTripExpenses', () => {
    it('should return trip expenses', async () => {
      mockExpenseRepository.findByTrip.mockResolvedValue([expenseDoc]);
      const result = await service.getTripExpenses('TR-2001');
      expect(result).toHaveLength(1);
    });
  });

  describe('owner access', () => {
    it('should filter by createdBy for operator-only users', async () => {
      mockExpenseRepository.findPaginated.mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        limit: 20,
      });

      await service.findAll({ page: 1, limit: 20 }, {
        sub: 'user-1',
        roles: [RoleCode.OPERATOR],
      });

      expect(mockExpenseRepository.findPaginated).toHaveBeenCalledWith(
        expect.objectContaining({ createdBy: 'user-1' }),
      );
    });
  });
});
