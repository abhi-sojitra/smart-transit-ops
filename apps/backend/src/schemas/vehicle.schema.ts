import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { VehicleStatus } from '@transitops/shared-types';

export type VehicleDocument = HydratedDocument<Vehicle>;

@Schema({ timestamps: true, collection: 'vehicles' })
export class Vehicle {
  @Prop({ required: true, unique: true, trim: true, uppercase: true })
  vehicleId!: string;

  @Prop({ required: true, trim: true })
  model!: string;

  @Prop()
  year?: number;

  @Prop({ trim: true })
  type?: string;

  @Prop({ type: String, enum: VehicleStatus, default: VehicleStatus.AVAILABLE })
  status!: VehicleStatus;

  @Prop()
  lastService?: Date;

  @Prop({ required: true, min: 0, default: 0 })
  mileage!: number;
}

export const VehicleSchema = SchemaFactory.createForClass(Vehicle);
