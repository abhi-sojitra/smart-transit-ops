import { RoleCode, UserAccountStatus } from '@transitops/shared-types';
import type { AdminUser } from '@transitops/shared-types';

type PopulatedRole = { _id: { toString(): string }; code: RoleCode; name?: string };

export function mapUser(doc: {
  _id: { toString(): string };
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  roles?: PopulatedRole[] | unknown[];
  status: UserAccountStatus;
  lastLoginAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}): AdminUser {
  const rawRoles = Array.isArray(doc.roles) ? doc.roles : [];
  const roleCodes: RoleCode[] = [];
  const roleIds: string[] = [];

  for (const role of rawRoles) {
    if (!role) continue;
    if (typeof role === 'string') {
      roleCodes.push(role as RoleCode);
      continue;
    }
    if (typeof role === 'object') {
      const obj = role as PopulatedRole & { toString?: () => string };
      if ('code' in obj && obj.code) roleCodes.push(obj.code);
      if (obj._id) roleIds.push(obj._id.toString());
      else if (typeof obj.toString === 'function') roleIds.push(obj.toString());
    }
  }

  return {
    id: doc._id.toString(),
    email: doc.email,
    firstName: doc.firstName,
    lastName: doc.lastName,
    phone: doc.phone,
    avatarUrl: doc.avatarUrl,
    roles: roleCodes,
    roleIds,
    status: doc.status,
    lastLoginAt: doc.lastLoginAt?.toISOString(),
    createdAt: doc.createdAt?.toISOString() ?? new Date().toISOString(),
    updatedAt: doc.updatedAt?.toISOString() ?? new Date().toISOString(),
  };
}
