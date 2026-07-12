import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TripStatus, VehicleStatus, DriverStatus, CargoType } from '@transitops/shared-types';
import { TripService } from '../service/trip.service';

describe('TripService', () => {
  const tripRepo = {
    create: jest.fn(),
    findById: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    nextTripNumber: jest.fn(),
    hasActiveTripForVehicle: jest.fn(),
    hasActiveTripForDriver: jest.fn(),
    getStatistics: jest.fn(),
  };

  const validators = {
    buildValidationContext: jest.fn(),
    assertValid: jest.fn(),
  };

  const vehicleService = {
    findById: jest.fn(),
    updateStatus: jest.fn(),
    findAvailable: jest.fn(),
  };

  const driverService = {
    findById: jest.fn(),
    updateDriverStatus: jest.fn(),
    getAvailableDrivers: jest.fn(),
    assertAssignableToTrip: jest.fn(),
    validateDriverLicense: jest.fn(),
  };

  let service: TripService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TripService(
      tripRepo as never,
      validators as never,
      vehicleService as never,
      driverService as never,
    );
  });

  it('createTrip creates a draft with generated trip number', async () => {
    validators.buildValidationContext.mockResolvedValue({ valid: true, errors: [], warnings: [] });
    tripRepo.hasActiveTripForVehicle.mockResolvedValue(false);
    tripRepo.hasActiveTripForDriver.mockResolvedValue(false);
    tripRepo.nextTripNumber.mockResolvedValue('TR-0001');
    tripRepo.create.mockResolvedValue({ tripNumber: 'TR-0001', status: TripStatus.DRAFT });

    const result = await service.createTrip({
      source: 'A',
      destination: 'B',
      vehicleId: '507f1f77bcf86cd799439011',
      driverId: '507f1f77bcf86cd799439012',
      cargoName: 'Goods',
      cargoWeight: 1000,
      cargoType: CargoType.GENERAL,
      plannedDistance: 100,
      plannedStartDate: '2026-07-15T08:00:00.000Z',
      plannedEndDate: '2026-07-15T18:00:00.000Z',
      estimatedRevenue: 500,
    });

    expect(tripRepo.create).toHaveBeenCalled();
    expect(result.status).toBe(TripStatus.DRAFT);
  });

  it('dispatchTrip marks vehicle and driver ON_TRIP', async () => {
    tripRepo.findById.mockResolvedValue({
      _id: 't1',
      status: TripStatus.DRAFT,
      vehicleId: '507f1f77bcf86cd799439011',
      driverId: '507f1f77bcf86cd799439012',
      cargoWeight: 1000,
      plannedStartDate: new Date(),
      plannedEndDate: new Date(),
    });
    tripRepo.hasActiveTripForVehicle.mockResolvedValue(false);
    tripRepo.hasActiveTripForDriver.mockResolvedValue(false);
    validators.buildValidationContext.mockResolvedValue({ valid: true, errors: [], warnings: [] });
    tripRepo.update.mockResolvedValue({ status: TripStatus.DISPATCHED });

    await service.dispatchTrip('t1');

    expect(vehicleService.updateStatus).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
      VehicleStatus.ON_TRIP,
    );
    expect(driverService.updateDriverStatus).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439012',
      DriverStatus.ON_TRIP,
      undefined,
    );
  });

  it('completeTrip restores availability and stores actuals', async () => {
    tripRepo.findById.mockResolvedValue({
      _id: 't1',
      status: TripStatus.IN_PROGRESS,
      vehicleId: '507f1f77bcf86cd799439011',
      driverId: '507f1f77bcf86cd799439012',
      notes: 'ok',
    });
    tripRepo.update.mockResolvedValue({ status: TripStatus.COMPLETED });

    await service.completeTrip('t1', {
      actualDistance: 120,
      fuelConsumed: 40,
      actualRevenue: 900,
    });

    expect(vehicleService.updateStatus).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
      VehicleStatus.AVAILABLE,
    );
    expect(driverService.updateDriverStatus).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439012',
      DriverStatus.AVAILABLE,
      undefined,
    );
    expect(tripRepo.update).toHaveBeenCalledWith(
      't1',
      expect.objectContaining({
        status: TripStatus.COMPLETED,
        actualDistance: 120,
        fuelConsumed: 40,
        actualRevenue: 900,
      }),
    );
  });

  it('cancelTrip rejects completed trips', async () => {
    tripRepo.findById.mockResolvedValue({
      _id: 't1',
      status: TripStatus.COMPLETED,
      vehicleId: '507f1f77bcf86cd799439011',
      driverId: '507f1f77bcf86cd799439012',
    });

    await expect(service.cancelTrip('t1', {})).rejects.toBeInstanceOf(BadRequestException);
  });

  it('findOne throws when missing', async () => {
    tripRepo.findById.mockResolvedValue(null);
    await expect(service.findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('TripValidators license helpers', () => {
  it('flags expired licenses via shared mapper helper', () => {
    const { isLicenseExpired } = require('../../driver/service/driver.mapper');
    expect(isLicenseExpired(new Date('2020-01-01'))).toBe(true);
    expect(isLicenseExpired(new Date(Date.now() + 86400000 * 60))).toBe(false);
  });
});
