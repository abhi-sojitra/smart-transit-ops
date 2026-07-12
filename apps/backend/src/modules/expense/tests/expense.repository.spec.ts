import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ExpenseRepository } from '../../../repositories/expense.repository';
import { Expense } from '../../../schemas/expense.schema';

describe('ExpenseRepository', () => {
  let repository: ExpenseRepository;

  const mockExec = jest.fn();
  const mockExpenseModel = {
    create: jest.fn(),
    findOne: jest.fn(() => ({ exec: mockExec })),
    find: jest.fn(() => ({ sort: jest.fn(() => ({ exec: mockExec })) })),
    findOneAndUpdate: jest.fn(() => ({ exec: mockExec })),
    countDocuments: jest.fn(() => ({ exec: mockExec })),
    aggregate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpenseRepository,
        { provide: getModelToken(Expense.name), useValue: mockExpenseModel },
      ],
    }).compile();

    repository = module.get(ExpenseRepository);
    jest.clearAllMocks();
  });

  it('should create an expense', async () => {
    const doc = { _id: '1', title: 'Toll', amount: 25 };
    mockExpenseModel.create.mockResolvedValue(doc);

    const result = await repository.create({ title: 'Toll', amount: 25 });
    expect(result).toEqual(doc);
  });

  it('should soft delete an expense', async () => {
    mockExec.mockResolvedValue({ _id: '1' });
    const result = await repository.delete('1');
    expect(result).toBe(true);
  });

  it('should find by trip', async () => {
    const sortExec = jest.fn().mockResolvedValue([]);
    mockExpenseModel.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({ exec: sortExec }),
    });
    await repository.findByTrip('TR-2001');
    expect(mockExpenseModel.find).toHaveBeenCalledWith({
      tripId: 'TR-2001',
      isDeleted: { $ne: true },
    });
  });

  it('should get statistics aggregates', async () => {
    mockExpenseModel.aggregate
      .mockResolvedValueOnce([{ _id: 'PENDING', total: 100, count: 2 }])
      .mockResolvedValueOnce([{ _id: 'TOLL', amount: 100, count: 2 }])
      .mockResolvedValueOnce([{ total: 100 }]);

    const result = await repository.getStatistics();
    expect(result).toHaveLength(3);
  });

  it('should find paginated with filters', async () => {
    const chainExec = jest.fn().mockResolvedValue([]);
    const chain = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnValue({ exec: chainExec }),
    };
    mockExpenseModel.find.mockReturnValue(chain);
    mockExpenseModel.countDocuments.mockReturnValue({ exec: jest.fn().mockResolvedValue(5) });

    const result = await repository.findPaginated({
      page: 2,
      limit: 10,
      status: 'PENDING',
      search: 'toll',
    });
    expect(result.page).toBe(2);
    expect(result.total).toBe(5);
  });

  it('should update expense', async () => {
    mockExec.mockResolvedValue({ _id: '1', amount: 50 });
    const result = await repository.update('1', { amount: 50 });
    expect(result?.amount).toBe(50);
  });

  it('should get monthly expenses', async () => {
    mockExpenseModel.aggregate.mockResolvedValue([{ month: '2026-03', amount: 300 }]);
    const result = await repository.getMonthlyExpenses();
    expect(result[0].amount).toBe(300);
  });
});
