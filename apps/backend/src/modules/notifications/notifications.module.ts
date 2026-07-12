import { Module } from '@nestjs/common';
import { SettingsModule } from '../settings/settings.module';
import { NotificationsController } from './notifications.controller';

@Module({
  imports: [SettingsModule],
  controllers: [NotificationsController],
})
export class NotificationsModule {}
