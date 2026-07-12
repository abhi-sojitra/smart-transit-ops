import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseRepository } from './base.repository';
import { Fuel, FuelDocument } from '../schemas/fuel.schema';

export interface FuelQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  vehicleId?: string;
  tripId?: string;
  driverId?: string;
  fuelType?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'createdAt' | 'totalCost' | 'quantity' | 'filledAt';
  sortOrder?: 'asc' | 'desc';
  createdBy?: string;
}

@Injectable()
export class FuelRepository extends BaseRepository<FuelDocument> {
  constructor(@InjectModel(Fuel.name) private readonly fuelModel: Model<FuelDocument>) {
    super();
  }

  private baseFilter(createdBy?: string) {
    const filter: Record<string, unknown> = { isDeleted: { $ne: true } };
    if (createdBy) filter.createdBy = createdBy;
    return filter;
  }

  create(data: Partial<Fuel>): Promise<FuelDocument> {
    return this.fuelModel.create(data);
  }

  findById(id: string): Promise<FuelDocument | null> {
    return this.fuelModel.findOne({ _id: id, isDeleted: { $ne: true } }).exec();
  }

  findAll(): Promise<FuelDocument[]> {
    return this.fuelModel.find(this.baseFilter()).sort({ filledAt: -1 }).exec();
  }

  update(id: string, data: Partial<Fuel>): Promise<FuelDocument | null> {
    return this.fuelModel.findOneAndUpdate({ _id: id, isDeleted: { $ne: true } }, data, { new: true }).exec();
  }

  async delete(id: string, deletedBy?: Types.ObjectId): Promise<boolean> {
    const result = await this.fuelModel
      .findOneAndUpdate(
        { _id: id, isDeleted: { $ne: true } },
        { isDeleted: true, deletedAt: new Date(), deletedBy },
        { new: true },
      )
      .exec();
    return Boolean(result);
  }

  findPaginated(options: FuelQueryOptions) {
    const page = options.page ?? 1;
    const limit = Math.min(options.limit ?? 20, 100);
    const filter = this.buildFilter(options);
    const sortField = options.sortBy ?? 'createdAt';
    const sortOrder = options.sortOrder === 'asc' ? 1 : -1;

    return Promise.all([
      this.fuelModel
        .find(filter)
        .sort({ [sortField]: sortOrder })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.fuelModel.countDocuments(filter).exec(),
    ]).then(([items, total]) => ({ items, total, page, limit }));
  }

  findByVehicle(vehicleId: string) {
    return this.fuelModel
      .find({ vehicleId: vehicleId.toUpperCase(), isDeleted: { $ne: true } })
      .sort({ filledAt: -1 })
      .exec();
  }

  findByTrip(tripId: string) {
    return this.fuelModel
      .find({ tripId: tripId.toUpperCase(), isDeleted: { $ne: true } })
      .sort({ filledAt: -1 })
      .exec();
  }

  getStatistics(dateFrom?: string, dateTo?: string) {
    const match: Record<string, unknown> = { isDeleted: { $ne: true } };
    if (dateFrom || dateTo) {
      match.filledAt = {};
      if (dateFrom) (match.filledAt as Record<string, Date>).$gte = new Date(dateFrom);
      if (dateTo) (match.filledAt as Record<string, Date>).$lte = new Date(dateTo);
    }

    return this.fuelModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalFuelCost: { $sum: '$totalCost' },
          totalFuelQuantity: { $sum: '$quantity' },
          avgPrice: { $avg: '$pricePerLiter' },
          count: { $sum: 1 },
          totalOdometer: { $sum: { $ifNull: ['$odometerReading', 0] } },
        },
      },
    ]);
  }

  getMonthlyFuelCost() {
    return this.fuelModel.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$filledAt' } },
          cost: { $sum: '$totalCost' },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { month: '$_id', cost: 1, _id: 0 } },
    ]);
  }

  getConsumptionTrend(days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    return this.fuelModel.aggregate([
      { $match: { isDeleted: { $ne: true }, filledAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$filledAt' } },
          quantity: { $sum: '$quantity' },
          cost: { $sum: '$totalCost' },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { date: '$_id', quantity: 1, cost: 1, _id: 0 } },
    ]);
  }

  getVehicleCostComparison() {
    return this.fuelModel.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      {
        $group: {
          _id: '$vehicleId',
          fuelCost: { $sum: '$totalCost' },
          quantity: { $sum: '$quantity' },
        },
      },
      { $sort: { fuelCost: -1 } },
      { $project: { vehicleId: '$_id', fuelCost: 1, quantity: 1, _id: 0 } },
    ]);
  }

  private buildFilter(options: FuelQueryOptions) {
    const filter: Record<string, unknown> = this.baseFilter(options.createdBy);

    if (options.vehicleId) filter.vehicleId = options.vehicleId.toUpperCase();
    if (options.tripId) filter.tripId = options.tripId.toUpperCase();
    if (options.driverId) filter.driverId = options.driverId.toUpperCase();
    if (options.fuelType) filter.fuelType = options.fuelType;

    if (options.dateFrom || options.dateTo) {
      filter.filledAt = {};
      if (options.dateFrom) (filter.filledAt as Record<string, Date>).$gte = new Date(options.dateFrom);
      if (options.dateTo) (filter.filledAt as Record<string, Date>).$lte = new Date(options.dateTo);
    }

    if (options.search) {
      const regex = new RegExp(options.search, 'i');
      filter.$or = [
        { fuelStation: regex },
        { vehicleId: regex },
        { tripId: regex },
        { driverId: regex },
        { notes: regex },
      ];
    }

    return filter;
  }
}
