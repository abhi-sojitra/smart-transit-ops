import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppSettings, AppSettingsDocument } from '../schemas/app-settings.schema';

@Injectable()
export class AppSettingsRepository {
  constructor(
    @InjectModel(AppSettings.name)
    private readonly settingsModel: Model<AppSettingsDocument>,
  ) {}

  async getOrCreate(): Promise<AppSettingsDocument> {
    const existing = await this.settingsModel.findOne({ key: 'default' }).exec();
    if (existing) return existing;
    return this.settingsModel.create({ key: 'default' });
  }

  async updateCompany(data: Record<string, unknown>) {
    return this.settingsModel
      .findOneAndUpdate(
        { key: 'default' },
        { $set: Object.fromEntries(Object.entries(data).map(([k, v]) => [`company.${k}`, v])) },
        { new: true, upsert: true },
      )
      .exec();
  }

  async updateNotifications(data: Record<string, unknown>) {
    const set: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (key === 'channels' && value && typeof value === 'object') {
        for (const [ck, cv] of Object.entries(value as Record<string, unknown>)) {
          set[`notifications.channels.${ck}`] = cv;
        }
      } else {
        set[`notifications.${key}`] = value;
      }
    }
    return this.settingsModel
      .findOneAndUpdate({ key: 'default' }, { $set: set }, { new: true, upsert: true })
      .exec();
  }

  async updateSecurity(data: Record<string, unknown>) {
    return this.settingsModel
      .findOneAndUpdate(
        { key: 'default' },
        { $set: Object.fromEntries(Object.entries(data).map(([k, v]) => [`security.${k}`, v])) },
        { new: true, upsert: true },
      )
      .exec();
  }

  async updateAppearance(data: Record<string, unknown>) {
    return this.settingsModel
      .findOneAndUpdate(
        { key: 'default' },
        { $set: Object.fromEntries(Object.entries(data).map(([k, v]) => [`appearance.${k}`, v])) },
        { new: true, upsert: true },
      )
      .exec();
  }
}
