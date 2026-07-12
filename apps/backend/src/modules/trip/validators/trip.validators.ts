import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CargoType, type Driver } from '@transitops/shared-types';
import { VehicleService } from '../../fleet/service/vehicle.service';
import { DriverService } from '../../driver/service/driver.service';
import { MaintenanceService } from '../../maintenance/maintenance.service';

type AssignableVehicle = Awaited<ReturnType<VehicleService['assertAssignableToTrip']>>;

export interface TripValidationInput {
  vehicle: AssignableVehicle;
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

    const capacity =
      Number(input.vehicle.maxCapacity) || Number(input.vehicle.seatingCapacity) || 0;
    if (capacity > 0 && input.cargoWeight > capacity) {
      errors.push(
        `Cargo weight (${input.cargoWeight}) exceeds vehicle capacity (${capacity})`,
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
    const [license, vehicleInMaintenance] = await Promise.all([
      this.driverService.validateDriverLicense(params.driverId),
      this.maintenanceService.isVehicleInMaintenance(params.vehicleId),
    ]);

    let vehicle: AssignableVehicle;
    try {
      vehicle = await this.vehicleService.assertAssignableToTrip(params.vehicleId);
    } catch (error) {
      const message = this.exceptionMessage(
        error,
        'Selected vehicle is not available. Refresh and choose another.',
      );
      return { valid: false, errors: [message], warnings: [] };
    }

    let driver: Driver;
    try {
      driver = await this.driverService.assertAssignableToTrip(params.driverId);
    } catch (error) {
      const message = this.exceptionMessage(error, 'Driver cannot be assigned');
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

  private exceptionMessage(error: unknown, fallback: string): string {
    if (error instanceof NotFoundException || error instanceof BadRequestException) {
      const response = error.getResponse();
      if (typeof response === 'string') return response;
      const message = (response as { message?: string | string[] }).message;
      if (Array.isArray(message)) return message.join(', ');
      if (typeof message === 'string') return message;
    }
    if (error instanceof Error) return error.message;
    return fallback;
  }
}
