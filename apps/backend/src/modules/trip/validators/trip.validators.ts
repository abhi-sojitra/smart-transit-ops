import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { CargoType, type Driver } from '@transitops/shared-types';
import { VehicleDocument } from '../../vehicle/schema/vehicle.schema';
import { VehicleService } from '../../vehicle/vehicle.service';
import { DriverService } from '../../driver/service/driver.service';
import { MaintenanceService } from '../../maintenance/maintenance.service';

export interface TripValidationInput {
  vehicle: VehicleDocument;
  driver: Driver;
  cargoWeight: number;
  cargoType?: CargoType;
  plannedStartDate?: Date;
  plannedEndDate?: Date;
  vehicleHasActiveTrip?: boolean;
  driverHasActiveTrip?: boolean;
  vehicleInMaintenance?: boolean;
}

export interface TripValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

@Injectable()
export class TripValidators {
  constructor(
    private readonly vehicleService: VehicleService,
    private readonly driverService: DriverService,
    private readonly maintenanceService: MaintenanceService,
  ) {}

  validateAssignment(input: TripValidationInput): TripValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const vehicleBlock = this.vehicleService.isDispatchBlocked(input.vehicle);
    if (vehicleBlock) errors.push(vehicleBlock);

    if (input.driver.status === 'SUSPENDED') {
      errors.push('Driver is suspended and cannot be dispatched');
    } else if (input.driver.status === 'ON_TRIP') {
      errors.push('Driver is already on a trip');
    } else if (input.driver.licenseStatus === 'EXPIRED') {
      errors.push('Driver license is expired');
    } else if (input.driver.status !== 'AVAILABLE') {
      errors.push(`Driver status must be Available (current: ${input.driver.status})`);
    }

    if (input.vehicleInMaintenance) {
      errors.push('Vehicle has an active maintenance record; trip dispatch is blocked');
    }

    if (input.cargoWeight > input.vehicle.maxCapacity) {
      errors.push(
        `Cargo weight (${input.cargoWeight}) exceeds vehicle max capacity (${input.vehicle.maxCapacity})`,
      );
    }

    if (input.vehicleHasActiveTrip) {
      errors.push('Vehicle already has another active trip');
    }

    if (input.driverHasActiveTrip) {
      errors.push('Driver already has another active trip');
    }

    if (
      input.plannedStartDate &&
      input.plannedEndDate &&
      input.plannedEndDate.getTime() < input.plannedStartDate.getTime()
    ) {
      errors.push('Planned end date must be after planned start date');
    }

    if (input.driver.licenseStatus === 'EXPIRING') {
      warnings.push('Driver license is expiring soon');
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  assertValid(result: TripValidationResult): void {
    if (!result.valid) {
      throw new BadRequestException({
        message: 'Trip validation failed',
        errors: result.errors,
        warnings: result.warnings,
      });
    }
  }

  async buildValidationContext(params: {
    vehicleId: string;
    driverId: string;
    cargoWeight: number;
    plannedStartDate?: Date;
    plannedEndDate?: Date;
    vehicleHasActiveTrip: boolean;
    driverHasActiveTrip: boolean;
  }): Promise<TripValidationResult> {
    const [vehicle, license, vehicleInMaintenance] = await Promise.all([
      this.vehicleService.findById(params.vehicleId),
      this.driverService.validateDriverLicense(params.driverId),
      this.maintenanceService.isVehicleInMaintenance(params.vehicleId),
    ]);

    // assertAssignableToTrip enforces status + license; catch and fold into result
    let driver: Driver;
    try {
      driver = await this.driverService.assertAssignableToTrip(params.driverId);
    } catch (error) {
      const message =
        error instanceof BadRequestException
          ? String((error.getResponse() as { message?: string }).message ?? error.message)
          : error instanceof Error
            ? error.message
            : 'Driver cannot be assigned';
      return {
        valid: false,
        errors: [message],
        warnings: license.status === 'EXPIRING' ? ['Driver license is expiring soon'] : [],
      };
    }

    return this.validateAssignment({
      vehicle,
      driver: { ...driver, licenseStatus: license.status },
      cargoWeight: params.cargoWeight,
      plannedStartDate: params.plannedStartDate,
      plannedEndDate: params.plannedEndDate,
      vehicleHasActiveTrip: params.vehicleHasActiveTrip,
      driverHasActiveTrip: params.driverHasActiveTrip,
      vehicleInMaintenance,
    });
  }
}
