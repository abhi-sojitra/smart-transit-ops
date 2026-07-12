import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoleCode } from '@transitops/shared-types';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard, RolesGuard } from '../../common/guards/auth.guards';
import { PermissionsService } from './permissions.service';

const ADMIN_ROLES = [RoleCode.SUPER_ADMIN, RoleCode.ADMIN] as const;

@ApiTags('Permissions')
@ApiBearerAuth()
@Controller('permissions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'List permissions (searchable)' })
  list(@Query('search') search?: string, @Query('module') module?: string) {
    return this.permissionsService.list(search, module);
  }

  @Get('grouped')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Permissions grouped by module' })
  grouped(@Query('search') search?: string) {
    return this.permissionsService.grouped(search);
  }

  @Get('matrix')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Role × permission matrix' })
  matrix() {
    return this.permissionsService.matrix();
  }
}
