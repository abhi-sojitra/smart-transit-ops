'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { RoleCode, UserAccountStatus } from '@transitops/shared-types';
import { toast } from 'sonner';
import {
  adminService,
  type AuditListParams,
  type UserListParams,
} from '@/services/admin.service';

export const adminKeys = {
  all: ['admin'] as const,
  users: (params?: UserListParams) => [...adminKeys.all, 'users', params] as const,
  user: (id: string) => [...adminKeys.all, 'user', id] as const,
  roles: (search?: string) => [...adminKeys.all, 'roles', search] as const,
  permissions: (search?: string) => [...adminKeys.all, 'permissions', search] as const,
  matrix: () => [...adminKeys.all, 'matrix'] as const,
  company: () => [...adminKeys.all, 'company'] as const,
  security: () => [...adminKeys.all, 'security'] as const,
  notifications: () => [...adminKeys.all, 'notifications'] as const,
  appearance: () => [...adminKeys.all, 'appearance'] as const,
  statistics: () => [...adminKeys.all, 'statistics'] as const,
  profile: () => [...adminKeys.all, 'profile'] as const,
  audit: (params?: AuditListParams) => [...adminKeys.all, 'audit', params] as const,
};

function errorMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error && 'response' in error) {
    const data = (error as { response?: { data?: { message?: string } } }).response?.data;
    if (data?.message) return data.message;
  }
  return fallback;
}

export function useAdminUsers(params?: UserListParams) {
  return useQuery({
    queryKey: adminKeys.users(params),
    queryFn: () => adminService.listUsers(params),
    placeholderData: (prev) => prev,
  });
}

export function useAdminRoles(search?: string) {
  return useQuery({
    queryKey: adminKeys.roles(search),
    queryFn: () => adminService.listRoles(search),
  });
}

export function usePermissionMatrix() {
  return useQuery({
    queryKey: adminKeys.matrix(),
    queryFn: () => adminService.permissionMatrix(),
  });
}

export function useGroupedPermissions(search?: string) {
  return useQuery({
    queryKey: adminKeys.permissions(search),
    queryFn: () => adminService.groupedPermissions(search),
  });
}

export function useCompanySettings() {
  return useQuery({
    queryKey: adminKeys.company(),
    queryFn: () => adminService.getCompany(),
  });
}

export function useSecuritySettings() {
  return useQuery({
    queryKey: adminKeys.security(),
    queryFn: () => adminService.getSecurity(),
  });
}

export function useNotificationSettings() {
  return useQuery({
    queryKey: adminKeys.notifications(),
    queryFn: () => adminService.getNotifications(),
  });
}

export function useAppearanceSettings() {
  return useQuery({
    queryKey: adminKeys.appearance(),
    queryFn: () => adminService.getAppearance(),
  });
}

export function useAdminStatistics() {
  return useQuery({
    queryKey: adminKeys.statistics(),
    queryFn: () => adminService.getStatistics(),
  });
}

export function useProfile() {
  return useQuery({
    queryKey: adminKeys.profile(),
    queryFn: () => adminService.getProfile(),
  });
}

export function useAuditLogs(params?: AuditListParams) {
  return useQuery({
    queryKey: adminKeys.audit(params),
    queryFn: () => adminService.listAudit(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateUserMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => adminService.createUser(payload),
    onSuccess: () => {
      toast.success('User created');
      void qc.invalidateQueries({ queryKey: adminKeys.all });
    },
    onError: (e) => toast.error(errorMessage(e, 'Failed to create user')),
  });
}

export function useUpdateUserMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      adminService.updateUser(id, payload),
    onSuccess: () => {
      toast.success('User updated');
      void qc.invalidateQueries({ queryKey: adminKeys.all });
    },
    onError: (e) => toast.error(errorMessage(e, 'Failed to update user')),
  });
}

export function useDeleteUserMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminService.deleteUser(id),
    onSuccess: () => {
      toast.success('User deleted');
      void qc.invalidateQueries({ queryKey: adminKeys.all });
    },
    onError: (e) => toast.error(errorMessage(e, 'Failed to delete user')),
  });
}

export function useBulkUserStatusMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: UserAccountStatus }) =>
      adminService.bulkStatus(ids, status),
    onSuccess: (res) => {
      toast.success(`Updated ${res.updated} users`);
      void qc.invalidateQueries({ queryKey: adminKeys.all });
    },
    onError: (e) => toast.error(errorMessage(e, 'Bulk update failed')),
  });
}

export function useUpdateRoleMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      adminService.updateRole(id, payload),
    onSuccess: () => {
      toast.success('Role updated');
      void qc.invalidateQueries({ queryKey: adminKeys.all });
    },
    onError: (e) => toast.error(errorMessage(e, 'Failed to update role')),
  });
}

export function useCloneRoleMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, targetCode }: { id: string; targetCode: RoleCode }) =>
      adminService.cloneRolePermissions(id, targetCode),
    onSuccess: () => {
      toast.success('Permissions cloned');
      void qc.invalidateQueries({ queryKey: adminKeys.all });
    },
    onError: (e) => toast.error(errorMessage(e, 'Clone failed')),
  });
}

export function useUpdateCompanyMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminService.updateCompany,
    onSuccess: () => {
      toast.success('Company settings saved');
      void qc.invalidateQueries({ queryKey: adminKeys.company() });
    },
    onError: (e) => toast.error(errorMessage(e, 'Save failed')),
  });
}

export function useUpdateSecurityMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminService.updateSecurity,
    onSuccess: () => {
      toast.success('Security settings saved');
      void qc.invalidateQueries({ queryKey: adminKeys.security() });
    },
    onError: (e) => toast.error(errorMessage(e, 'Save failed')),
  });
}

export function useUpdateNotificationsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminService.updateNotifications,
    onSuccess: () => {
      toast.success('Notification settings saved');
      void qc.invalidateQueries({ queryKey: adminKeys.notifications() });
    },
    onError: (e) => toast.error(errorMessage(e, 'Save failed')),
  });
}

export function useUpdateAppearanceMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminService.updateAppearance,
    onSuccess: () => {
      toast.success('Appearance saved');
      void qc.invalidateQueries({ queryKey: adminKeys.appearance() });
    },
    onError: (e) => toast.error(errorMessage(e, 'Save failed')),
  });
}

export function useUpdateProfileMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminService.updateProfile,
    onSuccess: () => {
      toast.success('Profile updated');
      void qc.invalidateQueries({ queryKey: adminKeys.profile() });
    },
    onError: (e) => toast.error(errorMessage(e, 'Update failed')),
  });
}

export function useChangePasswordMutation() {
  return useMutation({
    mutationFn: ({
      currentPassword,
      newPassword,
    }: {
      currentPassword: string;
      newPassword: string;
    }) => adminService.changePassword(currentPassword, newPassword),
    onSuccess: () => toast.success('Password changed'),
    onError: (e) => toast.error(errorMessage(e, 'Password change failed')),
  });
}
