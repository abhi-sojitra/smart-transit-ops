import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { RoleCode, UserAccountStatus, type JwtPayload } from '@transitops/shared-types';
import { UserRepository } from '../../repositories/user.repository';
import { RoleRepository } from '../../repositories/role.repository';
import { AuditLogRepository } from '../../repositories/audit-log.repository';
import { mapUser } from './users.mapper';
import type {
  AssignRolesDto,
  BulkDeleteDto,
  BulkStatusDto,
  CreateUserDto,
  UpdateUserDto,
  UserQueryDto,
} from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly users: UserRepository,
    private readonly roles: RoleRepository,
    private readonly audit: AuditLogRepository,
  ) {}

  async findAll(query: UserQueryDto) {
    const result = await this.users.findPaginated(query);
    return {
      data: result.items.map(mapUser),
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit) || 1,
      },
    };
  }

  async findById(id: string) {
    const user = await this.users.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return mapUser(user);
  }

  findByEmail(email: string) {
    return this.users.findByEmail(email);
  }

  async create(dto: CreateUserDto, actor?: JwtPayload) {
    const existing = await this.users.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already registered');

    const roleDocs = await this.roles.findByCodes(dto.roles);
    if (roleDocs.length !== dto.roles.length) {
      throw new BadRequestException('One or more roles are invalid');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const created = await this.users.create({
      email: dto.email.toLowerCase(),
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      roles: roleDocs.map((r) => r._id),
      status: dto.status ?? UserAccountStatus.ACTIVE,
      isDeleted: false,
    });

    const populated = await this.users.findById(created._id.toString());
    await this.audit.create({
      action: 'CREATE',
      module: 'USERS',
      summary: `Created user ${dto.email}`,
      entityType: 'User',
      entityId: created._id.toString(),
      actorId: actor?.sub,
      actorEmail: actor?.email,
    });

    return mapUser(populated!);
  }

  async update(id: string, dto: UpdateUserDto, actor?: JwtPayload) {
    const existing = await this.users.findById(id);
    if (!existing) throw new NotFoundException('User not found');

    const patch: Record<string, unknown> = {};
    if (dto.firstName !== undefined) patch.firstName = dto.firstName;
    if (dto.lastName !== undefined) patch.lastName = dto.lastName;
    if (dto.phone !== undefined) patch.phone = dto.phone;
    if (dto.avatarUrl !== undefined) patch.avatarUrl = dto.avatarUrl;
    if (dto.status !== undefined) patch.status = dto.status;
    if (dto.email && dto.email.toLowerCase() !== existing.email) {
      const clash = await this.users.findByEmail(dto.email);
      if (clash) throw new ConflictException('Email already registered');
      patch.email = dto.email.toLowerCase();
    }
    if (dto.password) patch.passwordHash = await bcrypt.hash(dto.password, 12);
    if (dto.roles) {
      const roleDocs = await this.roles.findByCodes(dto.roles);
      if (roleDocs.length !== dto.roles.length) {
        throw new BadRequestException('One or more roles are invalid');
      }
      patch.roles = roleDocs.map((r) => r._id);
    }

    const updated = await this.users.update(id, patch);
    await this.audit.create({
      action: dto.roles ? 'ROLE_CHANGE' : dto.status ? 'STATUS_CHANGE' : 'UPDATE',
      module: 'USERS',
      summary: `Updated user ${existing.email}`,
      entityType: 'User',
      entityId: id,
      actorId: actor?.sub,
      actorEmail: actor?.email,
    });
    return mapUser(updated!);
  }

  async assignRole(id: string, dto: AssignRolesDto, actor?: JwtPayload) {
    return this.update(id, { roles: dto.roles }, actor);
  }

  async removeRole(id: string, roleCode: RoleCode, actor?: JwtPayload) {
    const user = await this.users.findById(id);
    if (!user) throw new NotFoundException('User not found');
    const current = mapUser(user).roles.filter((r) => r !== roleCode);
    if (!current.length) throw new BadRequestException('User must keep at least one role');
    return this.update(id, { roles: current }, actor);
  }

  async remove(id: string, actor?: JwtPayload) {
    const user = await this.users.findById(id);
    if (!user) throw new NotFoundException('User not found');
    if (actor?.sub === id) throw new BadRequestException('Cannot delete your own account');
    await this.users.delete(id);
    await this.audit.create({
      action: 'DELETE',
      module: 'USERS',
      summary: `Deleted user ${user.email}`,
      entityType: 'User',
      entityId: id,
      actorId: actor?.sub,
      actorEmail: actor?.email,
    });
    return { success: true };
  }

  async bulkStatus(dto: BulkStatusDto, actor?: JwtPayload) {
    const count = await this.users.updateStatusMany(dto.ids, dto.status);
    await this.audit.create({
      action: 'STATUS_CHANGE',
      module: 'USERS',
      summary: `Bulk status → ${dto.status} (${count} users)`,
      actorId: actor?.sub,
      actorEmail: actor?.email,
      metadata: { ids: dto.ids, status: dto.status },
    });
    return { updated: count };
  }

  async bulkDelete(dto: BulkDeleteDto, actor?: JwtPayload) {
    const ids = dto.ids.filter((id) => id !== actor?.sub);
    const count = await this.users.softDeleteMany(ids);
    await this.audit.create({
      action: 'DELETE',
      module: 'USERS',
      summary: `Bulk deleted ${count} users`,
      actorId: actor?.sub,
      actorEmail: actor?.email,
      metadata: { ids },
    });
    return { deleted: count };
  }

  getUserPermissions = async (userId: string): Promise<string[]> => {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    const roles = (user.roles ?? []) as Array<{ permissions?: string[]; code?: RoleCode }>;
    const set = new Set<string>();
    for (const role of roles) {
      for (const permission of role.permissions ?? []) set.add(permission);
    }
    if (set.has('*')) return ['*'];
    return Array.from(set);
  };
}
