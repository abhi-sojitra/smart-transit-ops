import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsIn,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateCompanySettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  companyName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dateFormat?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  language?: string;
}

export class NotificationChannelsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  email?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  inApp?: boolean;
}

export class UpdateNotificationSettingsDto {
  @ApiPropertyOptional({ type: NotificationChannelsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => NotificationChannelsDto)
  channels?: NotificationChannelsDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  licenseExpiry?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  tripCompleted?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  maintenanceDue?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  fuelReminder?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  expenseApproval?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  newUser?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  roleChanges?: boolean;
}

export class UpdateSecuritySettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(6)
  minPasswordLength?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  requireUppercase?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  requireNumber?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  requireSpecialCharacter?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(5)
  sessionTimeoutMinutes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  twoFactorReady?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxLoginAttempts?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  lockDurationMinutes?: number;
}

export class UpdateAppearanceSettingsDto {
  @ApiPropertyOptional({ enum: ['light', 'dark', 'system'] })
  @IsOptional()
  @IsIn(['light', 'dark', 'system'])
  theme?: 'light' | 'dark' | 'system';

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  sidebarCollapsed?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  compactTables?: boolean;
}

export class UpdateProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  avatarUrl?: string;
}

export class ChangePasswordDto {
  @ApiPropertyOptional()
  @IsString()
  @MinLength(8)
  currentPassword!: string;

  @ApiPropertyOptional()
  @IsString()
  @MinLength(8)
  newPassword!: string;
}
