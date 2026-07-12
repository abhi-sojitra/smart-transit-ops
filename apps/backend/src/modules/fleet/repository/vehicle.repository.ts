import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types, UpdateQuery } from 'mongoose';
import { VehicleStatus } from '@transitops/shared-types';
import { BaseRepository } from '../../../repositories/base.repository';
import { Vehicle, VehicleDocument } from '../schema/vehicle.schema';
import {
  COMPLIANCE_EXPIRING_DAYS,
  SERVICE_DUE_SOON_DAYS,
} from '../constants/fleet.constants';
import type {
  VehicleListOptions,
  VehicleListResult,
  VehicleStatisticsResult,
  SoftDeletePayload,
} from '../interfaces/fleet.interfaces';

@Injectable()
export class VehicleRepository extends BaseRepository<VehicleDocument> {
  constructor(
    @InjectModel(Vehicle.name) private readonly vehicleModel: Model<VehicleDocument>,
  ) {
    super();
  }

  create(data: Partial<Vehicle>): Promise<VehicleDocument> {
    return this.vehicleModel.create(data);
  }

  findById(id: string): Promise<VehicleDocument | null> {
    if (!Types.ObjectId.isValid(id)) return Promise.resolve(null);
    return this.vehicleModel.findOne({ _id: id, isDeleted: false }).exec();
  }

  findAll(): Promise<VehicleDocument[]> {
    return this.vehicleModel.find({ isDeleted: false }).sort({ createdAt: -1 }).exec();
  }

  update(id: string, data: Partial<Vehicle>): Promise<VehicleDocument | null> {
    if (!Types.ObjectId.isValid(id)) return Promise.resolve(null);
    return this.vehicleModel
      .findOneAndUpdate({ _id: id, isDeleted: false }, data as UpdateQuery<VehicleDocument>, {
        new: true,
        runValidators: true,
      })
      .exec();
  }

  async delete(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;
    const result = await this.vehicleModel
      .findOneAndUpdate(
        { _id: id, isDeleted: false },
        {
          isDeleted: true,
          deletedAt: new Date(),
          status: VehicleStatus.RETIRED,
        },
        { new: true },
      )
      .exec();
    return Boolean(result);
  }

