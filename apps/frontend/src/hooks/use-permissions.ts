'use client';

import { useMemo } from 'react';
import { useProfile } from '@/hooks/use-admin';
import { hasAnyPermission } from '@/constants/nav';

export function useUserPermissions() {
  const profileQuery = useProfile();
  const permissions = profileQuery.data?.permissions ?? [];

  const can = useMemo(
    () => (required?: string | string[]) => {
      const list = !required ? [] : Array.isArray(required) ? required : [required];
      return hasAnyPermission(permissions, list.length ? list : undefined);
    },
    [permissions],
  );

  return {
    permissions,
    can,
    isLoading: profileQuery.isLoading,
    hasFullAccess: permissions.includes('*'),
  };
}
