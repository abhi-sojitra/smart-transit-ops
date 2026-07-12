import { RoleCode } from '@transitops/shared-types';
import { buildPermissionCatalog } from '../../modules/permissions/permission.catalog';

const FIRST = [
  'Alex',
  'Jordan',
  'Taylor',
  'Casey',
  'Riley',
  'Morgan',
  'Avery',
  'Quinn',
  'Parker',
  'Reese',
  'Cameron',
  'Drew',
  'Jamie',
  'Skyler',
  'Harper',
  'Rowan',
  'Sage',
  'Blake',
  'Finley',
  'Emerson',
];

const LAST = [
  'Nguyen',
  'Patel',
  'Garcia',
  'Kim',
  'Singh',
  'Brown',
  'Martinez',
  'Lee',
  'Wilson',
  'Anderson',
  'Thomas',
  'Jackson',
  'White',
  'Harris',
  'Clark',
  'Lewis',
  'Walker',
  'Hall',
  'Young',
  'Allen',
];

const ROLE_CYCLE: RoleCode[] = [
  RoleCode.FLEET_MANAGER,
  RoleCode.DISPATCHER,
  RoleCode.SAFETY_OFFICER,
  RoleCode.FINANCIAL_ANALYST,
  RoleCode.OPERATOR,
  RoleCode.VIEWER,
  RoleCode.ADMIN,
  RoleCode.OPERATOR,
];

/** Extra demo users (beyond admin + TEST_USERS) to reach ~20 accounts */
export function buildAdminDemoUsers() {
  return Array.from({ length: 15 }, (_, i) => {
    const firstName = FIRST[i];
    const lastName = LAST[i];
    return {
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@transitops.com`,
      password: 'Demo@12345',
      firstName,
      lastName,
      phone: `+1-555-01${String(i).padStart(2, '0')}`,
      role: ROLE_CYCLE[i % ROLE_CYCLE.length],
    };
  });
}

export function buildDemoAuditLogs(actorEmail = 'admin@transitops.com') {
  const actions = [
    'LOGIN',
    'LOGOUT',
    'CREATE',
    'UPDATE',
    'DELETE',
    'ROLE_CHANGE',
    'PERMISSION_CHANGE',
    'STATUS_CHANGE',
    'SETTINGS_UPDATE',
    'LOGIN_FAILED',
  ] as const;
  const modules = [
    'AUTH',
    'USERS',
    'ROLES',
    'PERMISSIONS',
    'SETTINGS',
    'PROFILE',
    'SECURITY',
    'NOTIFICATIONS',
  ] as const;

  return Array.from({ length: 50 }, (_, i) => {
    const action = actions[i % actions.length];
    const module = modules[i % modules.length];
    const createdAt = new Date();
    createdAt.setHours(createdAt.getHours() - i * 3);
    return {
      action,
      module,
      summary: `${action.replaceAll('_', ' ')} event #${i + 1} in ${module}`,
      actorEmail,
      actorName: 'System Admin',
      ip: `203.0.113.${(i % 50) + 1}`,
      browser: i % 2 === 0 ? 'Chrome' : 'Safari',
      device: i % 3 === 0 ? 'Desktop' : 'Mobile',
      createdAt,
    };
  });
}

export { buildPermissionCatalog };
