import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { MaintenanceStatus } from '@transitops/shared-types';

export type MaintenanceDocument = HydratedDocument<Maintenance>;

@Schema({ timestamps: true, collection: 'maintenance_records' })
export class Maintenance {
  @Prop({ required: true, trim: true })
  vehicleId!: string;

  @Prop({ required: true, trim: true })
  serviceType!: string;

  @Prop({ type: String, enum: MaintenanceStatus, default: MaintenanceStatus.COMPLETED })
  status!: MaintenanceStatus;

  @Prop({ required: true })
  date!: Date;

  @Prop({ required: true, min: 0 })
  cost!: number;

  @Prop({ trim: true })
  notes?: string;

  @Prop({ default: false })
  isDeleted!: boolean;
}

export const MaintenanceSchema = SchemaFactory.createForClass(Maintenance);
