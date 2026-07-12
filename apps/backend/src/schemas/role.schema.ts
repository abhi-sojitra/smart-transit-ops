import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { RoleCode } from '@transitops/shared-types';

export type RoleDocument = HydratedDocument<Role>;

@Schema({ timestamps: true, collection: 'roles' })
export class Role {
  @Prop({ required: true, unique: true, enum: RoleCode })
  code!: RoleCode;

  @Prop({ required: true })
  name!: string;

  @Prop()
  description?: string;

  @Prop({ type: [String], default: [] })
  permissions!: string[];
}

export const RoleSchema = SchemaFactory.createForClass(Role);
