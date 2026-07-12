import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types, UpdateQuery } from 'mongoose';
import { DriverStatus } from '@transitops/shared-types';
import { BaseRepository } from '../../../repositories/base.repository';
import { Driver, DriverDocument } from '../schema/driver.schema';
import { LICENSE_EXPIRING_DAYS } from '../constants/driver.constants';
import type {
  DriverListOptions,
  DriverListResult,
  DriverStatisticsResult,
  SoftDeletePayload,
} from '../interfaces/driver.interfaces';

@Injectable()
export class DriverRepository extends BaseRepository<DriverDocument> {
  constructor(
    @InjectModel(Driver.name) private readonly driverModel: Model<DriverDocument>,
  ) {
    super();
  }

  create(data: Partial<Driver>): Promise<DriverDocument> {
    return this.driverModel.create(data);
  }

  findById(id: string): Promise<DriverDocument | null> {
    if (!Types.ObjectId.isValid(id)) return Promise.resolve(null);
    return this.driverModel.findOne({ _id: id, isDeleted: false }).exec();
  }

  findAll(): Promise<DriverDocument[]> {
    return this.driverModel.find({ isDeleted: false }).sort({ createdAt: -1 }).exec();
  }

  update(id: string, data: Partial<Driver>): Promise<DriverDocument | null> {
    if (!Types.ObjectId.isValid(id)) return Promise.resolve(null);
    return this.driverModel
      .findOneAndUpdate({ _id: id, isDeleted: false }, data as UpdateQuery<DriverDocument>, {
        new: true,
        runValidators: true,
      })
      .exec();
  }

  async delete(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;
    const result = await this.driverModel
      .findOneAndUpdate(
        { _id: id, isDeleted: false },
        {
          isDeleted: true,
          deletedAt: new Date(),
          status: DriverStatus.SUSPENDED,
        },
        { new: true },
      )
      .exec();
    return Boolean(result);
  }

  softDelete(id: string, payload: SoftDeletePayload): Promise<DriverDocument | null> {
    if (!Types.ObjectId.isValid(id)) return Promise.resolve(null);
    return this.driverModel
      .findOneAndUpdate(
        { _id: id, isDeleted: false },
        {
          isDeleted: true,
          deletedAt: payload.deletedAt,
          deletedBy: payload.deletedBy,
        },
        { new: true },
      )
      .exec();
  }

  findByEmployeeCode(employeeCode: string, excludeId?: string): Promise<DriverDocument | null> {
    const filter: FilterQuery<DriverDocument> = {
      employeeCode: employeeCode.toUpperCase().trim(),
      isDeleted: false,
    };
    if (excludeId && Types.ObjectId.isValid(excludeId)) {
      filter._id = { $ne: excludeId };
    }
    return this.driverModel.findOne(filter).exec();
  }

  findByEmail(email: string, excludeId?: string): Promise<DriverDocument | null> {
    const filter: FilterQuery<DriverDocument> = {
      email: email.toLowerCase().trim(),
      isDeleted: false,
    };
    if (excludeId && Types.ObjectId.isValid(excludeId)) {
      filter._id = { $ne: excludeId };
    }
    return this.driverModel.findOne(filter).exec();
  }

  findByPhone(phone: string, excludeId?: string): Promise<DriverDocument | null> {
    const filter: FilterQuery<DriverDocument> = {
      phone: phone.trim(),
      isDeleted: false,
    };
    if (excludeId && Types.ObjectId.isValid(excludeId)) {
      filter._id = { $ne: excludeId };
    }
    return this.driverModel.findOne(filter).exec();
  }

  findByLicenseNumber(licenseNumber: string, excludeId?: string): Promise<DriverDocument | null> {
    const filter: FilterQuery<DriverDocument> = {
      licenseNumber: licenseNumber.toUpperCase().trim(),
      isDeleted: false,
    };
    if (excludeId && Types.ObjectId.isValid(excludeId)) {
      filter._id = { $ne: excludeId };
    }
    return this.driverModel.findOne(filter).exec();
  }

