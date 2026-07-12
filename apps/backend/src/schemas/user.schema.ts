import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { UserAccountStatus } from '@transitops/shared-types';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ required: true })
  passwordHash!: string;

  @Prop({ required: true, trim: true })
  firstName!: string;

  @Prop({ required: true, trim: true })
  lastName!: string;

  @Prop({ trim: true })
  phone?: string;

  @Prop({ trim: true })
  avatarUrl?: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Role' }], default: [] })
  roles!: Types.ObjectId[];

  @Prop({ type: String, enum: UserAccountStatus, default: UserAccountStatus.ACTIVE, index: true })
  status!: UserAccountStatus;

  @Prop()
  lastLoginAt?: Date;

  @Prop()
  failedLoginAttempts?: number;

  @Prop()
  lockedUntil?: Date;

  @Prop()
  refreshTokenHash?: string;

  @Prop({ default: false, index: true })
  isDeleted!: boolean;

  @Prop()
  deletedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ email: 1, isDeleted: 1 });
UserSchema.index({ status: 1, isDeleted: 1 });
