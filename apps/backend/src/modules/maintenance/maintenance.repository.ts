import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MaintenanceStatus } from '@transitops/shared-types';
import { Maintenance, MaintenanceDocument } from './schema/maintenance.schema';

@Injectable()
export class MaintenanceRepository {
  constructor(@InjectModel(Maintenance.name) private readonly model: Model<MaintenanceDocument>) {}

  create(data: Partial<Maintenance>): Promise<MaintenanceDocument> {
    return this.model.create(data);
  }

  findActiveByVehicle(vehicleId: string): Promise<MaintenanceDocument | null> {
    return this.model
      .findOne({
        vehicleId: new Types.ObjectId(vehicleId),
        isDeleted: { $ne: true },
        status: { $in: [MaintenanceStatus.SCHEDULED, MaintenanceStatus.IN_PROGRESS] },
      })
      .exec();
  }
}
