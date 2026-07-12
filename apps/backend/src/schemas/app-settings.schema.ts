import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AppSettingsDocument = HydratedDocument<AppSettings>;

@Schema({ _id: false })
export class CompanySettingsEmbedded {
  @Prop({ required: true, default: 'TransitOps Fleet Co.' })
  companyName!: string;

  @Prop()
  logoUrl?: string;

  @Prop()
  email?: string;

  @Prop()
  phone?: string;

  @Prop()
  address?: string;

  @Prop({ default: 'United States' })
  country!: string;

  @Prop({ default: 'USD' })
  currency!: string;

  @Prop({ default: 'America/Chicago' })
  timezone!: string;

  @Prop({ default: 'MM/DD/YYYY' })
  dateFormat!: string;

  @Prop({ default: 'en' })
  language!: string;
}

@Schema({ _id: false })
export class NotificationChannelsEmbedded {
  @Prop({ default: true })
  email!: boolean;

  @Prop({ default: true })
  inApp!: boolean;
}

@Schema({ _id: false })
export class NotificationSettingsEmbedded {
  @Prop({ type: NotificationChannelsEmbedded, default: () => ({}) })
  channels!: NotificationChannelsEmbedded;

  @Prop({ default: true })
  licenseExpiry!: boolean;

  @Prop({ default: true })
  tripCompleted!: boolean;

  @Prop({ default: true })
  maintenanceDue!: boolean;

  @Prop({ default: true })
  fuelReminder!: boolean;

  @Prop({ default: true })
  expenseApproval!: boolean;

  @Prop({ default: true })
  newUser!: boolean;

  @Prop({ default: true })
  roleChanges!: boolean;
}

@Schema({ _id: false })
export class SecuritySettingsEmbedded {
  @Prop({ default: 8, min: 6, max: 128 })
  minPasswordLength!: number;

  @Prop({ default: true })
  requireUppercase!: boolean;

  @Prop({ default: true })
  requireNumber!: boolean;

  @Prop({ default: true })
  requireSpecialCharacter!: boolean;

  @Prop({ default: 60, min: 5 })
  sessionTimeoutMinutes!: number;

  @Prop({ default: true })
  twoFactorReady!: boolean;

  @Prop({ default: 5, min: 1 })
  maxLoginAttempts!: number;

  @Prop({ default: 30, min: 1 })
  lockDurationMinutes!: number;
}

@Schema({ _id: false })
export class AppearanceSettingsEmbedded {
  @Prop({ default: 'dark' })
  theme!: 'light' | 'dark' | 'system';

  @Prop({ default: false })
  sidebarCollapsed!: boolean;

  @Prop({ default: false })
  compactTables!: boolean;
}

@Schema({ timestamps: true, collection: 'app_settings' })
export class AppSettings {
  @Prop({ required: true, unique: true, default: 'default' })
  key!: string;

  @Prop({ type: CompanySettingsEmbedded, default: () => ({}) })
  company!: CompanySettingsEmbedded;

  @Prop({ type: NotificationSettingsEmbedded, default: () => ({}) })
  notifications!: NotificationSettingsEmbedded;

  @Prop({ type: SecuritySettingsEmbedded, default: () => ({}) })
  security!: SecuritySettingsEmbedded;

  @Prop({ type: AppearanceSettingsEmbedded, default: () => ({}) })
  appearance!: AppearanceSettingsEmbedded;
}

export const AppSettingsSchema = SchemaFactory.createForClass(AppSettings);
