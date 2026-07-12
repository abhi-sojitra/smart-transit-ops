import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Permission, PermissionSchema } from '../../schemas/permission.schema';
import { Role, RoleSchema } from '../../schemas/role.schema';
import { PermissionRepository } from '../../repositories/permission.repository';
import { RoleRepository } from '../../repositories/role.repository';
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Permission.name, schema: PermissionSchema },
      { name: Role.name, schema: RoleSchema },
    ]),
  ],
  controllers: [PermissionsController],
  providers: [PermissionsService, PermissionRepository, RoleRepository],
  exports: [PermissionsService, PermissionRepository],
})
export class PermissionsModule {}
