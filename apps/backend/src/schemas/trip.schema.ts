import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { TripStatus } from '@transitops/shared-types';

export type TripDocument = HydratedDocument<Trip>;

@Schema({ timestamps: true, collection: 'trips' })
export class Trip {
  @Prop({ required: true, unique: true, trim: true, uppercase: true })
  tripId!: string;

  @Prop({ required: true, trim: true })
  origin!: string;

  @Prop({ required: true, trim: true })
  destination!: string;

  @Prop({ trim: true })
  vehicleId?: string;

  @Prop({ trim: true })
  driverId?: string;

  @Prop({ type: String, enum: TripStatus, default: TripStatus.DRAFT })
  status!: TripStatus;
}

export const TripSchema = SchemaFactory.createForClass(Trip);
