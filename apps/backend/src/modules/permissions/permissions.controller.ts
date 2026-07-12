import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard, PermissionsGuard, RolesGuard } from '../../common/guards/auth.guards';
import { PermissionsService } from './permissions.service';

@ApiTags('Permissions')
@ApiBearerAuth()
@Controller('permissions')
@UseGuards(JwtAuthGuard, PermissionsGuard, RolesGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @RequirePermissions('PERMISSIONS:VIEW')
  @ApiOperation({ summary: 'List permissions (searchable)' })
  list(@Query('search') search?: string, @Query('module') module?: string) {
    return this.permissionsService.list(search, module);
  }

  @Get('grouped')
  @RequirePermissions('PERMISSIONS:VIEW')
  @ApiOperation({ summary: 'Permissions grouped by module' })
  grouped(@Query('search') search?: string) {
    return this.permissionsService.grouped(search);
  }

  @Get('matrix')
  @RequirePermissions('PERMISSIONS:VIEW')
  @ApiOperation({ summary: 'Role × permission matrix' })
  matrix() {
    return this.permissionsService.matrix();
  }
}
