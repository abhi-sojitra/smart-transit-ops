import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import type { AuditAction, AuditModule } from '@transitops/shared-types';
import { AuditLog, AuditLogDocument } from '../schemas/audit-log.schema';

export interface AuditQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  module?: string;
  action?: string;
  actorId?: string;
  dateFrom?: string;
  dateTo?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateAuditInput {
  action: AuditAction;
  module: AuditModule;
  summary: string;
  entityType?: string;
  entityId?: string;
  actorId?: string;
  actorEmail?: string;
  actorName?: string;
  ip?: string;
  userAgent?: string;
  browser?: string;
  device?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditLogRepository {
  constructor(
    @InjectModel(AuditLog.name) private readonly auditModel: Model<AuditLogDocument>,
  ) {}

  create(data: CreateAuditInput): Promise<AuditLogDocument> {
    return this.auditModel.create({
      ...data,
      actorId: data.actorId ? new Types.ObjectId(data.actorId) : undefined,
    });
  }

  findPaginated(options: AuditQueryOptions) {
    const page = options.page ?? 1;
    const limit = Math.min(options.limit ?? 20, 100);
    const filter: Record<string, unknown> = {};

    if (options.module) filter.module = options.module;
    if (options.action) filter.action = options.action;
    if (options.actorId) filter.actorId = new Types.ObjectId(options.actorId);
    if (options.dateFrom || options.dateTo) {
      const range: Record<string, Date> = {};
      if (options.dateFrom) range.$gte = new Date(options.dateFrom);
      if (options.dateTo) range.$lte = new Date(options.dateTo);
      filter.createdAt = range;
    }
    if (options.search?.trim()) {
      const q = options.search.trim();
      filter.$or = [
        { summary: { $regex: q, $options: 'i' } },
        { actorEmail: { $regex: q, $options: 'i' } },
        { actorName: { $regex: q, $options: 'i' } },
        { entityId: { $regex: q, $options: 'i' } },
      ];
    }

    const sortOrder = options.sortOrder === 'asc' ? 1 : -1;

    return Promise.all([
      this.auditModel
        .find(filter)
        .sort({ createdAt: sortOrder })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.auditModel.countDocuments(filter).exec(),
    ]).then(([items, total]) => ({ items, total, page, limit }));
  }

  countToday(action?: AuditAction) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const filter: Record<string, unknown> = { createdAt: { $gte: start } };
    if (action) filter.action = action;
    return this.auditModel.countDocuments(filter).exec();
  }

  loginActivity(days = 7) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (days - 1));

    return this.auditModel.aggregate([
      {
        $match: {
          action: { $in: ['LOGIN', 'LOGIN_FAILED'] },
          createdAt: { $gte: start },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          value: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, label: '$_id', value: 1 } },
    ]);
  }

  countByModule(days = 30) {
    const start = new Date();
    start.setDate(start.getDate() - days);
    return this.auditModel.aggregate([
      { $match: { createdAt: { $gte: start } } },
      { $group: { _id: '$module', value: { $sum: 1 } } },
      { $project: { _id: 0, label: '$_id', value: 1 } },
      { $sort: { value: -1 } },
    ]);
  }

  insertMany(docs: CreateAuditInput[]) {
    return this.auditModel.insertMany(
      docs.map((d) => ({
        ...d,
        actorId: d.actorId ? new Types.ObjectId(d.actorId) : undefined,
      })),
      { ordered: false },
    );
  }
}
