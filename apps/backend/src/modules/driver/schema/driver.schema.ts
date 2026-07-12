import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { DriverStatus, LicenseCategory, BloodGroup } from '@transitops/shared-types';
import { DRIVER_COLLECTION } from '../constants/driver.constants';

export type DriverDocument = HydratedDocument<Driver>;

@Schema({ _id: false })
export class DriverDocumentFile {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, trim: true })
  url!: string;

  @Prop({ trim: true })
  type?: string;

  @Prop({ type: Date })
  uploadedAt?: Date;
}

export const DriverDocumentFileSchema = SchemaFactory.createForClass(DriverDocumentFile);

@Schema({ timestamps: true, collection: DRIVER_COLLECTION })
export class Driver {
  @Prop({ required: true, unique: true, trim: true, uppercase: true })
  employeeCode!: string;

  @Prop({ required: true, trim: true })
  firstName!: string;

  @Prop({ required: true, trim: true })
  lastName!: string;

  @Prop({ required: true, trim: true, index: true })
  fullName!: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ required: true, unique: true, trim: true })
  phone!: string;

  @Prop({ trim: true })
  alternatePhone?: string;

  @Prop({ type: Date })
  dateOfBirth?: Date;

  @Prop({ type: Date, required: true })
  joiningDate!: Date;

  @Prop({ required: true, unique: true, trim: true, uppercase: true })
  licenseNumber!: string;

  @Prop({ required: true, enum: Object.values(LicenseCategory), type: String })
  licenseCategory!: LicenseCategory;

  @Prop({ type: Date })
  licenseIssueDate?: Date;

  @Prop({ type: Date, required: true, index: true })
  licenseExpiryDate!: Date;

  @Prop({ type: Number, required: true, min: 0, default: 0 })
  experienceYears!: number;

  @Prop({ trim: true })
  address?: string;

  @Prop({ trim: true, index: true })
  city?: string;

  @Prop({ trim: true, index: true })
  state?: string;

  @Prop({ trim: true, default: 'India' })
  country?: string;

  @Prop({ trim: true })
  postalCode?: string;

  @Prop({ trim: true })
  emergencyName?: string;

  @Prop({ trim: true })
  emergencyPhone?: string;

  @Prop({ enum: Object.values(BloodGroup), type: String, default: BloodGroup.UNKNOWN })
  bloodGroup?: BloodGroup;

  @Prop({ trim: true })
  photo?: string;

  @Prop({ type: [DriverDocumentFileSchema], default: [] })
  documents!: DriverDocumentFile[];

  @Prop({
    required: true,
    enum: Object.values(DriverStatus),
    type: String,
    default: DriverStatus.AVAILABLE,
    index: true,
  })
  status!: DriverStatus;

  @Prop({ type: Number, required: true, min: 0, max: 100, default: 100 })
  safetyScore!: number;

  @Prop({ trim: true })
  remarks?: string;

  @Prop({ type: Boolean, default: false, index: true })
  isDeleted!: boolean;

  @Prop({ trim: true })
  createdBy?: string;

  @Prop({ trim: true })
  updatedBy?: string;

  @Prop({ trim: true })
  deletedBy?: string;

  @Prop({ type: Date })
  deletedAt?: Date;

  createdAt!: Date;
  updatedAt!: Date;
}

export const DriverSchema = SchemaFactory.createForClass(Driver);

DriverSchema.index({ isDeleted: 1, status: 1 });
DriverSchema.index({ isDeleted: 1, fullName: 1 });
DriverSchema.index({ isDeleted: 1, licenseExpiryDate: 1 });
DriverSchema.index(
  {
    fullName: 'text',
    email: 'text',
    employeeCode: 'text',
    licenseNumber: 'text',
    phone: 'text',
  },
  { name: 'driver_search_text' },
);

DriverSchema.pre('validate', function (next) {
  if (this.firstName && this.lastName) {
    this.fullName = `${this.firstName.trim()} ${this.lastName.trim()}`.trim();
  }
  next();
});
