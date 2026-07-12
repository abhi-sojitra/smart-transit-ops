import { Injectable } from '@nestjs/common';
import { MaintenanceRepository } from './maintenance.repository';

@Injectable()
export class MaintenanceService {
  constructor(private readonly maintenance: MaintenanceRepository) {}

  async isVehicleInMaintenance(vehicleId: string): Promise<boolean> {
    const active = await this.maintenance.findActiveByVehicle(vehicleId);
    return Boolean(active);
  }

  async getActiveMaintenance(vehicleId: string) {
    return this.maintenance.findActiveByVehicle(vehicleId);
  }

  create(data: Parameters<MaintenanceRepository['create']>[0]) {
    return this.maintenance.create(data);
  }
}
