import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { BiReportType } from '@transitops/shared-types';

export const BI_REPORT_TYPES = [
  'executive',
  'fleet',
  'drivers',
  'vehicles',
  'trips',
  'maintenance',
  'fuel',
  'expenses',
  'financial',
  'profitability',
] as const satisfies readonly BiReportType[];

export class ReportQueryDto {
  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-07-12' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  vehicleId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  driverId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  tripId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  maintenanceType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  expenseCategory?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(32)
  fuelType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  region?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  vendor?: string;

  @ApiPropertyOptional({ description: 'Route match as Source to Destination' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  route?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class ExportReportDto extends ReportQueryDto {
  @ApiProperty({ enum: BI_REPORT_TYPES })
  @IsIn([...BI_REPORT_TYPES])
  type!: BiReportType;

  @ApiProperty({ enum: ['csv', 'pdf', 'excel'], default: 'csv' })
  @IsIn(['csv', 'pdf', 'excel'])
  format!: 'csv' | 'pdf' | 'excel';
}

export class ScheduleReportDto extends ExportReportDto {
  @ApiProperty({ enum: ['daily', 'weekly', 'monthly', 'yearly'] })
  @IsIn(['daily', 'weekly', 'monthly', 'yearly'])
  frequency!: 'daily' | 'weekly' | 'monthly' | 'yearly';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  email?: string;
}
