import { Injectable, NotFoundException } from '@nestjs/common';
import { DriverStatus, LicenseStatus } from '@transitops/shared-types';
import { DriverRepository } from './driver.repository';
import { DriverDocument } from './schema/driver.schema';

@Injectable()
export class DriverService {
  constructor(private readonly drivers: DriverRepository) {}

  async findById(id: string): Promise<DriverDocument> {
    const driver = await this.drivers.findById(id);
    if (!driver) {
      throw new NotFoundException(`Driver ${id} not found`);
    }
    return driver;
  }

  findByUserId(userId: string) {
    return this.drivers.findByUserId(userId);
  }

  findAvailable() {
    return this.drivers.findAvailable();
  }

  findAll() {
    return this.drivers.findAll();
  }

  updateStatus(id: string, status: DriverStatus) {
    return this.drivers.updateStatus(id, status);
  }

  isLicenseExpired(driver: DriverDocument, at: Date = new Date()): boolean {
    if (driver.licenseStatus === LicenseStatus.EXPIRED) {
      return true;
    }
    if (driver.licenseExpiry && driver.licenseExpiry.getTime() < at.getTime()) {
      return true;
    }
    return false;
  }

  isDispatchBlocked(driver: DriverDocument): string | null {
    if (driver.status === DriverStatus.SUSPENDED) {
      return 'Driver is suspended and cannot be dispatched';
    }
    if (driver.status === DriverStatus.ON_TRIP) {
      return 'Driver is already on a trip';
    }
    if (this.isLicenseExpired(driver)) {
      return 'Driver license is expired';
    }
    if (driver.status !== DriverStatus.AVAILABLE) {
      return `Driver status must be Available (current: ${driver.status})`;
    }
    return null;
  }

  create(data: Partial<DriverDocument>) {
    return this.drivers.create(data);
  }
}
