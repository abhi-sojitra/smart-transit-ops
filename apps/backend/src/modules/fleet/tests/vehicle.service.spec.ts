import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { VehicleStatus, VehicleType, FuelType } from '@transitops/shared-types';
import { VehicleService } from '../service/vehicle.service';
import { VehicleRepository } from '../repository/vehicle.repository';
import { CreateVehicleDto } from '../dto/create-vehicle.dto';

const futureExpiry = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 2);
  return d.toISOString().slice(0, 10);
};

function makeVehicleDoc(overrides: Record<string, unknown> = {}) {
  const expiry = new Date();
  expiry.setFullYear(expiry.getFullYear() + 2);
  return {
    _id: '665f1a2b3c4d5e6f7a8b9c0d',
    vehicleId: 'VH-1001',
    registrationNumber: 'KA01AB1001',
    make: 'Tata',
    model: 'Starbus Ultra',
    year: 2022,
    vehicleType: VehicleType.BUS,
    fuelType: FuelType.DIESEL,
    maxCapacity: 500,
    mileage: 84210,
    registrationExpiryDate: expiry,
    insuranceExpiryDate: expiry,
    fitnessCertificateExpiryDate: expiry,
    status: VehicleStatus.AVAILABLE,
    isDeleted: false,
    documents: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('VehicleService', () => {
  let service: VehicleService;
  let repository: jest.Mocked<VehicleRepository>;

  beforeEach(async () => {
    const mockRepo: Partial<jest.Mocked<VehicleRepository>> = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      findByVehicleId: jest.fn().mockResolvedValue(null),
      findByRegistrationNumber: jest.fn().mockResolvedValue(null),
      findByVin: jest.fn().mockResolvedValue(null),
      findAvailable: jest.fn(),
      findWithFilters: jest.fn(),
      getStatistics: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehicleService,
        { provide: VehicleRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get(VehicleService);
    repository = module.get(VehicleRepository);
  });

  const baseDto = (): CreateVehicleDto => ({
    vehicleId: 'VH-1001',
    registrationNumber: 'KA01AB1001',
    make: 'Tata',
    model: 'Starbus Ultra',
    vehicleType: VehicleType.BUS,
    fuelType: FuelType.DIESEL,
    maxCapacity: 500,
    mileage: 84210,
    registrationExpiryDate: futureExpiry(),
    insuranceExpiryDate: futureExpiry(),
    fitnessCertificateExpiryDate: futureExpiry(),
  });

  it('creates a vehicle when unique fields are free', async () => {
    const doc = makeVehicleDoc();
    repository.create.mockResolvedValue(doc as never);

    const result = await service.create(baseDto());

    expect(result.vehicleId).toBe('VH-1001');
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ maxCapacity: 500 }),
    );
  });

  it('throws ConflictException when vehicleId exists', async () => {
    repository.findByVehicleId.mockResolvedValue(makeVehicleDoc() as never);

    await expect(service.create(baseDto())).rejects.toThrow(ConflictException);
  });

  it('throws ConflictException when registrationNumber exists', async () => {
    repository.findByRegistrationNumber.mockResolvedValue(makeVehicleDoc() as never);

    await expect(service.create(baseDto())).rejects.toThrow(ConflictException);
  });

  it('throws BadRequestException when compliance is expired on create', async () => {
    const past = new Date();
    past.setFullYear(past.getFullYear() - 1);

    await expect(
      service.create({
        ...baseDto(),
        registrationExpiryDate: past.toISOString().slice(0, 10),
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('returns paginated list', async () => {
    const doc = makeVehicleDoc();
    repository.findWithFilters.mockResolvedValue({
      items: [doc as never],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });

    const result = await service.findAll({ page: 1, limit: 10 });

    expect(result.data).toHaveLength(1);
    expect(result.meta.total).toBe(1);
  });

  it('throws NotFoundException when vehicle not found', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(service.findById('invalid')).rejects.toThrow(NotFoundException);
  });

  it('prevents retired vehicle from becoming available', async () => {
    const doc = makeVehicleDoc({ status: VehicleStatus.RETIRED });
    repository.findById.mockResolvedValue(doc as never);

    await expect(
      service.updateVehicleStatus('665f1a2b3c4d5e6f7a8b9c0d', VehicleStatus.AVAILABLE),
    ).rejects.toThrow(BadRequestException);
  });

  it('prevents mileage from decreasing', async () => {
    const doc = makeVehicleDoc({ mileage: 50000 });
    repository.findById.mockResolvedValue(doc as never);

    await expect(
      service.updateMileage('665f1a2b3c4d5e6f7a8b9c0d', 40000),
    ).rejects.toThrow(BadRequestException);
  });

  it('assertAssignableToTrip rejects maintenance vehicles', async () => {
    const doc = makeVehicleDoc({ status: VehicleStatus.MAINTENANCE });
    repository.findById.mockResolvedValue(doc as never);

    await expect(service.assertAssignableToTrip('665f1a2b3c4d5e6f7a8b9c0d')).rejects.toThrow(
      BadRequestException,
    );
  });
});
