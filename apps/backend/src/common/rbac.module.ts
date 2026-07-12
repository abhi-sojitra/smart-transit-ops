import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Role, RoleSchema } from '../schemas/role.schema';
import { RoleRepository } from '../repositories/role.repository';
import { PermissionsGuard } from './guards/permissions.guard';
import { RolesGuard } from './guards/auth.guards';

/**
 * Global RBAC providers so every module can use @RequirePermissions /
 * PermissionsGuard without re-registering RoleRepository.
 *
 * Note: PermissionsGuard must run AFTER JwtAuthGuard (see controller @UseGuards order).
 * It is NOT registered as APP_GUARD so auth/health stay public.
 */
@Global()
@Module({
  imports: [MongooseModule.forFeature([{ name: Role.name, schema: RoleSchema }])],
  providers: [RoleRepository, RolesGuard, PermissionsGuard],
  exports: [RoleRepository, RolesGuard, PermissionsGuard],
})
export class RbacModule {}
