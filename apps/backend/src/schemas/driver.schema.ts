import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { DriverStatus, LicenseStatus } from '@transitops/shared-types';

export type DriverDocument = HydratedDocument<Driver>;

@Schema({ timestamps: true, collection: 'drivers' })
export class Driver {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, unique: true, trim: true, uppercase: true })
  employeeId!: string;

  @Prop({ trim: true })
  licenseType?: string;

  @Prop({ type: String, enum: LicenseStatus, default: LicenseStatus.VALID })
  licenseStatus!: LicenseStatus;

  @Prop({ min: 0, max: 100, default: 100 })
  safetyScore!: number;

  @Prop({ type: String, enum: DriverStatus, default: DriverStatus.AVAILABLE })
  status!: DriverStatus;
}

export const DriverSchema = SchemaFactory.createForClass(Driver);
