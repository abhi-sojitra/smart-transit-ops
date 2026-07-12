import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import {
  UserAccountStatus,
  type AdminStatistics,
  type JwtPayload,
  type UserProfile,
} from '@transitops/shared-types';
import { AppSettingsRepository } from '../../repositories/app-settings.repository';
import { UserRepository } from '../../repositories/user.repository';
import { RoleRepository } from '../../repositories/role.repository';
import { PermissionRepository } from '../../repositories/permission.repository';
import { AuditLogRepository } from '../../repositories/audit-log.repository';
import { mapUser } from '../users/users.mapper';
import type {
  ChangePasswordDto,
  UpdateAppearanceSettingsDto,
  UpdateCompanySettingsDto,
  UpdateNotificationSettingsDto,
  UpdateProfileDto,
  UpdateSecuritySettingsDto,
} from './dto/settings.dto';

function asPlainRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object') return {};
  const withToObject = value as { toObject?: (opts?: object) => Record<string, unknown> };
  if (typeof withToObject.toObject === 'function') {
    return withToObject.toObject({ depopulate: true, flattenMaps: true });
  }
  return { ...(value as Record<string, unknown>) };
}

@Injectable()
export class SettingsService {
  constructor(
    private readonly settings: AppSettingsRepository,
    private readonly users: UserRepository,
    private readonly roles: RoleRepository,
    private readonly permissions: PermissionRepository,
    private readonly audit: AuditLogRepository,
  ) {}

  async getCompanySettings() {
    const doc = await this.settings.getOrCreate();
    return {
      ...asPlainRecord(doc.company),
      updatedAt: (doc as { updatedAt?: Date }).updatedAt?.toISOString(),
    };
  }

  async updateCompanySettings(dto: UpdateCompanySettingsDto, actor?: JwtPayload) {
    const doc = await this.settings.updateCompany(dto as Record<string, unknown>);
    await this.audit.create({
      action: 'SETTINGS_UPDATE',
      module: 'SETTINGS',
      summary: 'Updated company settings',
      actorId: actor?.sub,
      actorEmail: actor?.email,
    });
    return {
      ...asPlainRecord(doc?.company),
      updatedAt: (doc as { updatedAt?: Date } | null)?.updatedAt?.toISOString(),
    };
  }

  async getNotificationSettings() {
    const doc = await this.settings.getOrCreate();
    return {
      ...asPlainRecord(doc.notifications),
      updatedAt: (doc as { updatedAt?: Date }).updatedAt?.toISOString(),
    };
  }

  async updateNotificationSettings(
    dto: UpdateNotificationSettingsDto,
    actor?: JwtPayload,
  ) {
    const doc = await this.settings.updateNotifications(dto as Record<string, unknown>);
    await this.audit.create({
      action: 'SETTINGS_UPDATE',
      module: 'NOTIFICATIONS',
      summary: 'Updated notification settings',
      actorId: actor?.sub,
      actorEmail: actor?.email,
    });
    return {
      ...asPlainRecord(doc?.notifications),
      updatedAt: (doc as { updatedAt?: Date } | null)?.updatedAt?.toISOString(),
    };
  }

  async getSecuritySettings() {
    const doc = await this.settings.getOrCreate();
    const security = asPlainRecord(doc.security);
    return {
      minPasswordLength: Number(security.minPasswordLength ?? 8),
      requireUppercase: Boolean(security.requireUppercase ?? true),
      requireNumber: Boolean(security.requireNumber ?? true),
      requireSpecialCharacter: Boolean(security.requireSpecialCharacter ?? true),
      sessionTimeoutMinutes: Number(security.sessionTimeoutMinutes ?? 60),
      twoFactorReady: Boolean(security.twoFactorReady ?? true),
      maxLoginAttempts: Number(security.maxLoginAttempts ?? 5),
      lockDurationMinutes: Number(security.lockDurationMinutes ?? 30),
      updatedAt: (doc as { updatedAt?: Date }).updatedAt?.toISOString(),
    };
  }

