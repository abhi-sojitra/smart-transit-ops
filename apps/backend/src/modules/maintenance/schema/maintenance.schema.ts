import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {
  MaintenancePriority,
  MaintenanceStatus,
  MaintenanceType,
} from '@transitops/shared-types';

export type MaintenanceDocument = HydratedDocument<Maintenance>;

@Schema({ _id: false })
export class MaintenanceAttachmentEmbedded {
  @Prop({ required: true })
  filename!: string;

  @Prop({ required: true })
  originalName!: string;

  @Prop({ required: true })
  mimeType!: string;

  @Prop({ required: true })
  size!: number;

  @Prop({ required: true })
  url!: string;

  @Prop({ default: () => new Date() })
  uploadedAt!: Date;
}

@Schema({ timestamps: true, collection: 'maintenance' })
export class Maintenance {
  @Prop({ type: Types.ObjectId, ref: 'Vehicle', required: true, index: true })
  vehicleId!: Types.ObjectId;

  @Prop({ required: true, unique: true, trim: true, uppercase: true })
  maintenanceNumber!: string;

  @Prop({ type: String, enum: MaintenanceType, required: true })
  maintenanceType!: MaintenanceType;

  @Prop({ required: true, trim: true, maxlength: 100 })
  title!: string;

  @Prop({ trim: true, maxlength: 500 })
  description?: string;

  @Prop({ type: String, enum: MaintenancePriority, default: MaintenancePriority.MEDIUM })
  priority!: MaintenancePriority;

  @Prop({ type: String, enum: MaintenanceStatus, default: MaintenanceStatus.SCHEDULED, index: true })
  status!: MaintenanceStatus;

  @Prop({ required: true })
  startDate!: Date;

  @Prop({ required: true })
  expectedCompletionDate!: Date;

  @Prop()
  completedDate?: Date;

  @Prop({ required: true, min: 0.01 })
  estimatedCost!: number;

  @Prop({ min: 0 })
  actualCost?: number;

  @Prop({ trim: true })
  vendorName?: string;

  @Prop({ trim: true })
  vendorPhone?: string;

  @Prop({ trim: true })
  serviceCenter?: string;

  @Prop({ min: 0 })
  odometerReading?: number;

  @Prop()
  nextServiceDue?: Date;

  @Prop({ type: [MaintenanceAttachmentEmbedded], default: [] })
  attachments!: MaintenanceAttachmentEmbedded[];

  @Prop({ trim: true, maxlength: 500 })
  notes?: string;

  @Prop()
  createdBy?: string;

  @Prop()
  updatedBy?: string;

  @Prop()
  deletedBy?: string;

  @Prop({ default: false, index: true })
  isDeleted!: boolean;

  @Prop()
  deletedAt?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export const MaintenanceSchema = SchemaFactory.createForClass(Maintenance);

MaintenanceSchema.index({ vehicleId: 1, status: 1, isDeleted: 1 });
MaintenanceSchema.index({ status: 1, isDeleted: 1 });
MaintenanceSchema.index({ priority: 1 });
MaintenanceSchema.index({ maintenanceType: 1 });
MaintenanceSchema.index({ startDate: 1 });
MaintenanceSchema.index({ expectedCompletionDate: 1 });
MaintenanceSchema.index({
  maintenanceNumber: 'text',
  vendorName: 'text',
  description: 'text',
  title: 'text',
});
