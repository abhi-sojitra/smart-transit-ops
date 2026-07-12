import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { DriverStatus, LicenseStatus } from '@transitops/shared-types';

export type DriverDocument = HydratedDocument<Driver>;

@Schema({ timestamps: true, collection: 'drivers' })
export class Driver {
  @Prop({ required: true, trim: true })
  firstName!: string;

  @Prop({ required: true, trim: true })
  lastName!: string;

  @Prop({ required: true, unique: true, trim: true })
  employeeId!: string;

  @Prop({ unique: true, sparse: true, trim: true })
  employeeCode?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId?: Types.ObjectId;

  @Prop({ trim: true })
  licenseType?: string;

  @Prop({ trim: true })
  licenseNumber?: string;

  @Prop()
  licenseExpiry?: Date;

  @Prop({ enum: LicenseStatus, default: LicenseStatus.VALID })
  licenseStatus!: LicenseStatus;

  @Prop()
  lastTrip?: Date;

  @Prop({ default: 100, min: 0, max: 100 })
  safetyScore!: number;

  @Prop({ enum: DriverStatus, default: DriverStatus.AVAILABLE })
  status!: DriverStatus;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;

  @Prop({ default: false })
  isDeleted!: boolean;

  @Prop()
  deletedAt?: Date;
}

export const DriverSchema = SchemaFactory.createForClass(Driver);
DriverSchema.index({ status: 1, isDeleted: 1 });
DriverSchema.virtual('name').get(function (this: DriverDocument) {
  return `${this.firstName} ${this.lastName}`.trim();
});
DriverSchema.set('toJSON', { virtuals: true });
DriverSchema.set('toObject', { virtuals: true });
