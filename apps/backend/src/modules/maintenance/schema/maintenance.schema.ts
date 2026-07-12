import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { MaintenanceStatus } from '@transitops/shared-types';

export type MaintenanceDocument = HydratedDocument<Maintenance>;

@Schema({ timestamps: true, collection: 'maintenance' })
export class Maintenance {
  @Prop({ type: Types.ObjectId, ref: 'Vehicle', required: true, index: true })
  vehicleId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  serviceType!: string;

  @Prop({ enum: MaintenanceStatus, default: MaintenanceStatus.SCHEDULED })
  status!: MaintenanceStatus;

  @Prop({ required: true })
  date!: Date;

  @Prop({ default: 0, min: 0 })
  cost!: number;

  @Prop()
  notes?: string;

  @Prop({ default: false })
  isDeleted!: boolean;
}

export const MaintenanceSchema = SchemaFactory.createForClass(Maintenance);
MaintenanceSchema.index({ vehicleId: 1, status: 1, isDeleted: 1 });
