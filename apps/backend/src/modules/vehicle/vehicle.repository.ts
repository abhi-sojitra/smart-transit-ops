import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { VehicleStatus } from '@transitops/shared-types';
import { Vehicle, VehicleDocument } from './schema/vehicle.schema';

@Injectable()
export class VehicleRepository {
  constructor(@InjectModel(Vehicle.name) private readonly model: Model<VehicleDocument>) {}

  create(data: Partial<Vehicle>): Promise<VehicleDocument> {
    return this.model.create(data);
  }

  async findById(id: string): Promise<VehicleDocument | null> {
    if (Types.ObjectId.isValid(id)) {
      const byObjectId = await this.model
        .findOne({ _id: new Types.ObjectId(id), isDeleted: { $ne: true } })
        .exec();
      if (byObjectId) return byObjectId;
    }
    return this.findByVehicleId(id);
  }

  findByVehicleId(vehicleId: string): Promise<VehicleDocument | null> {
    return this.model
      .findOne({ vehicleId: vehicleId.toUpperCase(), isDeleted: { $ne: true } })
      .exec();
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
    const filter = Types.ObjectId.isValid(id)
      ? { _id: new Types.ObjectId(id), isDeleted: { $ne: true } }
      : { vehicleId: id.toUpperCase(), isDeleted: { $ne: true } };
    return this.model.findOneAndUpdate(filter, { $set: { status } }, { new: true }).exec();
  }

  update(id: string, data: Partial<Vehicle>): Promise<VehicleDocument | null> {
    const filter = Types.ObjectId.isValid(id)
      ? { _id: new Types.ObjectId(id), isDeleted: { $ne: true } }
      : { vehicleId: id.toUpperCase(), isDeleted: { $ne: true } };
    return this.model.findOneAndUpdate(filter, { $set: data }, { new: true }).exec();
  }

  countByStatus(status: VehicleStatus): Promise<number> {
    return this.model.countDocuments({ status, isDeleted: { $ne: true } }).exec();
  }
}
