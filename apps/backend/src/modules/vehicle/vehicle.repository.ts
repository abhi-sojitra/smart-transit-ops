import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { VehicleStatus } from '@transitops/shared-types';
import { Vehicle, VehicleDocument } from './schema/vehicle.schema';

@Injectable()
export class VehicleRepository {
  constructor(@InjectModel(Vehicle.name) private readonly model: Model<VehicleDocument>) {}

  create(data: Partial<Vehicle>): Promise<VehicleDocument> {
    return this.model.create(data);
  }

  findById(id: string): Promise<VehicleDocument | null> {
    return this.model.findOne({ _id: id, isDeleted: { $ne: true } }).exec();
  }

  findByVehicleId(vehicleId: string): Promise<VehicleDocument | null> {
    return this.model.findOne({ vehicleId, isDeleted: { $ne: true } }).exec();
  }

  findAvailable(): Promise<VehicleDocument[]> {
    return this.model
      .find({
        isDeleted: { $ne: true },
        status: { $in: [VehicleStatus.AVAILABLE, VehicleStatus.ACTIVE] },
      })
      .exec();
  }

  findAll(): Promise<VehicleDocument[]> {
    return this.model.find({ isDeleted: { $ne: true } }).exec();
  }

  updateStatus(id: string, status: VehicleStatus): Promise<VehicleDocument | null> {
    return this.model
      .findOneAndUpdate({ _id: id, isDeleted: { $ne: true } }, { $set: { status } }, { new: true })
      .exec();
  }

  update(id: string, data: Partial<Vehicle>): Promise<VehicleDocument | null> {
    return this.model
      .findOneAndUpdate({ _id: id, isDeleted: { $ne: true } }, { $set: data }, { new: true })
      .exec();
  }

  countByStatus(status: VehicleStatus): Promise<number> {
    return this.model.countDocuments({ status, isDeleted: { $ne: true } }).exec();
  }
}
