import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { RoleCode } from '@transitops/shared-types';

export type RoleDocument = HydratedDocument<Role>;

@Schema({ timestamps: true, collection: 'roles' })
export class Role {
  @Prop({ type: String, enum: RoleCode, required: true, unique: true })
  code!: RoleCode;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ type: [String], default: [] })
  permissions!: string[];

  @Prop({ default: true })
  isSystem!: boolean;
}

export const RoleSchema = SchemaFactory.createForClass(Role);
