import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { VehicleStatus, VehicleType, FuelType } from '@transitops/shared-types';
import { VehicleRepository } from '../repository/vehicle.repository';
import { Vehicle } from '../schema/vehicle.schema';

describe('VehicleRepository', () => {
  let repository: VehicleRepository;
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
        VehicleRepository,
        { provide: getModelToken(Vehicle.name), useValue: model },
      ],
    }).compile();

    repository = module.get(VehicleRepository);
  });

  it('creates a vehicle document', async () => {
    const payload = { vehicleId: 'VH-1001', make: 'Tata', model: 'Bus' };
    model.create.mockResolvedValue(payload);
    await expect(repository.create(payload)).resolves.toEqual(payload);
  });

  it('findById returns null for invalid ObjectId', async () => {
    await expect(repository.findById('bad-id')).resolves.toBeNull();
    expect(model.findOne).not.toHaveBeenCalled();
  });

  it('findById queries non-deleted vehicles', async () => {
    const id = '665f1a2b3c4d5e6f7a8b9c0d';
    model.findOne.mockReturnValue(chain({ _id: id }));
    await repository.findById(id);
    expect(model.findOne).toHaveBeenCalledWith({ _id: id, isDeleted: false });
  });

  it('findAvailable filters by status and compliance dates', async () => {
    model.find.mockReturnValue(chain([]));
    await repository.findAvailable();
    expect(model.find).toHaveBeenCalledWith(
      expect.objectContaining({
        isDeleted: false,
        status: VehicleStatus.AVAILABLE,
        registrationExpiryDate: expect.objectContaining({ $gt: expect.any(Date) }),
        insuranceExpiryDate: expect.objectContaining({ $gt: expect.any(Date) }),
        fitnessCertificateExpiryDate: expect.objectContaining({ $gt: expect.any(Date) }),
      }),
    );
  });

  it('findWithFilters paginates and counts', async () => {
    model.find.mockReturnValue(chain([{ vehicleId: 'VH-1001' }]));
    model.countDocuments.mockReturnValue({ exec: jest.fn().mockResolvedValue(1) });

    const result = await repository.findWithFilters({
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      filters: { search: 'vh', status: VehicleStatus.AVAILABLE },
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
          totalVehicles: 20,
          available: 8,
          onTrip: 5,
          maintenance: 4,
          retired: 3,
          insuranceExpiring: 2,
          fitnessExpiring: 1,
          serviceDueSoon: 2,
          averageMileage: 84210,
        },
      ]),
    });

    const stats = await repository.getStatistics();
    expect(stats.totalVehicles).toBe(20);
    expect(stats.averageMileage).toBe(84210);
  });

  it('getStatistics returns zeros when empty', async () => {
    model.aggregate.mockReturnValue({ exec: jest.fn().mockResolvedValue([]) });
    const stats = await repository.getStatistics();
    expect(stats.totalVehicles).toBe(0);
  });

  it('findAll returns non-deleted vehicles', async () => {
    model.find.mockReturnValue(chain([{ vehicleId: 'VH-1001' }]));
    const result = await repository.findAll();
    expect(result).toHaveLength(1);
    expect(model.find).toHaveBeenCalledWith({ isDeleted: false });
  });

  it('update applies changes for valid id', async () => {
    const id = '665f1a2b3c4d5e6f7a8b9c0d';
    model.findOneAndUpdate.mockReturnValue(chain({ make: 'Updated' }));
    await repository.update(id, { make: 'Updated' });
    expect(model.findOneAndUpdate).toHaveBeenCalled();
  });

  it('update returns null for invalid id', async () => {
    await expect(repository.update('bad', { make: 'X' })).resolves.toBeNull();
  });

  it('delete soft-deletes by id', async () => {
    const id = '665f1a2b3c4d5e6f7a8b9c0d';
    model.findOneAndUpdate.mockReturnValue(chain({ isDeleted: true }));
    await expect(repository.delete(id)).resolves.toBe(true);
  });

  it('delete returns false for invalid id', async () => {
    await expect(repository.delete('bad')).resolves.toBe(false);
  });

  it('findByVehicleId normalizes and excludes id when provided', async () => {
    const id = '665f1a2b3c4d5e6f7a8b9c0d';
    model.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
    await repository.findByVehicleId('vh-1001', id);
    expect(model.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        vehicleId: 'VH-1001',
        _id: { $ne: id },
      }),
    );
  });

  it('findByRegistrationNumber normalizes registration number', async () => {
    model.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
    await repository.findByRegistrationNumber('ka01ab1001');
    expect(model.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ registrationNumber: 'KA01AB1001' }),
    );
  });

  it('findByVin normalizes vin', async () => {
    model.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
    await repository.findByVin('1hgbh41jxmn109186');
    expect(model.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ vin: '1HGBH41JXMN109186' }),
    );
  });

  it('findWithFilters applies depot and range filters', async () => {
    model.find.mockReturnValue(chain([]));
    model.countDocuments.mockReturnValue({ exec: jest.fn().mockResolvedValue(0) });
    const result = await repository.findWithFilters({
      page: 1,
      limit: 10,
      sortBy: 'vehicleId',
      sortOrder: 'asc',
      filters: {
        depotCity: 'Bengaluru',
        depotState: 'Karnataka',
        yearMin: 2020,
        yearMax: 2024,
        mileageMin: 1000,
        mileageMax: 200000,
        vehicleType: VehicleType.TRUCK,
        fuelType: FuelType.DIESEL,
      },
    });
    expect(result.totalPages).toBe(0);
  });
});