  softDelete(id: string, payload: SoftDeletePayload): Promise<VehicleDocument | null> {
    if (!Types.ObjectId.isValid(id)) return Promise.resolve(null);
    return this.vehicleModel
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

  findByVehicleId(vehicleId: string, excludeId?: string): Promise<VehicleDocument | null> {
    const filter: FilterQuery<VehicleDocument> = {
      vehicleId: vehicleId.toUpperCase().trim(),
      isDeleted: false,
    };
    if (excludeId && Types.ObjectId.isValid(excludeId)) {
      filter._id = { $ne: excludeId };
    }
    return this.vehicleModel.findOne(filter).exec();
  }

  findByRegistrationNumber(
    registrationNumber: string,
    excludeId?: string,
  ): Promise<VehicleDocument | null> {
    const filter: FilterQuery<VehicleDocument> = {
      registrationNumber: registrationNumber.toUpperCase().trim(),
      isDeleted: false,
    };
    if (excludeId && Types.ObjectId.isValid(excludeId)) {
      filter._id = { $ne: excludeId };
    }
    return this.vehicleModel.findOne(filter).exec();
  }

  findByVin(vin: string, excludeId?: string): Promise<VehicleDocument | null> {
    const filter: FilterQuery<VehicleDocument> = {
      vin: vin.toUpperCase().trim(),
      isDeleted: false,
    };
    if (excludeId && Types.ObjectId.isValid(excludeId)) {
      filter._id = { $ne: excludeId };
    }
    return this.vehicleModel.findOne(filter).exec();
  }

  findAvailable(): Promise<VehicleDocument[]> {
    const today = this.startOfToday();
    return this.vehicleModel
      .find({
        isDeleted: false,
        status: VehicleStatus.AVAILABLE,
        registrationExpiryDate: { $gt: today },
        insuranceExpiryDate: { $gt: today },
        fitnessCertificateExpiryDate: { $gt: today },
      })
      .sort({ vehicleId: 1 })
      .exec();
  }

  async findWithFilters(options: VehicleListOptions): Promise<VehicleListResult<VehicleDocument>> {
    const { page, limit, sortBy, sortOrder, filters } = options;
    const query = this.buildListFilter(filters);
    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [items, total] = await Promise.all([
      this.vehicleModel.find(query).sort(sort).skip(skip).limit(limit).exec(),
      this.vehicleModel.countDocuments(query).exec(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    };
  }

  async getStatistics(): Promise<VehicleStatisticsResult> {
    const today = this.startOfToday();
    const complianceCutoff = new Date(today);
    complianceCutoff.setDate(complianceCutoff.getDate() + COMPLIANCE_EXPIRING_DAYS);
    const serviceCutoff = new Date(today);
    serviceCutoff.setDate(serviceCutoff.getDate() + SERVICE_DUE_SOON_DAYS);

    const [totals] = await this.vehicleModel
      .aggregate<VehicleStatisticsResult>([
        { $match: { isDeleted: false } },
        {
          $group: {
            _id: null,
            totalVehicles: { $sum: 1 },
            available: {
              $sum: { $cond: [{ $eq: ['$status', VehicleStatus.AVAILABLE] }, 1, 0] },
            },
            onTrip: {
              $sum: { $cond: [{ $eq: ['$status', VehicleStatus.ON_TRIP] }, 1, 0] },
            },
            maintenance: {
              $sum: { $cond: [{ $eq: ['$status', VehicleStatus.MAINTENANCE] }, 1, 0] },
            },
            retired: {
              $sum: { $cond: [{ $eq: ['$status', VehicleStatus.RETIRED] }, 1, 0] },
            },
            insuranceExpiring: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $gt: ['$insuranceExpiryDate', today] },
                      { $lte: ['$insuranceExpiryDate', complianceCutoff] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            fitnessExpiring: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $gt: ['$fitnessCertificateExpiryDate', today] },
                      { $lte: ['$fitnessCertificateExpiryDate', complianceCutoff] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            serviceDueSoon: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $ne: ['$nextServiceDueDate', null] },
                      { $gte: ['$nextServiceDueDate', today] },
                      { $lte: ['$nextServiceDueDate', serviceCutoff] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            averageMileage: { $avg: '$mileage' },
          },
        },
        {
          $project: {
            _id: 0,
            totalVehicles: 1,
            available: 1,
            onTrip: 1,
            maintenance: 1,
            retired: 1,
            insuranceExpiring: 1,
            fitnessExpiring: 1,
            serviceDueSoon: 1,
            averageMileage: {
              $round: [{ $ifNull: ['$averageMileage', 0] }, 1],
            },
          },
        },
      ])
      .exec();

    return (
      totals ?? {
        totalVehicles: 0,
        available: 0,
        onTrip: 0,
        maintenance: 0,
        retired: 0,
        insuranceExpiring: 0,
        fitnessExpiring: 0,
        serviceDueSoon: 0,
        averageMileage: 0,
      }
    );
  }

  private buildListFilter(filters: VehicleListOptions['filters']): FilterQuery<VehicleDocument> {
    const query: FilterQuery<VehicleDocument> = { isDeleted: false };

    if (filters.status) query.status = filters.status;
    if (filters.vehicleType) query.vehicleType = filters.vehicleType;
    if (filters.fuelType) query.fuelType = filters.fuelType;
    if (filters.depotCity) query.depotCity = new RegExp(`^${this.escapeRegex(filters.depotCity)}$`, 'i');
    if (filters.depotState) {
      query.depotState = new RegExp(`^${this.escapeRegex(filters.depotState)}$`, 'i');
    }

    if (filters.yearMin !== undefined || filters.yearMax !== undefined) {
      query.year = {};
      if (filters.yearMin !== undefined) query.year.$gte = filters.yearMin;
      if (filters.yearMax !== undefined) query.year.$lte = filters.yearMax;
    }

    if (filters.mileageMin !== undefined || filters.mileageMax !== undefined) {
      query.mileage = {};
      if (filters.mileageMin !== undefined) query.mileage.$gte = filters.mileageMin;
      if (filters.mileageMax !== undefined) query.mileage.$lte = filters.mileageMax;
    }

    if (filters.search?.trim()) {
      const term = this.escapeRegex(filters.search.trim());
      const regex = new RegExp(term, 'i');
      query.$or = [
        { vehicleId: regex },
        { registrationNumber: regex },
        { make: regex },
        { model: regex },
        { vin: regex },
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
