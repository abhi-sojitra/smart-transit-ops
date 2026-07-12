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
import { RoleCode, type JwtPayload } from '@transitops/shared-types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard, RolesGuard } from '../../common/guards/auth.guards';
import {
  CloneRolePermissionsDto,
  RoleQueryDto,
  UpdateRoleDto,
} from './dto/role.dto';
import { RolesService } from './roles.service';

const ADMIN_ROLES = [RoleCode.SUPER_ADMIN, RoleCode.ADMIN] as const;

@ApiTags('Roles')
@ApiBearerAuth()
@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'List roles' })
  findAll(@Query() query: RoleQueryDto) {
    return this.rolesService.findAll(query);
  }

  @Get(':id')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Get role by id' })
  findOne(@Param('id') id: string) {
    return this.rolesService.findById(id);
  }

  @Patch(':id')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Update role name, description, or permissions' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.rolesService.update(id, dto, user);
  }

  @Post(':id/clone-permissions')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Clone permissions from this role onto another role' })
  clonePermissions(
    @Param('id') id: string,
    @Body() dto: CloneRolePermissionsDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.rolesService.clonePermissions(id, dto, user);
  }

  @Post(':id/assign-users')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Assign this role to users' })
  assignUsers(
    @Param('id') id: string,
    @Body() body: { userIds: string[] },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.rolesService.assignUsers(id, body.userIds ?? [], user);
  }

  @Delete(':id')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Delete a non-system role' })
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.rolesService.remove(id, user);
  }
}
