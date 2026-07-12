import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoleCode, type JwtPayload } from '@transitops/shared-types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard, RolesGuard } from '../../common/guards/auth.guards';
import { UpdateNotificationSettingsDto } from '../settings/dto/settings.dto';
import { SettingsService } from '../settings/settings.service';

const ADMIN_ROLES = [RoleCode.SUPER_ADMIN, RoleCode.ADMIN] as const;

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('settings')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Get notification settings' })
  getSettings() {
    return this.settingsService.getNotificationSettings();
  }

  @Patch('settings')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Update notification settings' })
  updateSettings(
    @Body() dto: UpdateNotificationSettingsDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.settingsService.updateNotificationSettings(dto, user);
  }
}
