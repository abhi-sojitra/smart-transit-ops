import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { VehicleStatus, VehicleType, FuelType } from '@transitops/shared-types';
import { VEHICLE_COLLECTION } from '../constants/fleet.constants';

export type VehicleDocument = HydratedDocument<Vehicle>;

@Schema({ _id: false })
export class VehicleDocumentFile {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, trim: true })
  url!: string;

  @Prop({ trim: true })
  type?: string;

  @Prop({ type: Date })
  uploadedAt?: Date;
}

export const VehicleDocumentFileSchema = SchemaFactory.createForClass(VehicleDocumentFile);

@Schema({ timestamps: true, collection: VEHICLE_COLLECTION })
export class Vehicle {
  @Prop({ required: true, unique: true, trim: true, uppercase: true })
  vehicleId!: string;

  @Prop({ required: true, unique: true, trim: true, uppercase: true })
  registrationNumber!: string;

  @Prop({ unique: true, sparse: true, trim: true, uppercase: true })
  vin?: string;

  @Prop({ required: true, trim: true })
  make!: string;

  @Prop({ required: true, trim: true, index: true })
  model!: string;

  @Prop({ type: Number, min: 1980, max: 2100 })
  year?: number;

  @Prop({ required: true, enum: Object.values(VehicleType), type: String, index: true })
  vehicleType!: VehicleType;

  @Prop({ required: true, enum: Object.values(FuelType), type: String })
  fuelType!: FuelType;

  @Prop({ trim: true })
  color?: string;

  @Prop({ type: Number, min: 1 })
  seatingCapacity?: number;

  @Prop({ type: Number, required: true, min: 0, default: 0 })
  mileage!: number;

  @Prop({ type: Date })
  purchaseDate?: Date;

  @Prop({ type: Date, required: true, index: true })
  registrationExpiryDate!: Date;

  @Prop({ type: Date, required: true, index: true })
  insuranceExpiryDate!: Date;

  @Prop({ type: Date, required: true, index: true })
  fitnessCertificateExpiryDate!: Date;

  @Prop({ type: Date })
  lastServiceDate?: Date;

  @Prop({ type: Date, index: true })
  nextServiceDueDate?: Date;

  @Prop({ trim: true, index: true })
  depotCity?: string;

  @Prop({ trim: true, index: true })
  depotState?: string;

  @Prop({ trim: true, default: 'India' })
  country?: string;

  @Prop({ trim: true })
  photo?: string;

  @Prop({ type: [VehicleDocumentFileSchema], default: [] })
  documents!: VehicleDocumentFile[];

  @Prop({
    required: true,
    enum: Object.values(VehicleStatus),
    type: String,
    default: VehicleStatus.AVAILABLE,
    index: true,
  })
  status!: VehicleStatus;

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

export const VehicleSchema = SchemaFactory.createForClass(Vehicle);

VehicleSchema.index({ isDeleted: 1, status: 1 });
VehicleSchema.index({ isDeleted: 1, make: 1, model: 1 });
VehicleSchema.index({ isDeleted: 1, nextServiceDueDate: 1 });
VehicleSchema.index(
  {
    vehicleId: 'text',
    registrationNumber: 'text',
    make: 'text',
    model: 'text',
    vin: 'text',
  },
  { name: 'vehicle_search_text' },
);
