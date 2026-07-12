import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { JwtAuthGuard, RolesGuard } from '../../common/guards/auth.guards';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleCode } from '@transitops/shared-types';

@ApiTags('Roles')
@ApiBearerAuth()
@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @Roles(RoleCode.SUPER_ADMIN, RoleCode.ADMIN)
  @ApiOperation({ summary: 'List roles (requires auth — scaffold)' })
  findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  @Roles(RoleCode.SUPER_ADMIN, RoleCode.ADMIN)
  @ApiOperation({ summary: 'Get role by id (requires auth — scaffold)' })
  findOne(@Param('id') id: string) {
    return this.rolesService.findById(id);
  }
}
