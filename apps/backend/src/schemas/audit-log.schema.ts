import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import type { AuditAction, AuditModule } from '@transitops/shared-types';

export type AuditLogDocument = HydratedDocument<AuditLog>;

@Schema({ timestamps: { createdAt: true, updatedAt: false }, collection: 'audit_logs' })
export class AuditLog {
  @Prop({ required: true, index: true })
  action!: AuditAction;

  @Prop({ required: true, index: true })
  module!: AuditModule;

  @Prop()
  entityType?: string;

  @Prop()
  entityId?: string;

  @Prop({ required: true })
  summary!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  actorId?: Types.ObjectId;

  @Prop()
  actorEmail?: string;

  @Prop()
  actorName?: string;

  @Prop()
  ip?: string;

  @Prop()
  userAgent?: string;

  @Prop()
  browser?: string;

  @Prop()
  device?: string;

  @Prop({ type: Object })
  metadata?: Record<string, unknown>;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ module: 1, action: 1, createdAt: -1 });
