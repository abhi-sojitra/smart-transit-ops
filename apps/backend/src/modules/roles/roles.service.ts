import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RoleCode, type AdminRole, type JwtPayload } from '@transitops/shared-types';
import { RoleRepository } from '../../repositories/role.repository';
import { UserRepository } from '../../repositories/user.repository';
import { AuditLogRepository } from '../../repositories/audit-log.repository';
import type { CloneRolePermissionsDto, RoleQueryDto, UpdateRoleDto } from './dto/role.dto';

function mapRole(
  doc: {
    _id: { toString(): string };
    code: RoleCode;
    name: string;
    description?: string;
    permissions: string[];
    isSystem?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
  },
  userCount = 0,
): AdminRole {
  return {
    id: doc._id.toString(),
    code: doc.code,
    name: doc.name,
    description: doc.description,
    permissions: doc.permissions ?? [],
    isSystem: doc.isSystem ?? true,
    userCount,
    createdAt: doc.createdAt?.toISOString() ?? new Date().toISOString(),
    updatedAt: doc.updatedAt?.toISOString() ?? new Date().toISOString(),
  };
}

@Injectable()
export class RolesService {
  constructor(
    private readonly roles: RoleRepository,
    private readonly users: UserRepository,
    private readonly audit: AuditLogRepository,
  ) {}

  async findAll(query: RoleQueryDto = {}) {
    const docs = await this.roles.search(query.search);
    const mapped = await Promise.all(
      docs.map(async (doc) => {
        const userCount = await this.users.countUsersWithRole(doc._id.toString());
        return mapRole(doc, userCount);
      }),
    );
    return mapped;
  }

  async findById(id: string) {
    const doc = await this.roles.findById(id);
    if (!doc) throw new NotFoundException('Role not found');
    const userCount = await this.users.countUsersWithRole(id);
    return mapRole(doc, userCount);
  }

  async update(id: string, dto: UpdateRoleDto, actor?: JwtPayload) {
    const existing = await this.roles.findById(id);
    if (!existing) throw new NotFoundException('Role not found');

    const updated = await this.roles.update(id, {
      name: dto.name,
      description: dto.description,
      permissions: dto.permissions,
    });

    await this.audit.create({
      action: dto.permissions ? 'PERMISSION_CHANGE' : 'UPDATE',
      module: 'ROLES',
      summary: `Updated role ${existing.code}`,
      entityType: 'Role',
      entityId: id,
      actorId: actor?.sub,
      actorEmail: actor?.email,
    });

    const userCount = await this.users.countUsersWithRole(id);
    return mapRole(updated!, userCount);
  }

  async updatePermissions(id: string, permissions: string[], actor?: JwtPayload) {
    return this.update(id, { permissions }, actor);
  }

  async clonePermissions(sourceId: string, dto: CloneRolePermissionsDto, actor?: JwtPayload) {
    const source = await this.roles.findById(sourceId);
    if (!source) throw new NotFoundException('Source role not found');
    const target = await this.roles.findByCode(dto.targetCode);
    if (!target) throw new NotFoundException('Target role not found');
    if (source._id.toString() === target._id.toString()) {
      throw new BadRequestException('Cannot clone a role onto itself');
    }

    const updated = await this.roles.update(target._id.toString(), {
      permissions: [...source.permissions],
    });

    await this.audit.create({
      action: 'PERMISSION_CHANGE',
      module: 'ROLES',
      summary: `Cloned permissions from ${source.code} → ${target.code}`,
      actorId: actor?.sub,
      actorEmail: actor?.email,
    });

    const userCount = await this.users.countUsersWithRole(target._id.toString());
    return mapRole(updated!, userCount);
  }

  async remove(id: string, actor?: JwtPayload) {
    const role = await this.roles.findById(id);
    if (!role) throw new NotFoundException('Role not found');
    if (role.isSystem !== false) {
      throw new BadRequestException('System roles cannot be deleted');
    }
    const assigned = await this.users.countUsersWithRole(id);
    if (assigned > 0) {
      throw new BadRequestException('Cannot delete a role assigned to users');
    }
    await this.roles.delete(id);
    await this.audit.create({
      action: 'DELETE',
      module: 'ROLES',
      summary: `Deleted role ${role.code}`,
      entityType: 'Role',
      entityId: id,
      actorId: actor?.sub,
      actorEmail: actor?.email,
    });
    return { success: true };
  }

  async assignUsers(roleId: string, userIds: string[], actor?: JwtPayload) {
    const role = await this.roles.findById(roleId);
    if (!role) throw new NotFoundException('Role not found');

    for (const userId of userIds) {
      const user = await this.users.findById(userId);
      if (!user) continue;
      const currentIds = (user.roles as Array<{ _id: { toString(): string } }>).map((r) =>
        r._id.toString(),
      );
      if (!currentIds.includes(roleId)) {
        await this.users.update(userId, {
          roles: [...user.roles.map((r) => (r as { _id: unknown })._id), role._id] as never,
        });
      }
    }

    await this.audit.create({
      action: 'ROLE_CHANGE',
      module: 'ROLES',
      summary: `Assigned role ${role.code} to ${userIds.length} users`,
      actorId: actor?.sub,
      actorEmail: actor?.email,
    });

    return this.findById(roleId);
  }
}
