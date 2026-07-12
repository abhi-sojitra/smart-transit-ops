import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseRepository } from './base.repository';
import { Expense, ExpenseDocument } from '../schemas/expense.schema';

export interface ExpenseQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  vehicleId?: string;
  tripId?: string;
  driverId?: string;
  expenseType?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'createdAt' | 'amount' | 'expenseDate';
  sortOrder?: 'asc' | 'desc';
  createdBy?: string;
}

@Injectable()
export class ExpenseRepository extends BaseRepository<ExpenseDocument> {
  constructor(@InjectModel(Expense.name) private readonly expenseModel: Model<ExpenseDocument>) {
    super();
  }

  private baseFilter(createdBy?: string) {
    const filter: Record<string, unknown> = { isDeleted: { $ne: true } };
    if (createdBy) filter.createdBy = createdBy;
    return filter;
  }

  create(data: Partial<Expense>): Promise<ExpenseDocument> {
    return this.expenseModel.create(data);
  }

  findById(id: string): Promise<ExpenseDocument | null> {
    return this.expenseModel.findOne({ _id: id, isDeleted: { $ne: true } }).exec();
  }

  findAll(): Promise<ExpenseDocument[]> {
    return this.expenseModel.find(this.baseFilter()).sort({ expenseDate: -1 }).exec();
  }

  update(id: string, data: Partial<Expense>): Promise<ExpenseDocument | null> {
    return this.expenseModel
      .findOneAndUpdate({ _id: id, isDeleted: { $ne: true } }, data, { new: true })
      .exec();
  }

  async delete(id: string, deletedBy?: Types.ObjectId): Promise<boolean> {
    const result = await this.expenseModel
      .findOneAndUpdate(
        { _id: id, isDeleted: { $ne: true } },
        { isDeleted: true, deletedAt: new Date(), deletedBy },
        { new: true },
      )
      .exec();
    return Boolean(result);
  }

  findPaginated(options: ExpenseQueryOptions) {
    const page = options.page ?? 1;
    const limit = Math.min(options.limit ?? 20, 100);
    const filter = this.buildFilter(options);
    const sortField = options.sortBy ?? 'createdAt';
    const sortOrder = options.sortOrder === 'asc' ? 1 : -1;

    return Promise.all([
      this.expenseModel
        .find(filter)
        .sort({ [sortField]: sortOrder })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.expenseModel.countDocuments(filter).exec(),
    ]).then(([items, total]) => ({ items, total, page, limit }));
  }

  findByTrip(tripId: string) {
    return this.expenseModel
      .find({ tripId: tripId.toUpperCase(), isDeleted: { $ne: true } })
      .sort({ expenseDate: -1 })
      .exec();
  }

  getStatistics(dateFrom?: string, dateTo?: string) {
    const match: Record<string, unknown> = { isDeleted: { $ne: true } };
    if (dateFrom || dateTo) {
      match.expenseDate = {};
      if (dateFrom) (match.expenseDate as Record<string, Date>).$gte = new Date(dateFrom);
      if (dateTo) (match.expenseDate as Record<string, Date>).$lte = new Date(dateTo);
    }

    return Promise.all([
      this.expenseModel.aggregate([
        { $match: match },
        {
          $group: {
            _id: '$status',
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
      ]),
      this.expenseModel.aggregate([
        { $match: match },
        {
          $group: {
            _id: '$expenseType',
            amount: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { amount: -1 } },
      ]),
      this.expenseModel.aggregate([
        { $match: match },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);
  }

  getMonthlyExpenses() {
    return this.expenseModel.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$expenseDate' } },
          amount: { $sum: '$amount' },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { month: '$_id', amount: 1, _id: 0 } },
    ]);
  }

  private buildFilter(options: ExpenseQueryOptions) {
    const filter: Record<string, unknown> = this.baseFilter(options.createdBy);

    if (options.vehicleId) filter.vehicleId = options.vehicleId.toUpperCase();
    if (options.tripId) filter.tripId = options.tripId.toUpperCase();
    if (options.driverId) filter.driverId = options.driverId.toUpperCase();
    if (options.expenseType) filter.expenseType = options.expenseType;
    if (options.status) filter.status = options.status;

    if (options.dateFrom || options.dateTo) {
      filter.expenseDate = {};
      if (options.dateFrom) (filter.expenseDate as Record<string, Date>).$gte = new Date(options.dateFrom);
      if (options.dateTo) (filter.expenseDate as Record<string, Date>).$lte = new Date(options.dateTo);
    }

    if (options.search) {
      const regex = new RegExp(options.search, 'i');
      filter.$or = [
        { title: regex },
        { description: regex },
        { vehicleId: regex },
        { tripId: regex },
        { driverId: regex },
        { expenseType: regex },
      ];
    }

    return filter;
  }
}
