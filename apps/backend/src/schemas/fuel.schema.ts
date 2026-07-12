import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { FuelType } from '@transitops/shared-types';

export type FuelDocument = HydratedDocument<Fuel>;

@Schema({ timestamps: true, collection: 'fuel_logs' })
export class Fuel {
  @Prop({ required: true, trim: true })
  vehicleId!: string;

  @Prop({ trim: true })
  tripId?: string;

  @Prop({ trim: true })
  driverId?: string;

  @Prop({ required: true, trim: true })
  fuelStation!: string;

  @Prop({ type: String, required: true, enum: FuelType })
  fuelType!: FuelType;

  @Prop({ required: true, min: 0.01 })
  quantity!: number;

  @Prop({ required: true, min: 0.01 })
  pricePerLiter!: number;

  @Prop({ required: true, min: 0 })
  totalCost!: number;

  @Prop({ min: 0 })
  odometerReading?: number;

  @Prop({ required: true })
  filledAt!: Date;

  @Prop({ trim: true })
  receiptImage?: string;

  @Prop({ trim: true })
  notes?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  deletedBy?: Types.ObjectId;

  @Prop()
  deletedAt?: Date;

  @Prop({ default: false })
  isDeleted!: boolean;
}

export const FuelSchema = SchemaFactory.createForClass(Fuel);

FuelSchema.index({ vehicleId: 1, filledAt: -1 });
FuelSchema.index({ tripId: 1 });
FuelSchema.index({ driverId: 1 });
FuelSchema.index({ isDeleted: 1, filledAt: -1 });

FuelSchema.pre('save', function (next) {
  if (this.quantity > 0 && this.pricePerLiter > 0) {
    this.totalCost = Math.round(this.quantity * this.pricePerLiter * 100) / 100;
  }
  next();
});
