import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { JwtPayload, RoleCode } from '@transitops/shared-types';
import { RoleRepository } from '../../repositories/role.repository';
import {
  PERMISSIONS_KEY,
  PERMISSIONS_MODE_KEY,
  type PermissionMode,
} from '../decorators/permissions.decorator';

export type AuthenticatedRequestUser = JwtPayload & {
  permissions?: string[];
};

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly roles: RoleRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No permission metadata → do not block (RolesGuard / public routes still apply).
    if (!required?.length) return true;

    const mode =
      this.reflector.getAllAndOverride<PermissionMode>(PERMISSIONS_MODE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? 'any';

    const request = context.switchToHttp().getRequest<{
      user?: AuthenticatedRequestUser;
    }>();
    const user = request.user;
    if (!user?.sub) {
      throw new ForbiddenException('Authentication required');
    }

    const granted = await this.resolvePermissions(user);
    request.user = { ...user, permissions: granted };

    if (granted.includes('*')) return true;

    const allowed =
      mode === 'all'
        ? required.every((code) => granted.includes(code))
        : required.some((code) => granted.includes(code));

    if (!allowed) {
      throw new ForbiddenException(
        `Missing permission: ${required.join(' or ')}`,
      );
    }

    return true;
  }

  private async resolvePermissions(user: AuthenticatedRequestUser): Promise<string[]> {
    if (user.permissions?.length) return user.permissions;

    const roleCodes = (user.roles ?? []) as RoleCode[];
    if (!roleCodes.length) return [];

    const roleDocs = await this.roles.findByCodes(roleCodes);
    const set = new Set<string>();
    for (const role of roleDocs) {
      for (const permission of role.permissions ?? []) {
        set.add(permission);
      }
    }
    return Array.from(set);
  }
}
