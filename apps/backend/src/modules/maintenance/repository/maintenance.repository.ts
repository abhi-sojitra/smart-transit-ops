import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { MaintenanceStatus } from '@transitops/shared-types';
import { BaseRepository } from '../../../repositories/base.repository';
import { MAINTENANCE_ACTIVE_STATUSES } from '../constants/maintenance.constants';
import type {
  MaintenanceQueryOptions,
  PaginatedResult,
} from '../interfaces/maintenance.interfaces';
import {
  Maintenance,
  MaintenanceAttachmentEmbedded,
  MaintenanceDocument,
} from '../schema/maintenance.schema';

@Injectable()
export class MaintenanceRepository extends BaseRepository<MaintenanceDocument> {
  constructor(
    @InjectModel(Maintenance.name) private readonly maintenanceModel: Model<MaintenanceDocument>,
  ) {
    super();
  }

  create(data: Partial<Maintenance>): Promise<MaintenanceDocument> {
    return this.maintenanceModel.create(data);
  }

  findById(id: string): Promise<MaintenanceDocument | null> {
    return this.maintenanceModel
      .findOne({ _id: id, isDeleted: { $ne: true } })
      .populate('vehicleId')
      .exec();
  }

  findAll(): Promise<MaintenanceDocument[]> {
    return this.maintenanceModel
      .find({ isDeleted: { $ne: true } })
      .populate('vehicleId')
      .sort({ createdAt: -1 })
      .exec();
  }

  update(id: string, data: Partial<Maintenance>): Promise<MaintenanceDocument | null> {
    return this.maintenanceModel
      .findOneAndUpdate({ _id: id, isDeleted: { $ne: true } }, data, { new: true })
      .populate('vehicleId')
      .exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.maintenanceModel
      .findOneAndUpdate(
        { _id: id, isDeleted: { $ne: true } },
        { isDeleted: true, deletedAt: new Date() },
        { new: true },
      )
      .exec();
    return Boolean(result);
  }

  softDelete(id: string, deletedBy?: string): Promise<MaintenanceDocument | null> {
    return this.maintenanceModel
      .findOneAndUpdate(
        { _id: id, isDeleted: { $ne: true } },
        { isDeleted: true, deletedAt: new Date(), deletedBy },
        { new: true },
      )
      .exec();
  }

  async findActiveByVehicleId(vehicleId: string): Promise<MaintenanceDocument | null> {
    return this.maintenanceModel
      .findOne({
        vehicleId: new Types.ObjectId(vehicleId),
        isDeleted: { $ne: true },
        status: { $in: MAINTENANCE_ACTIVE_STATUSES },
      })
      .exec();
  }

  async isVehicleInMaintenance(vehicleId: string): Promise<boolean> {
    const count = await this.maintenanceModel
      .countDocuments({
        vehicleId: new Types.ObjectId(vehicleId),
        isDeleted: { $ne: true },
        status: { $in: MAINTENANCE_ACTIVE_STATUSES },
      })
      .exec();
    return count > 0;
  }

  findByVehicleId(vehicleId: string): Promise<MaintenanceDocument[]> {
    return this.maintenanceModel
      .find({
        vehicleId: new Types.ObjectId(vehicleId),
        isDeleted: { $ne: true },
      })
      .populate('vehicleId')
      .sort({ createdAt: -1 })
      .exec();
  }

  async generateMaintenanceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `MNT-${year}-`;
    const latest = await this.maintenanceModel
      .findOne({ maintenanceNumber: { $regex: `^${prefix}` } })
      .sort({ maintenanceNumber: -1 })
      .select('maintenanceNumber')
      .lean()
      .exec();

