import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import type { BiExportFormat, BiReportType, BiScheduleFrequency } from '@transitops/shared-types';

export type ReportScheduleDocument = HydratedDocument<ReportSchedule>;

@Schema({ timestamps: true, collection: 'report_schedules' })
export class ReportSchedule {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, type: String })
  type!: BiReportType;

  @Prop({ required: true, type: String })
  frequency!: BiScheduleFrequency;

  @Prop({ required: true, type: String })
  format!: BiExportFormat;

  @Prop({ type: Object, default: {} })
  filters?: Record<string, unknown>;

  @Prop({ trim: true })
  email?: string;

  @Prop({ required: true })
  nextRunAt!: Date;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop()
  createdBy?: string;
}

export const ReportScheduleSchema = SchemaFactory.createForClass(ReportSchedule);
