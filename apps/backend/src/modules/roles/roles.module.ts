import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Role, RoleSchema } from '../../schemas/role.schema';
import { User, UserSchema } from '../../schemas/user.schema';
import { AuditLog, AuditLogSchema } from '../../schemas/audit-log.schema';
import { RoleRepository } from '../../repositories/role.repository';
import { UserRepository } from '../../repositories/user.repository';
import { AuditLogRepository } from '../../repositories/audit-log.repository';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Role.name, schema: RoleSchema },
      { name: User.name, schema: UserSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),
  ],
  controllers: [RolesController],
  providers: [RolesService, RoleRepository, UserRepository, AuditLogRepository],
  exports: [RolesService, RoleRepository],
})
export class RolesModule {}
