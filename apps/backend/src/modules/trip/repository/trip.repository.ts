import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { TripStatus } from '@transitops/shared-types';
import { Trip, TripDocument } from '../schema/trip.schema';
import { ACTIVE_TRIP_STATUSES, TripSortField } from '../constants/trip.constants';
import { QueryTripDto } from '../dto/trip.dto';

export interface TripListResult {
  data: TripDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class TripRepository {
  constructor(@InjectModel(Trip.name) private readonly model: Model<TripDocument>) {}

  create(data: Partial<Trip>): Promise<TripDocument> {
    return this.model.create(data);
  }

  findById(id: string): Promise<TripDocument | null> {
    return this.model
      .findOne({ _id: id, isDeleted: { $ne: true } })
      .populate('vehicleId')
      .populate('driverId')
      .exec();
  }

  async findMany(query: QueryTripDto, extraFilter: FilterQuery<Trip> = {}): Promise<TripListResult> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const filter = this.buildFilter(query, extraFilter);
    const sortField: TripSortField =
      (query.sortBy as TripSortField) || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;

    const [data, total] = await Promise.all([
      this.model
        .find(filter)
        .populate('vehicleId')
        .populate('driverId')
        .sort({ [sortField]: sortOrder })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.model.countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async hasActiveTripForVehicle(vehicleId: string, excludeTripId?: string): Promise<boolean> {
    const filter: FilterQuery<Trip> = {
      vehicleId: new Types.ObjectId(vehicleId),
      isDeleted: { $ne: true },
      status: { $in: ACTIVE_TRIP_STATUSES },
    };
    if (excludeTripId) {
      filter._id = { $ne: new Types.ObjectId(excludeTripId) };
    }
    const count = await this.model.countDocuments(filter).exec();
    return count > 0;
  }

  async hasActiveTripForDriver(driverId: string, excludeTripId?: string): Promise<boolean> {
    const filter: FilterQuery<Trip> = {
      driverId: new Types.ObjectId(driverId),
      isDeleted: { $ne: true },
      status: { $in: ACTIVE_TRIP_STATUSES },
    };
    if (excludeTripId) {
      filter._id = { $ne: new Types.ObjectId(excludeTripId) };
    }
    const count = await this.model.countDocuments(filter).exec();
    return count > 0;
  }

  update(id: string, data: Partial<Trip>): Promise<TripDocument | null> {
    const $set = Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined),
    );
    return this.model
      .findOneAndUpdate({ _id: id, isDeleted: { $ne: true } }, { $set }, { new: true })
      .populate('vehicleId')
      .populate('driverId')
      .exec();
  }

  softDelete(id: string, deletedBy?: string): Promise<TripDocument | null> {
    return this.model
      .findOneAndUpdate(
        { _id: id, isDeleted: { $ne: true } },
        {
          $set: {
            isDeleted: true,
            deletedAt: new Date(),
            deletedBy: deletedBy ? new Types.ObjectId(deletedBy) : undefined,
          },
        },
        { new: true },
      )
      .exec();
  }

  async nextTripNumber(): Promise<string> {
    const count = await this.model.countDocuments().exec();
    const seq = String(count + 1).padStart(4, '0');
    return `TR-${seq}`;
  }

  async getStatistics(extraFilter: FilterQuery<Trip> = {}) {
    const match: FilterQuery<Trip> = { isDeleted: { $ne: true }, ...extraFilter };
    const [totals] = await this.model
      .aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            totalTrips: { $sum: 1 },
            activeTrips: {
              $sum: {
                $cond: [{ $in: ['$status', [TripStatus.DISPATCHED, TripStatus.IN_PROGRESS]] }, 1, 0],
              },
            },
            pendingTrips: {
              $sum: { $cond: [{ $eq: ['$status', TripStatus.DRAFT] }, 1, 0] },
            },
            completedTrips: {
              $sum: { $cond: [{ $eq: ['$status', TripStatus.COMPLETED] }, 1, 0] },
            },
            cancelledTrips: {
              $sum: { $cond: [{ $eq: ['$status', TripStatus.CANCELLED] }, 1, 0] },
            },
            revenue: {
              $sum: {
                $ifNull: ['$actualRevenue', { $ifNull: ['$estimatedRevenue', 0] }],
              },
            },
            totalPlannedDistance: { $sum: { $ifNull: ['$plannedDistance', 0] } },
            totalActualDistance: { $sum: { $ifNull: ['$actualDistance', 0] } },
            fuelConsumption: { $sum: { $ifNull: ['$fuelConsumed', 0] } },
          },
        },
      ])
      .exec();

    const totalTrips = totals?.totalTrips ?? 0;
    const distanceTravelled = totals?.totalActualDistance ?? 0;
    const averageDistance =
      totalTrips > 0 ? (totals?.totalPlannedDistance ?? 0) / totalTrips : 0;

    return {
      totalTrips,
      activeTrips: totals?.activeTrips ?? 0,
      pendingTrips: totals?.pendingTrips ?? 0,
      completedTrips: totals?.completedTrips ?? 0,
      cancelledTrips: totals?.cancelledTrips ?? 0,
      revenue: totals?.revenue ?? 0,
      averageDistance: Math.round(averageDistance * 100) / 100,
      fuelConsumption: totals?.fuelConsumption ?? 0,
      distanceTravelled,
    };
  }

  private buildFilter(query: QueryTripDto, extraFilter: FilterQuery<Trip>): FilterQuery<Trip> {
    const filter: FilterQuery<Trip> = { isDeleted: { $ne: true }, ...extraFilter };

    if (query.status) filter.status = query.status;
    if (query.driverId) filter.driverId = new Types.ObjectId(query.driverId);
    if (query.vehicleId) filter.vehicleId = new Types.ObjectId(query.vehicleId);

    if (query.startDate || query.endDate) {
      filter.plannedStartDate = {};
      if (query.startDate) {
        (filter.plannedStartDate as Record<string, Date>).$gte = new Date(query.startDate);
      }
      if (query.endDate) {
        (filter.plannedStartDate as Record<string, Date>).$lte = new Date(query.endDate);
      }
    }

    if (query.search?.trim()) {
      const regex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { tripNumber: regex },
        { source: regex },
        { destination: regex },
        { cargoName: regex },
      ];
    }

    return filter;
  }
}
