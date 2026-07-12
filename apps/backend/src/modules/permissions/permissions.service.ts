import { Injectable } from '@nestjs/common';
import type {
  PermissionItem,
  PermissionModuleGroup,
  RolePermissionMatrix,
} from '@transitops/shared-types';
import { PermissionRepository } from '../../repositories/permission.repository';
import { RoleRepository } from '../../repositories/role.repository';
import { buildPermissionCatalog } from './permission.catalog';

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
    const [permissionDocs, roleDocs] = await Promise.all([
      this.permissions.findAll(),
      this.roles.findAll(),
    ]);

    const permissions = permissionDocs.map(mapPermission);
    const roles = roleDocs.map((r) => ({
      id: r._id.toString(),
      code: r.code,
      name: r.name,
    }));

    const matrix: Record<string, string[]> = {};
    for (const role of roleDocs) {
      matrix[role.code] = role.permissions ?? [];
    }

    return { roles, permissions, matrix };
  }
}
