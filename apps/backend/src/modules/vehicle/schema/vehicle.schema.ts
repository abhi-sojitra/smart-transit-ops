import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { VehicleStatus } from '@transitops/shared-types';

export type VehicleDocument = HydratedDocument<Vehicle>;

@Schema({ timestamps: true, collection: 'vehicles' })
export class Vehicle {
  @Prop({ required: true, unique: true, trim: true })
  vehicleId!: string;

  @Prop({ unique: true, sparse: true, trim: true })
  vehicleNumber?: string;

  @Prop({ trim: true })
  registrationNumber?: string;

  @Prop({ trim: true })
  make?: string;

  @Prop({ required: true, trim: true })
  model!: string;

  @Prop()
  year?: number;

  @Prop({ trim: true })
  type?: string;

  @Prop({ type: String, enum: VehicleStatus, default: VehicleStatus.AVAILABLE })
  status!: VehicleStatus;

  @Prop({ required: true, min: 0, default: 0 })
  maxCapacity!: number;

  @Prop()
  lastService?: Date;

  @Prop({ default: 0, min: 0 })
  mileage!: number;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy?: Types.ObjectId;

  @Prop({ default: false })
  isDeleted!: boolean;

  @Prop()
  deletedAt?: Date;
}

export const VehicleSchema = SchemaFactory.createForClass(Vehicle);
VehicleSchema.index({ status: 1, isDeleted: 1 });
