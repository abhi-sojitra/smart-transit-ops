import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DriverStatus } from '@transitops/shared-types';
import { Driver, DriverDocument } from './schema/driver.schema';

@Injectable()
export class DriverRepository {
  constructor(@InjectModel(Driver.name) private readonly model: Model<DriverDocument>) {}

  create(data: Partial<Driver>): Promise<DriverDocument> {
    return this.model.create(data);
  }

  findById(id: string): Promise<DriverDocument | null> {
    return this.model.findOne({ _id: id, isDeleted: { $ne: true } }).exec();
  }

  findByUserId(userId: string): Promise<DriverDocument | null> {
    return this.model.findOne({ userId, isDeleted: { $ne: true } }).exec();
  }

  findAvailable(): Promise<DriverDocument[]> {
    return this.model
      .find({
        isDeleted: { $ne: true },
        status: DriverStatus.AVAILABLE,
      })
      .exec();
  }

  findAll(): Promise<DriverDocument[]> {
    return this.model.find({ isDeleted: { $ne: true } }).exec();
  }

  updateStatus(id: string, status: DriverStatus): Promise<DriverDocument | null> {
    return this.model
      .findOneAndUpdate({ _id: id, isDeleted: { $ne: true } }, { $set: { status } }, { new: true })
      .exec();
  }

  update(id: string, data: Partial<Driver>): Promise<DriverDocument | null> {
    return this.model
      .findOneAndUpdate({ _id: id, isDeleted: { $ne: true } }, { $set: data }, { new: true })
      .exec();
  }
}
