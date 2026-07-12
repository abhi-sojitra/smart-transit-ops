import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { DriverStatus, LicenseCategory } from '@transitops/shared-types';
import { DriverService } from '../service/driver.service';
import { DriverRepository } from '../repository/driver.repository';
import { CreateDriverDto } from '../dto/create-driver.dto';

const futureExpiry = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 2);
  return d.toISOString().slice(0, 10);
};

const pastExpiry = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return d.toISOString().slice(0, 10);
};

function makeDriverDoc(overrides: Record<string, unknown> = {}) {
  const expiry = new Date();
  expiry.setFullYear(expiry.getFullYear() + 2);
  return {
    _id: '665f1a2b3c4d5e6f7a8b9c0d',
    employeeCode: 'EMP-1001',
    firstName: 'Maya',
    lastName: 'Chen',
    fullName: 'Maya Chen',
    email: 'maya.chen@transitops.com',
    phone: '+919876543210',
    joiningDate: new Date('2020-03-01'),
    licenseNumber: 'DL-09-2020-0012345',
    licenseCategory: LicenseCategory.CDL_A,
    licenseExpiryDate: expiry,
    experienceYears: 5,
    status: DriverStatus.AVAILABLE,
    safetyScore: 95,
    isDeleted: false,
    documents: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('DriverService', () => {
  let service: DriverService;
  let repository: jest.Mocked<DriverRepository>;

  beforeEach(async () => {
    const mockRepo: Partial<jest.Mocked<DriverRepository>> = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      softDelete: jest.fn(),
      findByEmployeeCode: jest.fn().mockResolvedValue(null),
      findByEmail: jest.fn().mockResolvedValue(null),
      findByPhone: jest.fn().mockResolvedValue(null),
      findByLicenseNumber: jest.fn().mockResolvedValue(null),
      findAvailable: jest.fn(),
      findWithFilters: jest.fn(),
      getStatistics: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DriverService,
        { provide: DriverRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get(DriverService);
    repository = module.get(DriverRepository);
  });

  const baseDto = (): CreateDriverDto => ({
    employeeCode: 'EMP-1001',
    firstName: 'Maya',
    lastName: 'Chen',
    email: 'maya.chen@transitops.com',
    phone: '+919876543210',
    joiningDate: '2020-03-01',
    licenseNumber: 'DL-09-2020-0012345',
    licenseCategory: LicenseCategory.CDL_A,
    licenseExpiryDate: futureExpiry(),
    experienceYears: 5,
  });

  it('creates a driver when unique fields are free', async () => {
    const doc = makeDriverDoc();
    repository.create.mockResolvedValue(doc as never);

    const result = await service.create(baseDto());

    expect(repository.create).toHaveBeenCalled();
    expect(result.employeeCode).toBe('EMP-1001');
    expect(result.fullName).toBe('Maya Chen');
  });

  it('rejects duplicate employee code', async () => {
    repository.findByEmployeeCode.mockResolvedValue(makeDriverDoc() as never);
    await expect(service.create(baseDto())).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects expired license on create', async () => {
    await expect(
      service.create({ ...baseDto(), licenseExpiryDate: pastExpiry() }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lists drivers with pagination meta', async () => {
    repository.findWithFilters.mockResolvedValue({
      items: [makeDriverDoc() as never],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });

    const result = await service.findAll({ page: 1, limit: 10 });
    expect(result.data).toHaveLength(1);
    expect(result.meta.total).toBe(1);
  });

  it('throws NotFound when driver missing', async () => {
    repository.findById.mockResolvedValue(null);
    await expect(service.findById('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('soft deletes a driver', async () => {
    repository.findById.mockResolvedValue(makeDriverDoc() as never);
    repository.softDelete.mockResolvedValue(makeDriverDoc({ isDeleted: true }) as never);

    const result = await service.softDelete('665f1a2b3c4d5e6f7a8b9c0d');
    expect(result.deleted).toBe(true);
  });

  it('blocks Available status for suspended drivers', async () => {
    repository.findById.mockResolvedValue(
      makeDriverDoc({ status: DriverStatus.SUSPENDED }) as never,
    );

    await expect(
      service.updateDriverStatus('665f1a2b3c4d5e6f7a8b9c0d', DriverStatus.AVAILABLE),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('blocks Available status when license is expired', async () => {
    const expired = new Date();
    expired.setFullYear(expired.getFullYear() - 1);
    repository.findById.mockResolvedValue(
      makeDriverDoc({
        status: DriverStatus.OFF_DUTY,
        licenseExpiryDate: expired,
      }) as never,
    );

    await expect(
      service.updateDriverStatus('665f1a2b3c4d5e6f7a8b9c0d', DriverStatus.AVAILABLE),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('updates safety score within range', async () => {
    repository.findById.mockResolvedValue(makeDriverDoc() as never);
    repository.update.mockResolvedValue(makeDriverDoc({ safetyScore: 88 }) as never);

    const result = await service.updateSafetyScore('665f1a2b3c4d5e6f7a8b9c0d', 88);
    expect(result.safetyScore).toBe(88);
  });

  it('rejects safety score outside 0-100', async () => {
    await expect(service.updateSafetyScore('665f1a2b3c4d5e6f7a8b9c0d', 120)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('returns available drivers', async () => {
    repository.findAvailable.mockResolvedValue([makeDriverDoc() as never]);
    const result = await service.getAvailableDrivers();
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe(DriverStatus.AVAILABLE);
  });

  it('validates driver license', async () => {
    repository.findById.mockResolvedValue(makeDriverDoc() as never);
    const result = await service.validateDriverLicense('665f1a2b3c4d5e6f7a8b9c0d');
    expect(result.valid).toBe(true);
  });

  it('assertAssignableToTrip rejects suspended drivers', async () => {
    repository.findById.mockResolvedValue(
      makeDriverDoc({ status: DriverStatus.SUSPENDED }) as never,
    );
    await expect(service.assertAssignableToTrip('665f1a2b3c4d5e6f7a8b9c0d')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('returns statistics from repository', async () => {
    repository.getStatistics.mockResolvedValue({
      totalDrivers: 20,
      available: 8,
      onTrip: 5,
      offDuty: 4,
      suspended: 3,
      licenseExpiring: 2,
      averageSafetyScore: 87.5,
    });
    const stats = await service.getDriverStatistics();
    expect(stats.totalDrivers).toBe(20);
  });

  it('updates driver profile fields', async () => {
    repository.findById.mockResolvedValue(makeDriverDoc() as never);
    repository.update.mockResolvedValue(
      makeDriverDoc({ firstName: 'Maya', lastName: 'Lee', fullName: 'Maya Lee' }) as never,
    );
    const result = await service.update('665f1a2b3c4d5e6f7a8b9c0d', { lastName: 'Lee' });
    expect(result.fullName).toContain('Lee');
  });

  it('rejects update when license expiry is in the past', async () => {
    repository.findById.mockResolvedValue(makeDriverDoc() as never);
    await expect(
      service.update('665f1a2b3c4d5e6f7a8b9c0d', { licenseExpiryDate: pastExpiry() }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects update to Available for suspended driver', async () => {
    repository.findById.mockResolvedValue(
      makeDriverDoc({ status: DriverStatus.SUSPENDED }) as never,
    );
    await expect(
      service.update('665f1a2b3c4d5e6f7a8b9c0d', { status: DriverStatus.AVAILABLE }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('updates status successfully for off-duty driver', async () => {
    repository.findById.mockResolvedValue(
      makeDriverDoc({ status: DriverStatus.OFF_DUTY }) as never,
    );
    repository.update.mockResolvedValue(
      makeDriverDoc({ status: DriverStatus.AVAILABLE }) as never,
    );
    const result = await service.updateDriverStatus(
      '665f1a2b3c4d5e6f7a8b9c0d',
      DriverStatus.AVAILABLE,
    );
    expect(result.status).toBe(DriverStatus.AVAILABLE);
  });

  it('assertAssignableToTrip accepts available driver', async () => {
    repository.findById.mockResolvedValue(makeDriverDoc() as never);
    const result = await service.assertAssignableToTrip('665f1a2b3c4d5e6f7a8b9c0d');
    expect(result.id).toBe('665f1a2b3c4d5e6f7a8b9c0d');
  });

  it('assertAssignableToTrip rejects on-trip driver', async () => {
    repository.findById.mockResolvedValue(
      makeDriverDoc({ status: DriverStatus.ON_TRIP }) as never,
    );
    await expect(service.assertAssignableToTrip('665f1a2b3c4d5e6f7a8b9c0d')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('assertAssignableToTrip rejects expired license', async () => {
    const expired = new Date();
    expired.setFullYear(expired.getFullYear() - 1);
    repository.findById.mockResolvedValue(
      makeDriverDoc({ licenseExpiryDate: expired }) as never,
    );
    await expect(service.assertAssignableToTrip('665f1a2b3c4d5e6f7a8b9c0d')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('validateDriverLicense reports expired licenses', async () => {
    const expired = new Date();
    expired.setFullYear(expired.getFullYear() - 1);
    repository.findById.mockResolvedValue(
      makeDriverDoc({ licenseExpiryDate: expired }) as never,
    );
    const result = await service.validateDriverLicense('665f1a2b3c4d5e6f7a8b9c0d');
    expect(result.valid).toBe(false);
  });

  it('rejects duplicate email on create', async () => {
    repository.findByEmail.mockResolvedValue(makeDriverDoc() as never);
    await expect(service.create(baseDto())).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws when soft delete target missing after lookup', async () => {
    repository.findById.mockResolvedValue(makeDriverDoc() as never);
    repository.softDelete.mockResolvedValue(null);
    await expect(service.softDelete('665f1a2b3c4d5e6f7a8b9c0d')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
