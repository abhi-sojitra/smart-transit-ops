import type {
  AdminRole,
  AdminStatistics,
  AdminUser,
  ApiResponse,
  AppearanceSettings,
  AuditLogItem,
  CompanySettings,
  NotificationSettings,
  PaginationMeta,
  PermissionItem,
  PermissionModuleGroup,
  RoleCode,
  RolePermissionMatrix,
  SecuritySettings,
  UserAccountStatus,
  UserProfile,
} from '@transitops/shared-types';
import { apiClient } from './api';

function unwrap<T>(response: { data: ApiResponse<T> }): T {
  return response.data.data;
}

function normalizeAdminUser(raw: unknown): AdminUser {
  const user = raw as AdminUser & {
    _id?: { toString(): string } | string;
    roles?: unknown[];
  };
  const id =
    user.id ||
    (typeof user._id === 'string' ? user._id : user._id?.toString()) ||
    '';
  const roles = (user.roles ?? [])
    .map((role) => {
      if (typeof role === 'string') return role as RoleCode;
      if (role && typeof role === 'object' && 'code' in role) {
        return (role as { code: RoleCode }).code;
      }
      return null;
    })
    .filter(Boolean) as RoleCode[];

  return {
    ...user,
    id,
    roles,
    roleIds: user.roleIds ?? [],
  };
}

export interface UserListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: UserAccountStatus;
  roleId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AuditListParams {
  page?: number;
  limit?: number;
  search?: string;
  module?: string;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const adminService = {
  // Users
  listUsers: async (params?: UserListParams) => {
    const res = await apiClient.get<ApiResponse<AdminUser[]> & { meta?: PaginationMeta }>(
      '/users',
      { params },
    );
    const payload = res.data;
    const raw = payload?.data;
    // Support both mapped AdminUser[] and accidental nested/raw shapes
    const items = Array.isArray(raw)
      ? raw.map(normalizeAdminUser)
      : Array.isArray((raw as { items?: unknown })?.items)
        ? ((raw as { items: unknown[] }).items as AdminUser[]).map(normalizeAdminUser)
        : [];
    const meta = (payload.meta ??
      (raw as { meta?: PaginationMeta })?.meta ?? {
        page: 1,
        limit: 20,
        total: items.length,
        totalPages: 1,
      }) as PaginationMeta;
    return { items, meta };
  },
  getUser: async (id: string) => unwrap(await apiClient.get<ApiResponse<AdminUser>>(`/users/${id}`)),
  createUser: async (payload: Record<string, unknown>) =>
    unwrap(await apiClient.post<ApiResponse<AdminUser>>('/users', payload)),
  updateUser: async (id: string, payload: Record<string, unknown>) =>
    unwrap(await apiClient.patch<ApiResponse<AdminUser>>(`/users/${id}`, payload)),
  deleteUser: async (id: string) =>
    unwrap(await apiClient.delete<ApiResponse<{ success: boolean }>>(`/users/${id}`)),
  bulkStatus: async (ids: string[], status: UserAccountStatus) =>
    unwrap(
      await apiClient.post<ApiResponse<{ updated: number }>>('/users/bulk/status', {
        ids,
        status,
      }),
    ),
  bulkDelete: async (ids: string[]) =>
    unwrap(
      await apiClient.post<ApiResponse<{ deleted: number }>>('/users/bulk/delete', { ids }),
    ),

  // Roles
  listRoles: async (search?: string) =>
    unwrap(
      await apiClient.get<ApiResponse<AdminRole[]>>('/roles', { params: { search } }),
    ),
  getRole: async (id: string) => unwrap(await apiClient.get<ApiResponse<AdminRole>>(`/roles/${id}`)),
  updateRole: async (id: string, payload: Record<string, unknown>) =>
    unwrap(await apiClient.patch<ApiResponse<AdminRole>>(`/roles/${id}`, payload)),
  cloneRolePermissions: async (id: string, targetCode: RoleCode) =>
    unwrap(
      await apiClient.post<ApiResponse<AdminRole>>(`/roles/${id}/clone-permissions`, {
        targetCode,
      }),
    ),

  // Permissions
  listPermissions: async (search?: string) =>
    unwrap(
      await apiClient.get<ApiResponse<PermissionItem[]>>('/permissions', {
        params: { search },
      }),
    ),
  groupedPermissions: async (search?: string) =>
    unwrap(
      await apiClient.get<ApiResponse<PermissionModuleGroup[]>>('/permissions/grouped', {
        params: { search },
      }),
    ),
  permissionMatrix: async () =>
    unwrap(await apiClient.get<ApiResponse<RolePermissionMatrix>>('/permissions/matrix')),

  // Settings
  getCompany: async () =>
    unwrap(await apiClient.get<ApiResponse<CompanySettings>>('/settings/company')),
  updateCompany: async (payload: Partial<CompanySettings>) =>
    unwrap(await apiClient.patch<ApiResponse<CompanySettings>>('/settings/company', payload)),
  getAppearance: async () =>
    unwrap(await apiClient.get<ApiResponse<AppearanceSettings>>('/settings/appearance')),
  updateAppearance: async (payload: Partial<AppearanceSettings>) =>
    unwrap(
      await apiClient.patch<ApiResponse<AppearanceSettings>>('/settings/appearance', payload),
    ),
  getStatistics: async () =>
    unwrap(await apiClient.get<ApiResponse<AdminStatistics>>('/settings/statistics')),
  getSecurity: async () =>
    unwrap(await apiClient.get<ApiResponse<SecuritySettings>>('/security')),
  updateSecurity: async (payload: Partial<SecuritySettings>) =>
    unwrap(await apiClient.patch<ApiResponse<SecuritySettings>>('/security', payload)),
  getNotifications: async () =>
    unwrap(
      await apiClient.get<ApiResponse<NotificationSettings>>('/notifications/settings'),
    ),
  updateNotifications: async (payload: Partial<NotificationSettings>) =>
    unwrap(
      await apiClient.patch<ApiResponse<NotificationSettings>>(
        '/notifications/settings',
        payload,
      ),
    ),

  // Profile
  getProfile: async () => unwrap(await apiClient.get<ApiResponse<UserProfile>>('/profile')),
  updateProfile: async (payload: Record<string, unknown>) =>
    unwrap(await apiClient.patch<ApiResponse<UserProfile>>('/profile', payload)),
  changePassword: async (currentPassword: string, newPassword: string) =>
    unwrap(
      await apiClient.post<ApiResponse<{ success: boolean }>>('/profile/password', {
        currentPassword,
        newPassword,
      }),
    ),

  // Audit
  listAudit: async (params?: AuditListParams) => {
    const res = await apiClient.get<ApiResponse<AuditLogItem[]> & { meta?: PaginationMeta }>(
      '/audit',
      { params },
    );
    return {
      items: res.data.data,
      meta: (res.data.meta ?? {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 1,
      }) as PaginationMeta,
    };
  },
  exportAudit: async (params?: AuditListParams) => {
    const res = await apiClient.get<Blob>('/audit/export', {
      params,
      responseType: 'blob',
    });
    return res.data;
  },
};
