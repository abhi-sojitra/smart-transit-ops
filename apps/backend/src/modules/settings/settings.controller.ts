import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { type JwtPayload } from '@transitops/shared-types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard, PermissionsGuard, RolesGuard } from '../../common/guards/auth.guards';
import {
  ChangePasswordDto,
  UpdateAppearanceSettingsDto,
  UpdateCompanySettingsDto,
  UpdateProfileDto,
} from './dto/settings.dto';
import { SettingsService } from './settings.service';

@ApiTags('Settings')
@ApiBearerAuth()
@Controller('settings')
@UseGuards(JwtAuthGuard, PermissionsGuard, RolesGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('company')
  @RequirePermissions('SETTINGS:VIEW')
  @ApiOperation({ summary: 'Get company settings' })
  getCompany() {
    return this.settingsService.getCompanySettings();
  }

  @Patch('company')
  @RequirePermissions('SETTINGS:UPDATE')
  @ApiOperation({ summary: 'Update company settings' })
  updateCompany(
    @Body() dto: UpdateCompanySettingsDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.settingsService.updateCompanySettings(dto, user);
  }

  @Get('appearance')
  @RequirePermissions('PROFILE:VIEW')
  @ApiOperation({ summary: 'Get appearance preferences' })
  getAppearance() {
    return this.settingsService.getAppearanceSettings();
  }

  @Patch('appearance')
  @RequirePermissions('PROFILE:UPDATE')
  @ApiOperation({ summary: 'Update appearance preferences' })
  updateAppearance(
    @Body() dto: UpdateAppearanceSettingsDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.settingsService.updateAppearanceSettings(dto, user);
  }

  @Get('statistics')
  @RequirePermissions('SETTINGS:VIEW')
  @ApiOperation({ summary: 'Admin dashboard statistics' })
  getStatistics() {
    return this.settingsService.getSystemStatistics();
  }
}

@ApiTags('Profile')
@ApiBearerAuth()
@Controller('profile')
@UseGuards(JwtAuthGuard, PermissionsGuard, RolesGuard)
export class ProfileController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @RequirePermissions('PROFILE:VIEW')
  @ApiOperation({ summary: 'Get current user profile' })
  getProfile(@CurrentUser() user: JwtPayload) {
    return this.settingsService.getProfile(user.sub);
  }

  @Patch()
  @RequirePermissions('PROFILE:UPDATE')
  @ApiOperation({ summary: 'Update current user profile' })
  updateProfile(@Body() dto: UpdateProfileDto, @CurrentUser() user: JwtPayload) {
    return this.settingsService.updateProfile(user.sub, dto, user);
  }

  @Post('password')
  @RequirePermissions('PROFILE:UPDATE')
  @ApiOperation({ summary: 'Change password' })
  changePassword(@Body() dto: ChangePasswordDto, @CurrentUser() user: JwtPayload) {
    return this.settingsService.changePassword(user.sub, dto, user);
  }
}

@ApiTags('Security')
@ApiBearerAuth()
@Controller('security')
@UseGuards(JwtAuthGuard, PermissionsGuard, RolesGuard)
export class SecurityController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @RequirePermissions('SETTINGS:VIEW')
  @ApiOperation({ summary: 'Get security settings' })
  getSecurity() {
    return this.settingsService.getSecuritySettings();
  }

  @Patch()
  @RequirePermissions('SETTINGS:UPDATE')
  @ApiOperation({ summary: 'Update security settings' })
  updateSecurity(
    @Body() dto: import('./dto/settings.dto').UpdateSecuritySettingsDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.settingsService.updateSecuritySettings(dto, user);
  }
}