    let next = 1;
    if (latest?.maintenanceNumber) {
      const parts = latest.maintenanceNumber.split('-');
      const seq = Number(parts[parts.length - 1]);
      if (!Number.isNaN(seq)) next = seq + 1;
    }
    return `${prefix}${String(next).padStart(4, '0')}`;
  }

  async findPaginated(options: MaintenanceQueryOptions): Promise<PaginatedResult<MaintenanceDocument>> {
    const page = Math.max(options.page ?? 1, 1);
    const limit = Math.min(Math.max(options.limit ?? 10, 1), 100);
    const skip = (page - 1) * limit;
    const filter = await this.buildFilter(options);
    const sortField = options.sortBy ?? 'createdAt';
    const sortOrder = options.sortOrder === 'asc' ? 1 : -1;

    const [data, total] = await Promise.all([
      this.maintenanceModel
        .find(filter)
        .populate('vehicleId')
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.maintenanceModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(Math.ceil(total / limit), 1),
      },
    };
  }

  private async buildFilter(options: MaintenanceQueryOptions): Promise<FilterQuery<MaintenanceDocument>> {
    const filter: FilterQuery<MaintenanceDocument> = { isDeleted: { $ne: true } };

    if (options.status) filter.status = options.status;
    if (options.priority) filter.priority = options.priority;
    if (options.maintenanceType) filter.maintenanceType = options.maintenanceType;
    if (options.vehicleId) filter.vehicleId = new Types.ObjectId(options.vehicleId);

    if (options.startDateFrom || options.startDateTo) {
      filter.startDate = {};
      if (options.startDateFrom) {
        filter.startDate.$gte = new Date(options.startDateFrom);
      }
      if (options.startDateTo) {
        filter.startDate.$lte = new Date(options.startDateTo);
      }
    }

    if (options.search?.trim()) {
      const term = options.search.trim();
      const vehicleIds = await this.findVehicleIdsMatchingSearch(term);
      filter.$or = [
        { maintenanceNumber: { $regex: term, $options: 'i' } },
        { vendorName: { $regex: term, $options: 'i' } },
        { description: { $regex: term, $options: 'i' } },
        { title: { $regex: term, $options: 'i' } },
        ...(vehicleIds.length ? [{ vehicleId: { $in: vehicleIds } }] : []),
      ];
    }

    return filter;
  }

  private async findVehicleIdsMatchingSearch(term: string): Promise<Types.ObjectId[]> {
    const VehicleModel = this.maintenanceModel.db.model('Vehicle');
    const vehicles = await VehicleModel.find({
      isDeleted: { $ne: true },
      $or: [
        { vehicleId: { $regex: term, $options: 'i' } },
        { vehicleNumber: { $regex: term, $options: 'i' } },
        { model: { $regex: term, $options: 'i' } },
      ],
    })
      .select('_id')
      .lean()
      .exec();
    return vehicles.map((v) => v._id as Types.ObjectId);
  }

  countActive(): Promise<number> {
    return this.maintenanceModel
      .countDocuments({
        isDeleted: { $ne: true },
        status: { $in: MAINTENANCE_ACTIVE_STATUSES },
      })
      .exec();
  }

  countByStatus(status: MaintenanceStatus): Promise<number> {
    return this.maintenanceModel.countDocuments({ isDeleted: { $ne: true }, status }).exec();
  }

  countOverdue(asOf = new Date()): Promise<number> {
    return this.maintenanceModel
      .countDocuments({
        isDeleted: { $ne: true },
        status: { $in: MAINTENANCE_ACTIVE_STATUSES },
        expectedCompletionDate: { $lt: asOf },
      })
      .exec();
  }

  async sumCostInRange(from: Date, to: Date): Promise<number> {
    const result = await this.maintenanceModel
      .aggregate<{ total: number }>([
        {
          $match: {
            isDeleted: { $ne: true },
            status: MaintenanceStatus.COMPLETED,
            completedDate: { $gte: from, $lte: to },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $ifNull: ['$actualCost', '$estimatedCost'] } },
          },
        },
      ])
      .exec();
    return result[0]?.total ?? 0;
  }

  async averageRepairTimeDays(): Promise<number> {
    const result = await this.maintenanceModel
      .aggregate<{ avgDays: number }>([
        {
          $match: {
            isDeleted: { $ne: true },
            status: MaintenanceStatus.COMPLETED,
            completedDate: { $exists: true },
            startDate: { $exists: true },
          },
        },
        {
          $project: {
            days: {
              $divide: [{ $subtract: ['$completedDate', '$startDate'] }, 1000 * 60 * 60 * 24],
            },
          },
        },
        { $group: { _id: null, avgDays: { $avg: '$days' } } },
      ])
      .exec();
    return result[0]?.avgDays ?? 0;
  }

  countAll(): Promise<number> {
    return this.maintenanceModel.countDocuments({ isDeleted: { $ne: true } }).exec();
  }

  addAttachments(
    id: string,
    attachments: MaintenanceAttachmentEmbedded[],
  ): Promise<MaintenanceDocument | null> {
    return this.maintenanceModel
      .findOneAndUpdate(
        { _id: id, isDeleted: { $ne: true } },
        { $push: { attachments: { $each: attachments } } },
        { new: true },
      )
      .populate('vehicleId')
      .exec();
  }
}
