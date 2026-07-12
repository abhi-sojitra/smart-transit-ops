import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { RoleCode } from '@transitops/shared-types';
import { ROLES_KEY } from '../decorators/roles.decorator';

export { PermissionsGuard } from './permissions.guard';
export type { AuthenticatedRequestUser } from './permissions.guard';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RoleCode[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: { roles?: RoleCode[] } }>();
    const userRoles = request.user?.roles ?? [];
    return requiredRoles.some((role) => userRoles.includes(role));
  }
}