  findAvailable(): Promise<DriverDocument[]> {
    const today = this.startOfToday();
    return this.driverModel
      .find({
        isDeleted: false,
        status: DriverStatus.AVAILABLE,
        licenseExpiryDate: { $gt: today },
      })
      .sort({ fullName: 1 })
      .exec();
  }

  async findWithFilters(options: DriverListOptions): Promise<DriverListResult<DriverDocument>> {
    const { page, limit, sortBy, sortOrder, filters } = options;
    const query = this.buildListFilter(filters);
    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [items, total] = await Promise.all([
      this.driverModel.find(query).sort(sort).skip(skip).limit(limit).exec(),
      this.driverModel.countDocuments(query).exec(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    };
  }

  async getStatistics(): Promise<DriverStatisticsResult> {
    const today = this.startOfToday();
    const expiringCutoff = new Date(today);
    expiringCutoff.setDate(expiringCutoff.getDate() + LICENSE_EXPIRING_DAYS);

    const [totals] = await this.driverModel
      .aggregate<DriverStatisticsResult>([
        { $match: { isDeleted: false } },
        {
          $group: {
            _id: null,
            totalDrivers: { $sum: 1 },
            available: {
              $sum: { $cond: [{ $eq: ['$status', DriverStatus.AVAILABLE] }, 1, 0] },
            },
            onTrip: {
              $sum: { $cond: [{ $eq: ['$status', DriverStatus.ON_TRIP] }, 1, 0] },
            },
            offDuty: {
              $sum: { $cond: [{ $eq: ['$status', DriverStatus.OFF_DUTY] }, 1, 0] },
            },
            suspended: {
              $sum: { $cond: [{ $eq: ['$status', DriverStatus.SUSPENDED] }, 1, 0] },
            },
            licenseExpiring: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $gt: ['$licenseExpiryDate', today] },
                      { $lte: ['$licenseExpiryDate', expiringCutoff] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            averageSafetyScore: { $avg: '$safetyScore' },
          },
        },
        {
          $project: {
            _id: 0,
            totalDrivers: 1,
            available: 1,
            onTrip: 1,
            offDuty: 1,
            suspended: 1,
            licenseExpiring: 1,
            averageSafetyScore: {
              $round: [{ $ifNull: ['$averageSafetyScore', 0] }, 1],
            },
          },
        },
      ])
      .exec();

    return (
      totals ?? {
        totalDrivers: 0,
        available: 0,
        onTrip: 0,
        offDuty: 0,
        suspended: 0,
        licenseExpiring: 0,
        averageSafetyScore: 0,
      }
    );
  }

  private buildListFilter(filters: DriverListOptions['filters']): FilterQuery<DriverDocument> {
    const query: FilterQuery<DriverDocument> = { isDeleted: false };

    if (filters.status) query.status = filters.status;
    if (filters.licenseCategory) query.licenseCategory = filters.licenseCategory;
    if (filters.city) query.city = new RegExp(`^${this.escapeRegex(filters.city)}$`, 'i');
    if (filters.state) query.state = new RegExp(`^${this.escapeRegex(filters.state)}$`, 'i');

    if (filters.experienceMin !== undefined || filters.experienceMax !== undefined) {
      query.experienceYears = {};
      if (filters.experienceMin !== undefined) {
        query.experienceYears.$gte = filters.experienceMin;
      }
      if (filters.experienceMax !== undefined) {
        query.experienceYears.$lte = filters.experienceMax;
      }
    }

    if (filters.search?.trim()) {
      const term = this.escapeRegex(filters.search.trim());
      const regex = new RegExp(term, 'i');
      query.$or = [
        { fullName: regex },
        { firstName: regex },
        { lastName: regex },
        { email: regex },
        { employeeCode: regex },
        { licenseNumber: regex },
        { phone: regex },
      ];
    }

    return query;
  }

  private startOfToday(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
