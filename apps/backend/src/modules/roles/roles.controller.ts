import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { type JwtPayload } from '@transitops/shared-types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard, PermissionsGuard, RolesGuard } from '../../common/guards/auth.guards';
import {
  CloneRolePermissionsDto,
  RoleQueryDto,
  UpdateRoleDto,
} from './dto/role.dto';
import { RolesService } from './roles.service';

@ApiTags('Roles')
@ApiBearerAuth()
@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard, RolesGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @RequirePermissions('ROLES:VIEW')
  @ApiOperation({ summary: 'List roles' })
  findAll(@Query() query: RoleQueryDto) {
    return this.rolesService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('ROLES:VIEW')
  @ApiOperation({ summary: 'Get role by id' })
  findOne(@Param('id') id: string) {
    return this.rolesService.findById(id);
  }

  @Patch(':id')
  @RequirePermissions('ROLES:UPDATE')
  @ApiOperation({ summary: 'Update role name, description, or permissions' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.rolesService.update(id, dto, user);
  }

  @Post(':id/clone-permissions')
  @RequirePermissions('ROLES:UPDATE')
  @ApiOperation({ summary: 'Clone permissions from this role onto another role' })
  clonePermissions(
    @Param('id') id: string,
    @Body() dto: CloneRolePermissionsDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.rolesService.clonePermissions(id, dto, user);
  }

  @Post(':id/assign-users')
  @RequirePermissions('ROLES:UPDATE')
  @ApiOperation({ summary: 'Assign this role to users' })
  assignUsers(
    @Param('id') id: string,
    @Body() body: { userIds: string[] },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.rolesService.assignUsers(id, body.userIds ?? [], user);
  }

  @Delete(':id')
  @RequirePermissions('ROLES:DELETE')
  @ApiOperation({ summary: 'Delete a non-system role' })
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.rolesService.remove(id, user);
  }
}
