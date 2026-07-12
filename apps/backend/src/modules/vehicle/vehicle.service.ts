import { Injectable, NotFoundException } from '@nestjs/common';
import { VehicleStatus } from '@transitops/shared-types';
import { VehicleRepository } from './vehicle.repository';
import { VehicleDocument } from './schema/vehicle.schema';

@Injectable()
export class VehicleService {
  constructor(private readonly vehicles: VehicleRepository) {}

  async findById(id: string): Promise<VehicleDocument> {
    const vehicle = await this.vehicles.findById(id);
    if (!vehicle) {
      throw new NotFoundException(`Vehicle ${id} not found`);
    }
    return vehicle;
  }

  findAvailable() {
    return this.vehicles.findAvailable();
  }

  findAll() {
    return this.vehicles.findAll();
  }

  updateStatus(id: string, status: VehicleStatus) {
    return this.vehicles.updateStatus(id, status);
  }

  isDispatchBlocked(vehicle: VehicleDocument): string | null {
    if (vehicle.status === VehicleStatus.MAINTENANCE) {
      return 'Vehicle is in maintenance (In Shop) and cannot be dispatched';
    }
    if (vehicle.status === VehicleStatus.RETIRED) {
      return 'Vehicle is retired and cannot be dispatched';
    }
    if (vehicle.status === VehicleStatus.ON_TRIP) {
      return 'Vehicle is already on a trip';
    }
    if (vehicle.status !== VehicleStatus.AVAILABLE && vehicle.status !== VehicleStatus.ACTIVE) {
      return `Vehicle status must be Available (current: ${vehicle.status})`;
    }
    return null;
  }

  create(data: Partial<VehicleDocument>) {
    return this.vehicles.create(data);
  }
}
