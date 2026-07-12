import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { type JwtPayload } from '@transitops/shared-types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard, PermissionsGuard, RolesGuard } from '../../common/guards/auth.guards';
import { UpdateNotificationSettingsDto } from '../settings/dto/settings.dto';
import { SettingsService } from '../settings/settings.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard, PermissionsGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('settings')
  @RequirePermissions('NOTIFICATIONS:VIEW')
  @ApiOperation({ summary: 'Get notification settings' })
  getSettings() {
    return this.settingsService.getNotificationSettings();
  }

  @Patch('settings')
  @RequirePermissions('NOTIFICATIONS:UPDATE')
  @ApiOperation({ summary: 'Update notification settings' })
  updateSettings(
    @Body() dto: UpdateNotificationSettingsDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.settingsService.updateNotificationSettings(dto, user);
  }
}
