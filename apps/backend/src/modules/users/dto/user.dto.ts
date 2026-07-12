import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RoleCode, UserAccountStatus } from '@transitops/shared-types';

export class CreateUserDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  firstName!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  lastName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ type: [String], enum: RoleCode })
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(RoleCode, { each: true })
  roles!: RoleCode[];

  @ApiPropertyOptional({ enum: UserAccountStatus })
  @IsOptional()
  @IsEnum(UserAccountStatus)
  status?: UserAccountStatus;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  avatarUrl?: string;
}

export class UserQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: UserAccountStatus })
  @IsOptional()
  @IsEnum(UserAccountStatus)
  status?: UserAccountStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  roleId?: string;

  @ApiPropertyOptional({ enum: ['createdAt', 'email', 'firstName', 'lastLoginAt'] })
  @IsOptional()
  @IsIn(['createdAt', 'email', 'firstName', 'lastLoginAt'])
  sortBy?: 'createdAt' | 'email' | 'firstName' | 'lastLoginAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}

export class BulkStatusDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsMongoId({ each: true })
  ids!: string[];

  @ApiProperty({ enum: UserAccountStatus })
  @IsEnum(UserAccountStatus)
  status!: UserAccountStatus;
}

export class BulkDeleteDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsMongoId({ each: true })
  ids!: string[];
}

export class AssignRolesDto {
  @ApiProperty({ type: [String], enum: RoleCode })
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(RoleCode, { each: true })
  roles!: RoleCode[];
}
