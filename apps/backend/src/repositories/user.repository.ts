import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from './base.repository';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class UserRepository extends BaseRepository<UserDocument> {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {
    super();
  }

  create(data: Partial<User>): Promise<UserDocument> {
    return this.userModel.create(data);
  }

  findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).populate('roles').exec();
  }

  findAll(): Promise<UserDocument[]> {
    return this.userModel.find().populate('roles').exec();
  }

  findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).populate('roles').exec();
  }

  update(id: string, data: Partial<User>): Promise<UserDocument | null> {
    return this.userModel.findByIdAndUpdate(id, { $set: data }, { new: true }).populate('roles').exec();
  }

  async clearRefreshToken(id: string): Promise<boolean> {
    const result = await this.userModel
      .findByIdAndUpdate(id, { $unset: { refreshTokenHash: 1 } }, { new: true })
      .exec();
    return Boolean(result);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.userModel.findByIdAndDelete(id).exec();
    return Boolean(result);
  }
}
