import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from './base.repository';
import { Role, RoleDocument } from '../schemas/role.schema';
import { RoleCode } from '@transitops/shared-types';

@Injectable()
export class RoleRepository extends BaseRepository<RoleDocument> {
  constructor(@InjectModel(Role.name) private readonly roleModel: Model<RoleDocument>) {
    super();
  }

  create(data: Partial<Role>): Promise<RoleDocument> {
    return this.roleModel.create(data);
  }

  findById(id: string): Promise<RoleDocument | null> {
    return this.roleModel.findById(id).exec();
  }

  findAll(): Promise<RoleDocument[]> {
    return this.roleModel.find().exec();
  }

  findByCode(code: RoleCode): Promise<RoleDocument | null> {
    return this.roleModel.findOne({ code }).exec();
  }

  update(id: string, data: Partial<Role>): Promise<RoleDocument | null> {
    return this.roleModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.roleModel.findByIdAndDelete(id).exec();
    return Boolean(result);
  }

  upsertByCode(code: RoleCode, data: Partial<Role>): Promise<RoleDocument> {
    return this.roleModel
      .findOneAndUpdate({ code }, { $set: { ...data, code } }, { upsert: true, new: true })
      .exec() as Promise<RoleDocument>;
  }
}
