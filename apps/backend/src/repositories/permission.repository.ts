import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Permission, PermissionDocument } from '../schemas/permission.schema';

@Injectable()
export class PermissionRepository {
  constructor(
    @InjectModel(Permission.name) private readonly permissionModel: Model<PermissionDocument>,
  ) {}

  create(data: Partial<Permission>): Promise<PermissionDocument> {
    return this.permissionModel.create(data);
  }

  upsertByCode(code: string, data: Partial<Permission>) {
    return this.permissionModel
      .findOneAndUpdate({ code }, { $set: { ...data, code } }, { upsert: true, new: true })
      .exec();
  }

  findAll() {
    return this.permissionModel.find().sort({ module: 1, action: 1 }).exec();
  }

  search(search?: string, module?: string) {
    const filter: Record<string, unknown> = {};
    if (module) filter.module = module;
    if (search?.trim()) {
      const q = search.trim();
      filter.$or = [
        { code: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { action: { $regex: q, $options: 'i' } },
        { module: { $regex: q, $options: 'i' } },
      ];
    }
    return this.permissionModel.find(filter).sort({ module: 1, action: 1 }).exec();
  }

  countAll() {
    return this.permissionModel.countDocuments().exec();
  }

  insertMany(docs: Partial<Permission>[]) {
    return this.permissionModel.insertMany(docs, { ordered: false });
  }
}
