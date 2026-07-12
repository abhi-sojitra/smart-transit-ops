import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ExpenseStatus, ExpenseType } from '@transitops/shared-types';

export type ExpenseDocument = HydratedDocument<Expense>;

@Schema({ timestamps: true, collection: 'expenses' })
export class Expense {
  @Prop({ required: true, trim: true })
  vehicleId!: string;

  @Prop({ trim: true })
  tripId?: string;

  @Prop({ trim: true })
  driverId?: string;

  @Prop({ type: String, required: true, enum: ExpenseType })
  expenseType!: ExpenseType;

  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ required: true, min: 0.01 })
  amount!: number;

  @Prop({ required: true })
  expenseDate!: Date;

  @Prop({ trim: true })
  receiptImage?: string;

  @Prop({ trim: true })
  approvedBy?: string;

  @Prop({ type: String, enum: ExpenseStatus, default: ExpenseStatus.PENDING })
  status!: ExpenseStatus;

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

export const ExpenseSchema = SchemaFactory.createForClass(Expense);

ExpenseSchema.index({ vehicleId: 1, expenseDate: -1 });
ExpenseSchema.index({ tripId: 1 });
ExpenseSchema.index({ driverId: 1 });
ExpenseSchema.index({ status: 1 });
ExpenseSchema.index({ isDeleted: 1, expenseDate: -1 });