  async updateSecuritySettings(dto: UpdateSecuritySettingsDto, actor?: JwtPayload) {
    await this.settings.updateSecurity(dto as Record<string, unknown>);
    await this.audit.create({
      action: 'SETTINGS_UPDATE',
      module: 'SECURITY',
      summary: 'Updated security settings',
      actorId: actor?.sub,
      actorEmail: actor?.email,
    });
    return this.getSecuritySettings();
  }

  async getAppearanceSettings() {
    const doc = await this.settings.getOrCreate();
    return asPlainRecord(doc.appearance);
  }

  async updateAppearanceSettings(dto: UpdateAppearanceSettingsDto, actor?: JwtPayload) {
    const doc = await this.settings.updateAppearance(dto as Record<string, unknown>);
    await this.audit.create({
      action: 'SETTINGS_UPDATE',
      module: 'SETTINGS',
      summary: 'Updated appearance settings',
      actorId: actor?.sub,
      actorEmail: actor?.email,
    });
    return asPlainRecord(doc?.appearance);
  }

  async getProfile(userId: string): Promise<UserProfile> {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    const mapped = mapUser(user);
    const roles = (user.roles ?? []) as Array<{ permissions?: string[] }>;
    const permissions = Array.from(
      new Set(roles.flatMap((r) => r.permissions ?? [])),
    );
    return { ...mapped, permissions };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto, actor?: JwtPayload) {
    const updated = await this.users.update(userId, dto);
    if (!updated) throw new NotFoundException('User not found');
    await this.audit.create({
      action: 'UPDATE',
      module: 'PROFILE',
      summary: 'Updated profile',
      actorId: actor?.sub ?? userId,
      actorEmail: actor?.email,
    });
    return this.getProfile(userId);
  }

  async changePassword(userId: string, dto: ChangePasswordDto, actor?: JwtPayload) {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    const ok = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Current password is incorrect');

    const security = await this.getSecuritySettings();
    this.assertPasswordPolicy(dto.newPassword, security);

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.users.update(userId, { passwordHash });
    await this.users.clearRefreshToken(userId);
    await this.audit.create({
      action: 'PASSWORD_CHANGE',
      module: 'SECURITY',
      summary: 'Changed password',
      actorId: actor?.sub ?? userId,
      actorEmail: actor?.email,
    });
    return { success: true };
  }

  async getSystemStatistics(): Promise<AdminStatistics> {
    const [statusCounts, usersByRole, roleCount, permissionCount, failedLoginsToday, auditEventsToday, loginActivity, auditByModule] =
      await Promise.all([
        this.users.countByStatus(),
        this.users.countByRole(),
        this.roles.countAll(),
        this.permissions.countAll(),
        this.audit.countToday('LOGIN_FAILED'),
        this.audit.countToday(),
        this.audit.loginActivity(7),
        this.audit.countByModule(30),
      ]);

    const totalUsers = statusCounts.reduce((sum, row) => sum + row.count, 0);
    const activeUsers =
      statusCounts.find((r) => r._id === UserAccountStatus.ACTIVE)?.count ?? 0;
    const inactiveUsers =
      statusCounts.find((r) => r._id === UserAccountStatus.INACTIVE)?.count ?? 0;

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      totalRoles: roleCount,
      totalPermissions: permissionCount,
      failedLoginsToday,
      auditEventsToday,
      usersByRole,
      loginActivity,
      auditByModule,
    };
  }

  private assertPasswordPolicy(
    password: string,
    security: {
      minPasswordLength: number;
      requireUppercase: boolean;
      requireNumber: boolean;
      requireSpecialCharacter: boolean;
    },
  ) {
    if (password.length < security.minPasswordLength) {
      throw new BadRequestException(
        `Password must be at least ${security.minPasswordLength} characters`,
      );
    }
    if (security.requireUppercase && !/[A-Z]/.test(password)) {
      throw new BadRequestException('Password must include an uppercase letter');
    }
    if (security.requireNumber && !/\d/.test(password)) {
      throw new BadRequestException('Password must include a number');
    }
    if (security.requireSpecialCharacter && !/[^\w\s]/.test(password)) {
      throw new BadRequestException('Password must include a special character');
    }
  }
}
