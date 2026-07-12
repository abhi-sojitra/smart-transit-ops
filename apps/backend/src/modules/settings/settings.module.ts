import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppSettings, AppSettingsSchema } from '../../schemas/app-settings.schema';
import { User, UserSchema } from '../../schemas/user.schema';
import { Role, RoleSchema } from '../../schemas/role.schema';
import { Permission, PermissionSchema } from '../../schemas/permission.schema';
import { AuditLog, AuditLogSchema } from '../../schemas/audit-log.schema';
import { AppSettingsRepository } from '../../repositories/app-settings.repository';
import { UserRepository } from '../../repositories/user.repository';
import { RoleRepository } from '../../repositories/role.repository';
import { PermissionRepository } from '../../repositories/permission.repository';
import { AuditLogRepository } from '../../repositories/audit-log.repository';
import {
  ProfileController,
  SecurityController,
  SettingsController,
} from './settings.controller';
import { SettingsService } from './settings.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AppSettings.name, schema: AppSettingsSchema },
      { name: User.name, schema: UserSchema },
      { name: Role.name, schema: RoleSchema },
      { name: Permission.name, schema: PermissionSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),
  ],
  controllers: [SettingsController, ProfileController, SecurityController],
  providers: [
    SettingsService,
    AppSettingsRepository,
    UserRepository,
    RoleRepository,
    PermissionRepository,
    AuditLogRepository,
  ],
  exports: [SettingsService, AppSettingsRepository],
})
export class SettingsModule {}
