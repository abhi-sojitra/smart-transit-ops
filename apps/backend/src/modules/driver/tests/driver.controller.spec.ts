import { Test, TestingModule } from '@nestjs/testing';
import { DriverStatus, LicenseCategory, RoleCode } from '@transitops/shared-types';
import { DriverController } from '../controller/driver.controller';
import { DriverService } from '../service/driver.service';
import { CreateDriverDto } from '../dto/create-driver.dto';

describe('DriverController', () => {
  let controller: DriverController;
  let service: jest.Mocked<DriverService>;

  const sampleDriver = {
    id: '665f1a2b3c4d5e6f7a8b9c0d',
    employeeCode: 'EMP-1001',
    firstName: 'Maya',
    lastName: 'Chen',
    fullName: 'Maya Chen',
    email: 'maya.chen@transitops.com',
    phone: '+919876543210',
    joiningDate: '2020-03-01T00:00:00.000Z',
    licenseNumber: 'DL-09-2020-0012345',
    licenseCategory: LicenseCategory.CDL_A,
    licenseExpiryDate: '2028-02-15T00:00:00.000Z',
    experienceYears: 5,
    status: DriverStatus.AVAILABLE,
    safetyScore: 95,
    isDeleted: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  beforeEach(async () => {
    const mockService: Partial<jest.Mocked<DriverService>> = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      updateDriverStatus: jest.fn(),
      updateSafetyScore: jest.fn(),
      getAvailableDrivers: jest.fn(),
      getDriverStatistics: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DriverController],
      providers: [{ provide: DriverService, useValue: mockService }],
    }).compile();

    controller = module.get(DriverController);
    service = module.get(DriverService);
  });

  it('create delegates to service', async () => {
    const dto = {
      employeeCode: 'EMP-1001',
      firstName: 'Maya',
      lastName: 'Chen',
      email: 'maya.chen@transitops.com',
      phone: '+919876543210',
      joiningDate: '2020-03-01',
      licenseNumber: 'DL-09-2020-0012345',
      licenseCategory: LicenseCategory.CDL_A,
      licenseExpiryDate: '2028-02-15',
      experienceYears: 5,
    } as CreateDriverDto;
    service.create.mockResolvedValue(sampleDriver as never);

    const user = { sub: 'u1', email: 'admin@x.com', roles: [RoleCode.ADMIN] };
    await expect(controller.create(dto, user)).resolves.toEqual(sampleDriver);
    expect(service.create).toHaveBeenCalledWith(dto, user);
  });

  it('findAll delegates query', async () => {
    service.findAll.mockResolvedValue({
      data: [sampleDriver],
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
      message: 'Drivers retrieved successfully',
    } as never);
    await controller.findAll({ page: 1, limit: 10 });
    expect(service.findAll).toHaveBeenCalled();
  });

  it('getAvailable delegates', async () => {
    service.getAvailableDrivers.mockResolvedValue([sampleDriver] as never);
    await expect(controller.getAvailable()).resolves.toHaveLength(1);
  });

  it('getStatistics delegates', async () => {
    service.getDriverStatistics.mockResolvedValue({
      totalDrivers: 20,
      available: 8,
      onTrip: 5,
      offDuty: 4,
      suspended: 3,
      licenseExpiring: 2,
      averageSafetyScore: 87.5,
    });
    await expect(controller.getStatistics()).resolves.toMatchObject({ totalDrivers: 20 });
  });

  it('findOne delegates', async () => {
    service.findById.mockResolvedValue(sampleDriver as never);
    await expect(controller.findOne(sampleDriver.id)).resolves.toEqual(sampleDriver);
  });

  it('update delegates', async () => {
    service.update.mockResolvedValue(sampleDriver as never);
    await controller.update(sampleDriver.id, { firstName: 'Maya' }, undefined);
    expect(service.update).toHaveBeenCalled();
  });

  it('remove soft-deletes', async () => {
    service.softDelete.mockResolvedValue({ id: sampleDriver.id, deleted: true });
    await expect(controller.remove(sampleDriver.id)).resolves.toEqual({
      id: sampleDriver.id,
      deleted: true,
    });
  });

  it('updateStatus delegates', async () => {
    service.updateDriverStatus.mockResolvedValue(sampleDriver as never);
    await controller.updateStatus(sampleDriver.id, { status: DriverStatus.OFF_DUTY });
    expect(service.updateDriverStatus).toHaveBeenCalledWith(
      sampleDriver.id,
      DriverStatus.OFF_DUTY,
      undefined,
    );
  });

  it('updateSafetyScore delegates', async () => {
    service.updateSafetyScore.mockResolvedValue(sampleDriver as never);
    await controller.updateSafetyScore(sampleDriver.id, { safetyScore: 90 });
    expect(service.updateSafetyScore).toHaveBeenCalledWith(sampleDriver.id, 90, undefined);
  });
});
