import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseRepository } from './base.repository';
import { User, UserDocument } from '../schemas/user.schema';

export interface UserQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  roleId?: string;
  sortBy?: 'createdAt' | 'email' | 'firstName' | 'lastLoginAt';
  sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class UserRepository extends BaseRepository<UserDocument> {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {
    super();
  }

  private baseFilter() {
    return { isDeleted: { $ne: true } };
  }

  create(data: Partial<User>): Promise<UserDocument> {
    return this.userModel.create(data);
  }

  findById(id: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ _id: id, ...this.baseFilter() })
      .populate('roles')
      .exec();
  }

  findAll(): Promise<UserDocument[]> {
    return this.userModel.find(this.baseFilter()).populate('roles').sort({ createdAt: -1 }).exec();
  }

  findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ email: email.toLowerCase(), ...this.baseFilter() })
      .populate('roles')
      .exec();
  }

  update(id: string, data: Partial<User>): Promise<UserDocument | null> {
    return this.userModel
      .findOneAndUpdate({ _id: id, ...this.baseFilter() }, { $set: data }, { new: true })
      .populate('roles')
      .exec();
  }

  async clearRefreshToken(id: string): Promise<boolean> {
    const result = await this.userModel
      .findByIdAndUpdate(id, { $unset: { refreshTokenHash: 1 } }, { new: true })
      .exec();
    return Boolean(result);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.userModel
      .findOneAndUpdate(
        { _id: id, ...this.baseFilter() },
        { isDeleted: true, deletedAt: new Date(), refreshTokenHash: undefined },
        { new: true },
      )
      .exec();
    return Boolean(result);
  }

  async softDeleteMany(ids: string[]): Promise<number> {
    const result = await this.userModel
      .updateMany(
        { _id: { $in: ids }, ...this.baseFilter() },
        { $set: { isDeleted: true, deletedAt: new Date() }, $unset: { refreshTokenHash: 1 } },
      )
      .exec();
    return result.modifiedCount;
  }

  async updateStatusMany(ids: string[], status: string): Promise<number> {
    const result = await this.userModel
      .updateMany({ _id: { $in: ids }, ...this.baseFilter() }, { $set: { status } })
      .exec();
    return result.modifiedCount;
  }

  findPaginated(options: UserQueryOptions) {
    const page = options.page ?? 1;
    const limit = Math.min(options.limit ?? 20, 100);
    const filter: Record<string, unknown> = { ...this.baseFilter() };

    if (options.status) filter.status = options.status;
    if (options.roleId) filter.roles = new Types.ObjectId(options.roleId);
    if (options.search?.trim()) {
      const q = options.search.trim();
      filter.$or = [
        { email: { $regex: q, $options: 'i' } },
        { firstName: { $regex: q, $options: 'i' } },
        { lastName: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } },
      ];
    }

    const sortField = options.sortBy ?? 'createdAt';
    const sortOrder = options.sortOrder === 'asc' ? 1 : -1;

    return Promise.all([
      this.userModel
        .find(filter)
        .populate('roles')
        .sort({ [sortField]: sortOrder })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments(filter).exec(),
    ]).then(([items, total]) => ({ items, total, page, limit }));
  }

  countByStatus() {
    return this.userModel.aggregate<{ _id: string; count: number }>([
      { $match: this.baseFilter() },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
  }

  countByRole() {
    return this.userModel.aggregate([
      { $match: this.baseFilter() },
      { $unwind: '$roles' },
      {
        $lookup: {
          from: 'roles',
          localField: 'roles',
          foreignField: '_id',
          as: 'role',
        },
      },
      { $unwind: '$role' },
      { $group: { _id: '$role.code', count: { $sum: 1 } } },
      { $project: { _id: 0, role: '$_id', count: 1 } },
      { $sort: { count: -1 } },
    ]);
  }

  countUsersWithRole(roleId: string) {
    return this.userModel.countDocuments({
      ...this.baseFilter(),
      roles: new Types.ObjectId(roleId),
    });
  }

  recordLoginSuccess(id: string) {
    return this.userModel
      .findByIdAndUpdate(
        id,
        { $set: { lastLoginAt: new Date(), failedLoginAttempts: 0 }, $unset: { lockedUntil: 1 } },
        { new: true },
      )
      .exec();
  }
}
