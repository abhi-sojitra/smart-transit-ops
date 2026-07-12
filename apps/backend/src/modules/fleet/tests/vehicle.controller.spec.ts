import { Test, TestingModule } from '@nestjs/testing';
import { FuelType, RoleCode, VehicleStatus, VehicleType } from '@transitops/shared-types';
import { VehicleController } from '../controller/vehicle.controller';
import { VehicleService } from '../service/vehicle.service';
import { CreateVehicleDto } from '../dto/create-vehicle.dto';

describe('VehicleController', () => {
  let controller: VehicleController;
  let service: jest.Mocked<VehicleService>;

  const sampleVehicle = {
    id: '665f1a2b3c4d5e6f7a8b9c0d',
    vehicleId: 'VH-1001',
    registrationNumber: 'KA01AB1001',
    make: 'Tata',
    model: 'Starbus Ultra',
    year: 2022,
    vehicleType: VehicleType.BUS,
    fuelType: FuelType.DIESEL,
    mileage: 84210,
    registrationExpiryDate: '2028-06-15T00:00:00.000Z',
    insuranceExpiryDate: '2027-12-31T00:00:00.000Z',
    fitnessCertificateExpiryDate: '2027-09-30T00:00:00.000Z',
    status: VehicleStatus.AVAILABLE,
    isDeleted: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  beforeEach(async () => {
    const mockService: Partial<jest.Mocked<VehicleService>> = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      updateVehicleStatus: jest.fn(),
      updateMileage: jest.fn(),
      getAvailableVehicles: jest.fn(),
      getVehicleStatistics: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VehicleController],
      providers: [{ provide: VehicleService, useValue: mockService }],
    }).compile();

    controller = module.get(VehicleController);
    service = module.get(VehicleService);
  });

  it('create delegates to service', async () => {
    const dto = {
      vehicleId: 'VH-1001',
      registrationNumber: 'KA01AB1001',
      make: 'Tata',
      model: 'Starbus Ultra',
      vehicleType: VehicleType.BUS,
      fuelType: FuelType.DIESEL,
      mileage: 84210,
      registrationExpiryDate: '2028-06-15',
      insuranceExpiryDate: '2027-12-31',
      fitnessCertificateExpiryDate: '2027-09-30',
    } as CreateVehicleDto;
    service.create.mockResolvedValue(sampleVehicle as never);

    const user = { sub: 'u1', email: 'fleet@x.com', roles: [RoleCode.FLEET_MANAGER] };
    await expect(controller.create(dto, user)).resolves.toEqual(sampleVehicle);
    expect(service.create).toHaveBeenCalledWith(dto, user);
  });

  it('findAll delegates query', async () => {
    service.findAll.mockResolvedValue({
      data: [sampleVehicle],
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
      message: 'Vehicles retrieved successfully',
    } as never);
    await controller.findAll({ page: 1, limit: 10 });
    expect(service.findAll).toHaveBeenCalled();
  });

  it('getAvailable delegates', async () => {
    service.getAvailableVehicles.mockResolvedValue([sampleVehicle] as never);
    await expect(controller.getAvailable()).resolves.toHaveLength(1);
  });

  it('getStatistics delegates', async () => {
    service.getVehicleStatistics.mockResolvedValue({
      totalVehicles: 20,
      available: 8,
      onTrip: 5,
      maintenance: 4,
      retired: 3,
      insuranceExpiring: 2,
      fitnessExpiring: 1,
      serviceDueSoon: 2,
      averageMileage: 84210,
    });
    await expect(controller.getStatistics()).resolves.toMatchObject({ totalVehicles: 20 });
  });

  it('findOne delegates', async () => {
    service.findById.mockResolvedValue(sampleVehicle as never);
    await expect(controller.findOne(sampleVehicle.id)).resolves.toEqual(sampleVehicle);
  });

  it('update delegates', async () => {
    service.update.mockResolvedValue(sampleVehicle as never);
    await controller.update(sampleVehicle.id, { make: 'Volvo' }, undefined);
    expect(service.update).toHaveBeenCalled();
  });

  it('remove soft-deletes', async () => {
    service.softDelete.mockResolvedValue({ id: sampleVehicle.id, deleted: true });
    await expect(controller.remove(sampleVehicle.id)).resolves.toEqual({
      id: sampleVehicle.id,
      deleted: true,
    });
  });

  it('updateStatus delegates', async () => {
    service.updateVehicleStatus.mockResolvedValue(sampleVehicle as never);
    await controller.updateStatus(sampleVehicle.id, { status: VehicleStatus.MAINTENANCE });
    expect(service.updateVehicleStatus).toHaveBeenCalledWith(
      sampleVehicle.id,
      VehicleStatus.MAINTENANCE,
      undefined,
    );
  });

  it('updateMileage delegates', async () => {
    service.updateMileage.mockResolvedValue(sampleVehicle as never);
    await controller.updateMileage(sampleVehicle.id, { mileage: 90000 });
    expect(service.updateMileage).toHaveBeenCalledWith(sampleVehicle.id, 90000, undefined);
  });
});
