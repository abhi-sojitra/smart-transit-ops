import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { DriverStatus } from '@transitops/shared-types';
import { DriverRepository } from '../repository/driver.repository';
import { Driver } from '../schema/driver.schema';

describe('DriverRepository', () => {
  let repository: DriverRepository;
  let model: {
    create: jest.Mock;
    findOne: jest.Mock;
    find: jest.Mock;
    findOneAndUpdate: jest.Mock;
    countDocuments: jest.Mock;
    aggregate: jest.Mock;
  };

  const chain = (result: unknown) => ({
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(result),
  });

  beforeEach(async () => {
    model = {
      create: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      findOneAndUpdate: jest.fn(),
      countDocuments: jest.fn(),
      aggregate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DriverRepository,
        { provide: getModelToken(Driver.name), useValue: model },
      ],
    }).compile();

    repository = module.get(DriverRepository);
  });

  it('creates a driver document', async () => {
    const payload = { employeeCode: 'EMP-1', firstName: 'A', lastName: 'B' };
    model.create.mockResolvedValue(payload);
    await expect(repository.create(payload)).resolves.toEqual(payload);
  });

  it('findById returns null for invalid ObjectId', async () => {
    await expect(repository.findById('bad-id')).resolves.toBeNull();
    expect(model.findOne).not.toHaveBeenCalled();
  });

  it('findById queries non-deleted drivers', async () => {
    const id = '665f1a2b3c4d5e6f7a8b9c0d';
    model.findOne.mockReturnValue(chain({ _id: id }));
    await repository.findById(id);
    expect(model.findOne).toHaveBeenCalledWith({ _id: id, isDeleted: false });
  });

  it('findAvailable filters by status and license expiry', async () => {
    model.find.mockReturnValue(chain([]));
    await repository.findAvailable();
    expect(model.find).toHaveBeenCalledWith(
      expect.objectContaining({
        isDeleted: false,
        status: DriverStatus.AVAILABLE,
        licenseExpiryDate: expect.objectContaining({ $gt: expect.any(Date) }),
      }),
    );
  });

  it('findWithFilters paginates and counts', async () => {
    model.find.mockReturnValue(chain([{ employeeCode: 'EMP-1' }]));
    model.countDocuments.mockReturnValue({ exec: jest.fn().mockResolvedValue(1) });

    const result = await repository.findWithFilters({
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      filters: { search: 'maya', status: DriverStatus.AVAILABLE },
    });

    expect(result.total).toBe(1);
    expect(result.totalPages).toBe(1);
    expect(result.items).toHaveLength(1);
  });

  it('softDelete marks isDeleted', async () => {
    const id = '665f1a2b3c4d5e6f7a8b9c0d';
    model.findOneAndUpdate.mockReturnValue(chain({ isDeleted: true }));
    await repository.softDelete(id, { deletedAt: new Date(), deletedBy: 'user-1' });
    expect(model.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: id, isDeleted: false },
      expect.objectContaining({ isDeleted: true }),
      { new: true },
    );
  });

  it('getStatistics aggregates counts', async () => {
    model.aggregate.mockReturnValue({
      exec: jest.fn().mockResolvedValue([
        {
          totalDrivers: 20,
          available: 8,
          onTrip: 5,
          offDuty: 4,
          suspended: 3,
          licenseExpiring: 2,
          averageSafetyScore: 87.5,
        },
      ]),
    });

    const stats = await repository.getStatistics();
    expect(stats.totalDrivers).toBe(20);
    expect(stats.averageSafetyScore).toBe(87.5);
  });

  it('getStatistics returns zeros when empty', async () => {
    model.aggregate.mockReturnValue({ exec: jest.fn().mockResolvedValue([]) });
    const stats = await repository.getStatistics();
    expect(stats.totalDrivers).toBe(0);
  });

  it('findAll returns non-deleted drivers', async () => {
    model.find.mockReturnValue(chain([{ employeeCode: 'EMP-1' }]));
    const result = await repository.findAll();
    expect(result).toHaveLength(1);
    expect(model.find).toHaveBeenCalledWith({ isDeleted: false });
  });

  it('update applies changes for valid id', async () => {
    const id = '665f1a2b3c4d5e6f7a8b9c0d';
    model.findOneAndUpdate.mockReturnValue(chain({ firstName: 'Updated' }));
    await repository.update(id, { firstName: 'Updated' });
    expect(model.findOneAndUpdate).toHaveBeenCalled();
  });

  it('update returns null for invalid id', async () => {
    await expect(repository.update('bad', { firstName: 'X' })).resolves.toBeNull();
  });

  it('delete soft-deletes by id', async () => {
    const id = '665f1a2b3c4d5e6f7a8b9c0d';
    model.findOneAndUpdate.mockReturnValue(chain({ isDeleted: true }));
    await expect(repository.delete(id)).resolves.toBe(true);
  });

  it('delete returns false for invalid id', async () => {
    await expect(repository.delete('bad')).resolves.toBe(false);
  });

  it('findByEmployeeCode excludes id when provided', async () => {
    const id = '665f1a2b3c4d5e6f7a8b9c0d';
    model.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
    await repository.findByEmployeeCode('emp-9', id);
    expect(model.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        employeeCode: 'EMP-9',
        _id: { $ne: id },
      }),
    );
  });

  it('findByEmail normalizes email', async () => {
    model.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
    await repository.findByEmail('Maya@TransitOps.com');
    expect(model.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'maya@transitops.com' }),
    );
  });

  it('findByPhone and findByLicenseNumber support excludeId', async () => {
    const id = '665f1a2b3c4d5e6f7a8b9c0d';
    model.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
    await repository.findByPhone('+919999999999', id);
    await repository.findByLicenseNumber('dl-1', id);
    expect(model.findOne).toHaveBeenCalledTimes(2);
  });

  it('findWithFilters applies city/state/experience filters', async () => {
    model.find.mockReturnValue(chain([]));
    model.countDocuments.mockReturnValue({ exec: jest.fn().mockResolvedValue(0) });
    const result = await repository.findWithFilters({
      page: 1,
      limit: 10,
      sortBy: 'fullName',
      sortOrder: 'asc',
      filters: {
        city: 'Bengaluru',
        state: 'Karnataka',
        experienceMin: 2,
        experienceMax: 10,
        licenseCategory: undefined,
      },
    });
    expect(result.totalPages).toBe(0);
  });
});
