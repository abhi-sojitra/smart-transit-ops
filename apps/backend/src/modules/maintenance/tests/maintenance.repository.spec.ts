import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { MaintenanceRepository } from '../repository/maintenance.repository';
import { Maintenance } from '../schema/maintenance.schema';
import { MaintenanceStatus } from '@transitops/shared-types';

describe('MaintenanceRepository', () => {
  let repository: MaintenanceRepository;

  const mockQuery = {
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn(),
  };

  const vehicleFind = {
    select: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([{ _id: new Types.ObjectId() }]),
  };

  const mockModel = {
    create: jest.fn(),
    find: jest.fn(() => mockQuery),
    findOne: jest.fn(() => mockQuery),
    findOneAndUpdate: jest.fn(() => mockQuery),
    countDocuments: jest.fn(() => mockQuery),
    aggregate: jest.fn(() => mockQuery),
    db: {
      model: jest.fn(() => ({
        find: jest.fn(() => vehicleFind),
      })),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    Object.values(mockQuery).forEach((fn) => {
      if (typeof fn === 'function' && 'mockReturnThis' in fn) {
        (fn as jest.Mock).mockReturnThis();
      }
    });
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MaintenanceRepository,
        { provide: getModelToken(Maintenance.name), useValue: mockModel },
      ],
    }).compile();

    repository = module.get(MaintenanceRepository);
  });

  it('creates a maintenance document', async () => {
    const payload = { title: 'Oil Change', status: MaintenanceStatus.SCHEDULED };
    mockModel.create.mockResolvedValue(payload);
    await expect(repository.create(payload as never)).resolves.toEqual(payload);
  });

  it('finds by id excluding soft-deleted', async () => {
    mockQuery.exec.mockResolvedValue({ _id: '1' });
    await repository.findById('1');
    expect(mockModel.findOne).toHaveBeenCalledWith({ _id: '1', isDeleted: { $ne: true } });
  });

  it('lists all with populate and sort', async () => {
    mockQuery.exec.mockResolvedValue([]);
    await repository.findAll();
    expect(mockModel.find).toHaveBeenCalledWith({ isDeleted: { $ne: true } });
  });

  it('updates a document', async () => {
    mockQuery.exec.mockResolvedValue({ _id: '1', title: 'x' });
    await repository.update('1', { title: 'x' } as never);
    expect(mockModel.findOneAndUpdate).toHaveBeenCalled();
  });

  it('soft deletes via delete()', async () => {
    mockQuery.exec.mockResolvedValue({ _id: '1' });
    await expect(repository.delete('1')).resolves.toBe(true);
  });

  it('returns false when soft delete misses', async () => {
    mockQuery.exec.mockResolvedValue(null);
    await expect(repository.delete('missing')).resolves.toBe(false);
  });

  it('checks active maintenance for a vehicle', async () => {
    mockQuery.exec.mockResolvedValue(2);
    const result = await repository.isVehicleInMaintenance('665f1a2b3c4d5e6f7a8b9c0d');
    expect(result).toBe(true);
  });

  it('returns false when vehicle has no active maintenance', async () => {
    mockQuery.exec.mockResolvedValue(0);
    await expect(repository.isVehicleInMaintenance('665f1a2b3c4d5e6f7a8b9c0d')).resolves.toBe(false);
  });

  it('finds active by vehicle id', async () => {
    mockQuery.exec.mockResolvedValue({ maintenanceNumber: 'MNT-1' });
    await repository.findActiveByVehicleId('665f1a2b3c4d5e6f7a8b9c0d');
    expect(mockModel.findOne).toHaveBeenCalled();
  });

  it('finds history by vehicle id', async () => {
    mockQuery.exec.mockResolvedValue([]);
    await repository.findByVehicleId('665f1a2b3c4d5e6f7a8b9c0d');
    expect(mockModel.find).toHaveBeenCalled();
  });

  it('soft deletes with deletedBy', async () => {
    mockQuery.exec.mockResolvedValue({ _id: '1', isDeleted: true });
    await repository.softDelete('1', 'user-1');
    expect(mockModel.findOneAndUpdate).toHaveBeenCalled();
  });

  it('generates first maintenance number of the year', async () => {
    mockQuery.exec.mockResolvedValue(null);
    const number = await repository.generateMaintenanceNumber();
    expect(number).toMatch(/^MNT-\d{4}-0001$/);
  });

  it('increments maintenance number sequence', async () => {
    const year = new Date().getFullYear();
    mockQuery.exec.mockResolvedValue({ maintenanceNumber: `MNT-${year}-0007` });
    const number = await repository.generateMaintenanceNumber();
    expect(number).toBe(`MNT-${year}-0008`);
  });

  it('returns paginated results with meta', async () => {
    mockQuery.exec.mockResolvedValueOnce([{ _id: '1' }]).mockResolvedValueOnce(1);
    const result = await repository.findPaginated({ page: 1, limit: 10 });
    expect(result.meta).toEqual({ page: 1, limit: 10, total: 1, totalPages: 1 });
  });

  it('applies filters and search in pagination', async () => {
    mockQuery.exec.mockResolvedValueOnce([]).mockResolvedValueOnce(0);
    await repository.findPaginated({
      page: 2,
      limit: 5,
      status: MaintenanceStatus.SCHEDULED,
      search: 'VH',
      startDateFrom: '2026-01-01',
      startDateTo: '2026-12-31',
      sortBy: 'estimatedCost',
      sortOrder: 'asc',
      vehicleId: '665f1a2b3c4d5e6f7a8b9c0d',
    });
    expect(mockModel.find).toHaveBeenCalled();
    expect(mockModel.db.model).toHaveBeenCalledWith('Vehicle');
  });

  it('counts active, status, overdue, and all', async () => {
    mockQuery.exec.mockResolvedValue(3);
    await expect(repository.countActive()).resolves.toBe(3);
    await expect(repository.countByStatus(MaintenanceStatus.COMPLETED)).resolves.toBe(3);
    await expect(repository.countOverdue()).resolves.toBe(3);
    await expect(repository.countAll()).resolves.toBe(3);
  });

  it('sums cost in range', async () => {
    mockQuery.exec.mockResolvedValue([{ total: 1500 }]);
    await expect(repository.sumCostInRange(new Date(), new Date())).resolves.toBe(1500);
  });

  it('returns zero when no cost aggregate', async () => {
    mockQuery.exec.mockResolvedValue([]);
    await expect(repository.sumCostInRange(new Date(), new Date())).resolves.toBe(0);
  });

  it('averages repair time', async () => {
    mockQuery.exec.mockResolvedValue([{ avgDays: 2.5 }]);
    await expect(repository.averageRepairTimeDays()).resolves.toBe(2.5);
  });

  it('returns zero average when empty', async () => {
    mockQuery.exec.mockResolvedValue([]);
    await expect(repository.averageRepairTimeDays()).resolves.toBe(0);
  });

  it('adds attachments', async () => {
    mockQuery.exec.mockResolvedValue({ _id: '1', attachments: [{}] });
    await repository.addAttachments('1', [
      {
        filename: 'a.pdf',
        originalName: 'a.pdf',
        mimeType: 'application/pdf',
        size: 10,
        url: '/uploads/a.pdf',
        uploadedAt: new Date(),
      },
    ]);
    expect(mockModel.findOneAndUpdate).toHaveBeenCalled();
  });
});
