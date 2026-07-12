import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { FuelRepository } from '../../../repositories/fuel.repository';
import { Fuel } from '../../../schemas/fuel.schema';

describe('FuelRepository', () => {
  let repository: FuelRepository;

  const mockExec = jest.fn();
  const mockFuelModel = {
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
        FuelRepository,
        { provide: getModelToken(Fuel.name), useValue: mockFuelModel },
      ],
    }).compile();

    repository = module.get(FuelRepository);
    jest.clearAllMocks();
  });

  it('should create a fuel log', async () => {
    const doc = { _id: '1', vehicleId: 'VH-1001', totalCost: 84 };
    mockFuelModel.create.mockResolvedValue(doc);

    const result = await repository.create({ vehicleId: 'VH-1001', totalCost: 84 });
    expect(result).toEqual(doc);
    expect(mockFuelModel.create).toHaveBeenCalled();
  });

  it('should soft delete a fuel log', async () => {
    mockExec.mockResolvedValue({ _id: '1' });

    const result = await repository.delete('1');
    expect(result).toBe(true);
    expect(mockFuelModel.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: '1', isDeleted: { $ne: true } },
      expect.objectContaining({ isDeleted: true }),
      { new: true },
    );
  });

  it('should return false when soft delete finds nothing', async () => {
    mockExec.mockResolvedValue(null);
    const result = await repository.delete('missing');
    expect(result).toBe(false);
  });

  it('should find by id excluding deleted records', async () => {
    mockExec.mockResolvedValue({ _id: '1', vehicleId: 'VH-1001' });
    const result = await repository.findById('1');
    expect(mockFuelModel.findOne).toHaveBeenCalledWith({ _id: '1', isDeleted: { $ne: true } });
    expect(result).toEqual({ _id: '1', vehicleId: 'VH-1001' });
  });

  it('should aggregate statistics', async () => {
    mockFuelModel.aggregate.mockResolvedValue([
      { totalFuelCost: 1000, totalFuelQuantity: 500, avgPrice: 2, count: 10, totalOdometer: 5000 },
    ]);
    const result = await repository.getStatistics('2026-01-01', '2026-12-31');
    expect(mockFuelModel.aggregate).toHaveBeenCalled();
    expect(result[0].totalFuelCost).toBe(1000);
  });

  it('should find paginated results', async () => {
    const chainExec = jest.fn().mockResolvedValue([]);
    const chain = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnValue({ exec: chainExec }),
    };
    mockFuelModel.find.mockReturnValue(chain);
    mockFuelModel.countDocuments.mockReturnValue({ exec: jest.fn().mockResolvedValue(0) });

    const result = await repository.findPaginated({ page: 1, limit: 10, vehicleId: 'VH-1001' });
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
  });

  it('should update fuel log', async () => {
    mockExec.mockResolvedValue({ _id: '1', quantity: 60 });
    const result = await repository.update('1', { quantity: 60 });
    expect(result?.quantity).toBe(60);
  });

  it('should find all non-deleted records', async () => {
    const sortExec = jest.fn().mockResolvedValue([]);
    mockFuelModel.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({ exec: sortExec }),
    });
    await repository.findAll();
    expect(mockFuelModel.find).toHaveBeenCalledWith({ isDeleted: { $ne: true } });
  });

  it('should get monthly fuel cost', async () => {
    mockFuelModel.aggregate.mockResolvedValue([{ month: '2026-03', cost: 500 }]);
    const result = await repository.getMonthlyFuelCost();
    expect(result[0].cost).toBe(500);
  });
});
