import { DriverStatus, LicenseCategory, VehicleStatus, VehicleType, FuelType } from '@transitops/shared-types';
import { TripValidators } from '../validators/trip.validators';

describe('TripValidators.validateAssignment', () => {
  const validators = new TripValidators({} as never, {} as never, {} as never);

  const baseVehicle = {
    id: 'v1',
    vehicleId: 'VH-1001',
    registrationNumber: 'KA01AB1001',
    make: 'Tata',
    model: 'Starbus',
    vehicleType: VehicleType.TRUCK,
    fuelType: FuelType.DIESEL,
    maxCapacity: 500,
    seatingCapacity: 2,
    mileage: 1000,
    registrationExpiryDate: '2028-01-01',
    insuranceExpiryDate: '2028-01-01',
    fitnessCertificateExpiryDate: '2028-01-01',
    status: VehicleStatus.AVAILABLE,
    isDeleted: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  const baseDriver = {
    id: 'd1',
    employeeCode: 'DR-1',
    firstName: 'Ada',
    lastName: 'Lovelace',
    fullName: 'Ada Lovelace',
    email: 'ada@example.com',
    phone: '+911234567890',
    joiningDate: '2020-01-01T00:00:00.000Z',
    licenseNumber: 'DL-1',
    licenseExpiryDate: '2028-01-01',
    licenseCategory: LicenseCategory.HMV,
    licenseStatus: 'VALID' as const,
    status: DriverStatus.AVAILABLE,
    safetyScore: 90,
    isDeleted: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  it('rejects cargo weight above vehicle capacity', () => {
    const result = validators.validateAssignment({
      vehicle: baseVehicle as never,
      driver: baseDriver as never,
      cargoWeight: 600,
    });

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('exceeds vehicle capacity'))).toBe(true);
  });

  it('rejects when vehicle has no max load capacity configured', () => {
    const result = validators.validateAssignment({
      vehicle: { ...baseVehicle, maxCapacity: 0, seatingCapacity: 0 } as never,
      driver: baseDriver as never,
      cargoWeight: 100,
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Vehicle has no max load capacity configured');
  });

  it('accepts cargo within capacity', () => {
    const result = validators.validateAssignment({
      vehicle: baseVehicle as never,
      driver: baseDriver as never,
      cargoWeight: 400,
    });

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
