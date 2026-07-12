import type { RoleCode } from './auth';
import type { UserAccountStatus } from './status';

export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'LOGIN_FAILED'
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'STATUS_CHANGE'
  | 'ROLE_CHANGE'
  | 'PERMISSION_CHANGE'
  | 'PASSWORD_CHANGE'
  | 'SETTINGS_UPDATE';

export type AuditModule =
  | 'AUTH'
  | 'USERS'
  | 'ROLES'
  | 'PERMISSIONS'
  | 'SETTINGS'
  | 'PROFILE'
  | 'SECURITY'
  | 'NOTIFICATIONS'
  | 'SYSTEM';

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  roles: RoleCode[];
  roleIds: string[];
  status: UserAccountStatus;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminRole {
  id: string;
  code: RoleCode;
  name: string;
  description?: string;
  permissions: string[];
  isSystem: boolean;
  userCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PermissionItem {
  id: string;
  code: string;
  module: string;
  action: string;
  description: string;
  group: string;
}

export interface PermissionModuleGroup {
  module: string;
  permissions: PermissionItem[];
}

export interface RolePermissionMatrix {
  roles: Array<{ id: string; code: RoleCode; name: string }>;
  permissions: PermissionItem[];
  matrix: Record<string, string[]>;
}

export interface CompanySettings {
  companyName: string;
  logoUrl?: string;
  email?: string;
  phone?: string;
  address?: string;
  country: string;
  currency: string;
  timezone: string;
  dateFormat: string;
  language: string;
  updatedAt?: string;
}

export interface NotificationChannelSettings {
  email: boolean;
  inApp: boolean;
}

export interface NotificationSettings {
  channels: NotificationChannelSettings;
  licenseExpiry: boolean;
  tripCompleted: boolean;
  maintenanceDue: boolean;
  fuelReminder: boolean;
  expenseApproval: boolean;
  newUser: boolean;
  roleChanges: boolean;
  updatedAt?: string;
}

export interface SecuritySettings {
  minPasswordLength: number;
  requireUppercase: boolean;
  requireNumber: boolean;
  requireSpecialCharacter: boolean;
  sessionTimeoutMinutes: number;
  twoFactorReady: boolean;
  maxLoginAttempts: number;
  lockDurationMinutes: number;
  updatedAt?: string;
}

export interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system';
  sidebarCollapsed: boolean;
  compactTables: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  roles: RoleCode[];
  permissions: string[];
  status: UserAccountStatus;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogItem {
  id: string;
  action: AuditAction;
  module: AuditModule;
  entityType?: string;
  entityId?: string;
  summary: string;
  actorId?: string;
  actorEmail?: string;
  actorName?: string;
  ip?: string;
  userAgent?: string;
  browser?: string;
  device?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface AdminStatistics {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  totalRoles: number;
  totalPermissions: number;
  failedLoginsToday: number;
  auditEventsToday: number;
  usersByRole: Array<{ role: string; count: number }>;
  loginActivity: Array<{ label: string; value: number }>;
  auditByModule: Array<{ label: string; value: number }>;
}

export interface BulkStatusUpdatePayload {
  ids: string[];
  status: UserAccountStatus;
}

export interface BulkDeletePayload {
  ids: string[];
}
