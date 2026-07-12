import { RoleCode } from '@transitops/shared-types';
import { ROLE_PERMISSION_DEFAULTS } from '../../modules/permissions/permission.catalog';

export const DEFAULT_ROLES = [
  {
    code: RoleCode.SUPER_ADMIN,
    name: 'Super Admin',
    description: 'Full system access',
    permissions: ROLE_PERMISSION_DEFAULTS.SUPER_ADMIN,
    isSystem: true,
  },
  {
    code: RoleCode.ADMIN,
    name: 'Admin',
    description: 'Administrative access across users, roles, and settings',
    permissions: ROLE_PERMISSION_DEFAULTS.ADMIN,
    isSystem: true,
  },
  {
    code: RoleCode.FLEET_MANAGER,
    name: 'Fleet Manager',
    description: 'Fleet operations, trips, and maintenance',
    permissions: ROLE_PERMISSION_DEFAULTS.FLEET_MANAGER,
    isSystem: true,
  },
  {
    code: RoleCode.DISPATCHER,
    name: 'Dispatcher',
    description: 'Dispatch trips and assign drivers',
    permissions: ROLE_PERMISSION_DEFAULTS.DISPATCHER,
    isSystem: true,
  },
  {
    code: RoleCode.SAFETY_OFFICER,
    name: 'Safety Officer',
    description: 'Driver safety and maintenance compliance',
    permissions: ROLE_PERMISSION_DEFAULTS.SAFETY_OFFICER,
    isSystem: true,
  },
  {
    code: RoleCode.FINANCIAL_ANALYST,
    name: 'Financial Analyst',
    description: 'Finance, reports, and dashboard access',
    permissions: ROLE_PERMISSION_DEFAULTS.FINANCIAL_ANALYST,
    isSystem: true,
  },
  {
    code: RoleCode.OPERATOR,
    name: 'Driver / Operator',
    description: 'Own profile and trip visibility',
    permissions: ROLE_PERMISSION_DEFAULTS.OPERATOR,
    isSystem: true,
  },
  {
    code: RoleCode.VIEWER,
    name: 'Viewer',
    description: 'Read-only operational visibility',
    permissions: ROLE_PERMISSION_DEFAULTS.VIEWER,
    isSystem: true,
  },
] as const;
