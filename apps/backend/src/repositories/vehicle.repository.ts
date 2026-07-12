import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { VehicleStatus } from '@transitops/shared-types';
import { BaseRepository } from './base.repository';
import { Vehicle, VehicleDocument } from '../schemas/vehicle.schema';

/**
 * @deprecated Prefer VehicleModule / modules/vehicle/vehicle.repository.
 * Kept for fuel/expense and integration seeds that still inject this path.
 */
@Injectable()
export class VehicleRepository extends BaseRepository<VehicleDocument> {
  constructor(@InjectModel(Vehicle.name) private readonly vehicleModel: Model<VehicleDocument>) {
    super();
  }

  create(data: Partial<Vehicle>): Promise<VehicleDocument> {
    return this.vehicleModel.create(data);
  }

  findById(id: string): Promise<VehicleDocument | null> {
    return this.vehicleModel.findOne({ _id: id, isDeleted: { $ne: true } }).exec();
  }

  findAll(): Promise<VehicleDocument[]> {
    return this.vehicleModel.find({ isDeleted: { $ne: true } }).exec();
  }

  findAvailable(): Promise<VehicleDocument[]> {
    return this.vehicleModel
      .find({
        isDeleted: { $ne: true },
        status: { $in: [VehicleStatus.AVAILABLE, VehicleStatus.ACTIVE] },
      })
      .exec();
  }

  findByFilter(filter: FilterQuery<VehicleDocument>): Promise<VehicleDocument[]> {
    return this.vehicleModel.find({ ...filter, isDeleted: { $ne: true } }).exec();
  }

  countByStatus(status: VehicleStatus): Promise<number> {
    return this.vehicleModel.countDocuments({ status, isDeleted: { $ne: true } }).exec();
  }

  update(id: string, data: Partial<Vehicle>): Promise<VehicleDocument | null> {
    return this.vehicleModel
      .findOneAndUpdate({ _id: id, isDeleted: { $ne: true } }, data, { new: true })
      .exec();
  }

  updateStatus(id: string, status: VehicleStatus): Promise<VehicleDocument | null> {
    return this.update(id, { status });
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.vehicleModel
      .findByIdAndUpdate(id, { isDeleted: true, deletedAt: new Date() }, { new: true })
      .exec();
    return Boolean(result);
  }
}
