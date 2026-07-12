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
  AssignRolesDto,
  BulkDeleteDto,
  BulkStatusDto,
  CreateUserDto,
  UpdateUserDto,
  UserQueryDto,
} from './dto/user.dto';
import { UsersService } from './users.service';

const ADMIN_ROLES = [RoleCode.SUPER_ADMIN, RoleCode.ADMIN] as const;

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'List users with search, filters, pagination' })
  findAll(@Query() query: UserQueryDto) {
    return this.usersService.findAll(query);
  }

  @Post()
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Create user' })
  create(@Body() dto: CreateUserDto, @CurrentUser() user: JwtPayload) {
    return this.usersService.create(dto, user);
  }

  @Post('bulk/status')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Bulk update user status' })
  bulkStatus(@Body() dto: BulkStatusDto, @CurrentUser() user: JwtPayload) {
    return this.usersService.bulkStatus(dto, user);
  }

  @Post('bulk/delete')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Bulk soft-delete users' })
  bulkDelete(@Body() dto: BulkDeleteDto, @CurrentUser() user: JwtPayload) {
    return this.usersService.bulkDelete(dto, user);
  }

  @Get(':id')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Get user by id' })
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Get(':id/permissions')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Get effective permissions for a user' })
  getPermissions(@Param('id') id: string) {
    return this.usersService.getUserPermissions(id);
  }

  @Patch(':id')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Update user' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.usersService.update(id, dto, user);
  }

  @Post(':id/roles')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Assign roles to user' })
  assignRole(
    @Param('id') id: string,
    @Body() dto: AssignRolesDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.usersService.assignRole(id, dto, user);
  }

  @Delete(':id/roles/:roleCode')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Remove a role from user' })
  removeRole(
    @Param('id') id: string,
    @Param('roleCode') roleCode: RoleCode,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.usersService.removeRole(id, roleCode, user);
  }

  @Delete(':id')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Soft-delete user' })
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.usersService.remove(id, user);
  }
}
