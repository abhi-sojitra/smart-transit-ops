import { RoleCode } from '@transitops/shared-types';

export const DEFAULT_ROLES = [
  {
    code: RoleCode.SUPER_ADMIN,
    name: 'Super Admin',
    description: 'Full system access',
    permissions: ['*'],
  },
  {
    code: RoleCode.ADMIN,
    name: 'Admin',
    description: 'Administrative access',
    permissions: ['users:read', 'users:write', 'roles:read'],
  },
  {
    code: RoleCode.FLEET_MANAGER,
    name: 'Fleet Manager',
    description: 'Manage fleet and vehicles',
    permissions: ['fleet:read', 'fleet:write'],
  },
  {
    code: RoleCode.DISPATCHER,
    name: 'Dispatcher',
    description: 'Dispatch trips and assign drivers',
    permissions: ['trips:read', 'trips:write', 'drivers:read'],
  },
  {
    code: RoleCode.SAFETY_OFFICER,
    name: 'Safety Officer',
    description: 'Monitor safety scores and compliance',
    permissions: ['drivers:read', 'safety:read'],
  },
  {
    code: RoleCode.FINANCIAL_ANALYST,
    name: 'Financial Analyst',
    description: 'Fuel, expenses, and analytics',
    permissions: ['expenses:read', 'analytics:read'],
  },
  {
    code: RoleCode.OPERATOR,
    name: 'Operator',
    description: 'Day-to-day operations',
    permissions: ['trips:read', 'fleet:read'],
  },
  {
    code: RoleCode.VIEWER,
    name: 'Viewer',
    description: 'Read-only access',
    permissions: ['*:read'],
  },
] as const;
