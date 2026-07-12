import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PermissionDocument = HydratedDocument<Permission>;

@Schema({ timestamps: true, collection: 'permissions' })
export class Permission {
  @Prop({ required: true, unique: true, trim: true, uppercase: true })
  code!: string;

  @Prop({ required: true, trim: true, index: true })
  module!: string;

  @Prop({ required: true, trim: true })
  action!: string;

  @Prop({ required: true, trim: true })
  description!: string;

  @Prop({ required: true, trim: true, index: true })
  group!: string;
}

export const PermissionSchema = SchemaFactory.createForClass(Permission);
PermissionSchema.index({ module: 1, action: 1 });
