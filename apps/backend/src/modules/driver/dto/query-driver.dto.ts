import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { DriverStatus, LicenseCategory } from '@transitops/shared-types';
import {
  DRIVER_DEFAULT_LIMIT,
  DRIVER_DEFAULT_PAGE,
  DRIVER_MAX_LIMIT,
  DRIVER_SORT_FIELDS,
} from '../constants/driver.constants';

export class QueryDriverDto {
  @ApiPropertyOptional({ example: 1, default: DRIVER_DEFAULT_PAGE })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = DRIVER_DEFAULT_PAGE;

  @ApiPropertyOptional({ example: 10, default: DRIVER_DEFAULT_LIMIT })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(DRIVER_MAX_LIMIT)
  limit?: number = DRIVER_DEFAULT_LIMIT;

  @ApiPropertyOptional({
    example: 'maya',
    description: 'Case-insensitive search across name, email, employee code, license, phone',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: DriverStatus })
  @IsOptional()
  @IsEnum(DriverStatus)
  status?: DriverStatus;

  @ApiPropertyOptional({ enum: LicenseCategory })
  @IsOptional()
  @IsEnum(LicenseCategory)
  licenseCategory?: LicenseCategory;

  @ApiPropertyOptional({ example: 'Bengaluru' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'Karnataka' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ example: 2, description: 'Minimum years of experience' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  experienceMin?: number;

  @ApiPropertyOptional({ example: 15, description: 'Maximum years of experience' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  experienceMax?: number;

  @ApiPropertyOptional({
    enum: DRIVER_SORT_FIELDS,
    example: 'createdAt',
    description: 'Sort field',
  })
  @IsOptional()
  @IsIn([...DRIVER_SORT_FIELDS])
  sortBy?: (typeof DRIVER_SORT_FIELDS)[number] = 'createdAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], example: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
