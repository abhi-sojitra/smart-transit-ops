import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { CargoType, TripStatus } from '@transitops/shared-types';

export type TripDocument = HydratedDocument<Trip>;

@Schema({ _id: false })
export class TripDocumentMeta {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  url!: string;

  @Prop({ default: () => new Date() })
  uploadedAt?: Date;
}

@Schema({ timestamps: true, collection: 'trips' })
export class Trip {
  @Prop({ required: true, unique: true, trim: true, index: true })
  tripNumber!: string;

  @Prop({ required: true, trim: true })
  source!: string;

  @Prop({ required: true, trim: true })
  destination!: string;

  @Prop({ type: Types.ObjectId, ref: 'Vehicle', required: true, index: true })
  vehicleId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Driver', required: true, index: true })
  driverId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  cargoName!: string;

  @Prop({ required: true, min: 0 })
  cargoWeight!: number;

  @Prop({ enum: CargoType, default: CargoType.GENERAL })
  cargoType!: CargoType;

  @Prop({ required: true, min: 0 })
  plannedDistance!: number;

  @Prop({ min: 0 })
  actualDistance?: number;

  @Prop({ required: true })
  plannedStartDate!: Date;

  @Prop({ required: true })
  plannedEndDate!: Date;

  @Prop()
  actualStartDate?: Date;

  @Prop()
  actualEndDate?: Date;

  @Prop({ min: 0 })
  fuelConsumed?: number;

  @Prop({ required: true, min: 0 })
  estimatedRevenue!: number;

  @Prop({ min: 0 })
  actualRevenue?: number;

  @Prop()
  notes?: string;

  @Prop({ enum: TripStatus, default: TripStatus.DRAFT, index: true })
  status!: TripStatus;

  @Prop({ type: [TripDocumentMeta], default: [] })
  tripDocuments!: TripDocumentMeta[];

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  deletedBy?: Types.ObjectId;

  @Prop({ default: false, index: true })
  isDeleted!: boolean;

  @Prop()
  deletedAt?: Date;
}

export const TripSchema = SchemaFactory.createForClass(Trip);
TripSchema.index({ source: 'text', destination: 'text', tripNumber: 'text', cargoName: 'text' });
TripSchema.index({ status: 1, plannedStartDate: -1 });
TripSchema.index({ vehicleId: 1, status: 1, isDeleted: 1 });
TripSchema.index({ driverId: 1, status: 1, isDeleted: 1 });
