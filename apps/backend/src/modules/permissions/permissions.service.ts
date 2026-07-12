import { Injectable } from '@nestjs/common';
import type {
  PermissionItem,
  PermissionModuleGroup,
  RolePermissionMatrix,
} from '@transitops/shared-types';
import { PermissionRepository } from '../../repositories/permission.repository';
import { RoleRepository } from '../../repositories/role.repository';
import {
  buildPermissionCatalog,
  ROLE_PERMISSION_DEFAULTS,
} from './permission.catalog';

function mapPermission(doc: {
  _id: { toString(): string };
  code: string;
  module: string;
  action: string;
  description: string;
  group: string;
}): PermissionItem {
  return {
    id: doc._id.toString(),
    code: doc.code,
    module: doc.module,
    action: doc.action,
    description: doc.description,
    group: doc.group,
  };
}

/** Keep only real catalog codes; keep "*" as wildcard. */
export function sanitizeRolePermissions(
  raw: string[] | undefined,
  catalogCodes: Set<string>,
): string[] {
  const source = raw ?? [];
  if (source.includes('*')) return ['*'];
  return Array.from(new Set(source.filter((code) => catalogCodes.has(code))));
}

@Injectable()
export class PermissionsService {
  constructor(
    private readonly permissions: PermissionRepository,
    private readonly roles: RoleRepository,
  ) {}

  async ensureCatalog() {
    const count = await this.permissions.countAll();
    if (count > 0) return { seeded: false, count };
    const catalog = buildPermissionCatalog();
    await this.permissions.insertMany(catalog);
    return { seeded: true, count: catalog.length };
  }

  /**
   * Restore system roles that have empty/invalid permission sets
   * back to ROLE_PERMISSION_DEFAULTS (does not overwrite intentional edits).
   */
  async repairBrokenSystemRoles() {
    await this.ensureCatalog();
    const catalogCodes = new Set(buildPermissionCatalog().map((p) => p.code));
    const roleDocs = await this.roles.findAll();
    let repaired = 0;

    for (const role of roleDocs) {
      if (role.isSystem === false) continue;
      const defaults = ROLE_PERMISSION_DEFAULTS[role.code];
      if (!defaults) continue;

      const cleaned = sanitizeRolePermissions(role.permissions, catalogCodes);
      const isBroken =
        cleaned.length === 0 ||
        // Only AUDIT leftovers after accidental Clear-all (common UI mistake)
        (cleaned.length > 0 &&
          cleaned.every((code) => code.startsWith('AUDIT:')) &&
          defaults.length > 2 &&
          !defaults.includes('*'));

      if (!isBroken) continue;

      await this.roles.update(role._id.toString(), {
        permissions: [...defaults],
      });
      repaired += 1;
    }

    return { repaired };
  }

  async list(search?: string, module?: string) {
    await this.ensureCatalog();
    const docs = await this.permissions.search(search, module);
    return docs.map(mapPermission);
  }

  async grouped(search?: string): Promise<PermissionModuleGroup[]> {
    const items = await this.list(search);
    const map = new Map<string, PermissionItem[]>();
    for (const item of items) {
      const list = map.get(item.module) ?? [];
      list.push(item);
      map.set(item.module, list);
    }
    return Array.from(map.entries()).map(([module, permissions]) => ({
      module,
      permissions,
    }));
  }

  async matrix(): Promise<RolePermissionMatrix> {
    await this.ensureCatalog();
    await this.repairBrokenSystemRoles();

    const [permissionDocs, roleDocs] = await Promise.all([
      this.permissions.findAll(),
      this.roles.findAll(),
    ]);

    const permissions = permissionDocs.map(mapPermission);
    const catalogCodes = new Set(permissions.map((p) => p.code));
    const roles = roleDocs.map((r) => ({
      id: r._id.toString(),
      code: r.code,
      name: r.name,
    }));

    const matrix: Record<string, string[]> = {};
    for (const role of roleDocs) {
      matrix[role.code] = sanitizeRolePermissions(role.permissions, catalogCodes);
    }

    return { roles, permissions, matrix };
  }

  catalogCodeSet() {
    return new Set(buildPermissionCatalog().map((p) => p.code));
  }
}
