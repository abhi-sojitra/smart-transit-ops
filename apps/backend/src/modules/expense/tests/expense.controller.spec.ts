import { Test, TestingModule } from '@nestjs/testing';
import { ExpenseStatus, ExpenseType, RoleCode } from '@transitops/shared-types';
import { ExpenseController } from '../expense.controller';
import { ExpenseService } from '../expense.service';

describe('ExpenseController', () => {
  let controller: ExpenseController;

  const mockExpenseService = {
    createExpense: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getExpenseStatistics: jest.fn(),
    getTripExpenses: jest.fn(),
    calculateVehicleCost: jest.fn(),
  };

  const user = { sub: 'user-1', roles: [RoleCode.FINANCIAL_ANALYST] };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExpenseController],
      providers: [{ provide: ExpenseService, useValue: mockExpenseService }],
    }).compile();

    controller = module.get(ExpenseController);
    jest.clearAllMocks();
  });

  it('should create expense', async () => {
    const dto = {
      vehicleId: 'VH-1001',
      expenseType: ExpenseType.TOLL,
      title: 'Highway Toll',
      amount: 25,
      expenseDate: '2026-03-15',
    };
    mockExpenseService.createExpense.mockResolvedValue({
      id: '1',
      ...dto,
      status: ExpenseStatus.PENDING,
    });

    const result = await controller.create(dto, user);
    expect(mockExpenseService.createExpense).toHaveBeenCalledWith(dto, user);
    expect(result.status).toBe(ExpenseStatus.PENDING);
  });

  it('should return expense statistics', async () => {
    mockExpenseService.getExpenseStatistics.mockResolvedValue({
      totalExpenses: 3700,
      pending: 500,
      approved: 3000,
      rejected: 200,
      expenseByCategory: [],
    });

    const stats = await controller.getStatistics();
    expect(stats.totalExpenses).toBe(3700);
  });

  it('should return trip expenses', async () => {
    mockExpenseService.getTripExpenses.mockResolvedValue([]);
    const result = await controller.getTripExpenses('TR-2001');
    expect(mockExpenseService.getTripExpenses).toHaveBeenCalledWith('TR-2001');
    expect(result).toEqual([]);
  });
});
