import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoleCode, type JwtPayload } from '@transitops/shared-types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard, RolesGuard } from '../../common/guards/auth.guards';
import {
  ChangePasswordDto,
  UpdateAppearanceSettingsDto,
  UpdateCompanySettingsDto,
  UpdateProfileDto,
} from './dto/settings.dto';
import { SettingsService } from './settings.service';

const ADMIN_ROLES = [RoleCode.SUPER_ADMIN, RoleCode.ADMIN] as const;
const ALL_AUTH = Object.values(RoleCode);

@ApiTags('Settings')
@ApiBearerAuth()
@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('company')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Get company settings' })
  getCompany() {
    return this.settingsService.getCompanySettings();
  }

  @Patch('company')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Update company settings' })
  updateCompany(
    @Body() dto: UpdateCompanySettingsDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.settingsService.updateCompanySettings(dto, user);
  }

  @Get('appearance')
  @Roles(...ALL_AUTH)
  @ApiOperation({ summary: 'Get appearance preferences' })
  getAppearance() {
    return this.settingsService.getAppearanceSettings();
  }

  @Patch('appearance')
  @Roles(...ALL_AUTH)
  @ApiOperation({ summary: 'Update appearance preferences' })
  updateAppearance(
    @Body() dto: UpdateAppearanceSettingsDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.settingsService.updateAppearanceSettings(dto, user);
  }

  @Get('statistics')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Admin dashboard statistics' })
  getStatistics() {
    return this.settingsService.getSystemStatistics();
  }
}

@ApiTags('Profile')
@ApiBearerAuth()
@Controller('profile')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProfileController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @Roles(...ALL_AUTH)
  @ApiOperation({ summary: 'Get current user profile' })
  getProfile(@CurrentUser() user: JwtPayload) {
    return this.settingsService.getProfile(user.sub);
  }

  @Patch()
  @Roles(...ALL_AUTH)
  @ApiOperation({ summary: 'Update current user profile' })
  updateProfile(@Body() dto: UpdateProfileDto, @CurrentUser() user: JwtPayload) {
    return this.settingsService.updateProfile(user.sub, dto, user);
  }

  @Post('password')
  @Roles(...ALL_AUTH)
  @ApiOperation({ summary: 'Change password' })
  changePassword(@Body() dto: ChangePasswordDto, @CurrentUser() user: JwtPayload) {
    return this.settingsService.changePassword(user.sub, dto, user);
  }
}

@ApiTags('Security')
@ApiBearerAuth()
@Controller('security')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SecurityController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Get security settings' })
  getSecurity() {
    return this.settingsService.getSecuritySettings();
  }

  @Patch()
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Update security settings' })
  updateSecurity(
    @Body() dto: import('./dto/settings.dto').UpdateSecuritySettingsDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.settingsService.updateSecuritySettings(dto, user);
  }
}
