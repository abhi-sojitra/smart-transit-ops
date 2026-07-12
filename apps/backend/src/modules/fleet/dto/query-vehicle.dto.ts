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
import { VehicleStatus, VehicleType, FuelType } from '@transitops/shared-types';
import {
  VEHICLE_DEFAULT_LIMIT,
  VEHICLE_DEFAULT_PAGE,
  VEHICLE_MAX_LIMIT,
  VEHICLE_SORT_FIELDS,
} from '../constants/fleet.constants';

export class QueryVehicleDto {
  @ApiPropertyOptional({ example: 1, default: VEHICLE_DEFAULT_PAGE })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = VEHICLE_DEFAULT_PAGE;

  @ApiPropertyOptional({ example: 10, default: VEHICLE_DEFAULT_LIMIT })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(VEHICLE_MAX_LIMIT)
  limit?: number = VEHICLE_DEFAULT_LIMIT;

  @ApiPropertyOptional({
    example: 'tata',
    description: 'Case-insensitive search across vehicle id, registration, make, model, VIN',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: VehicleStatus })
  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus;

  @ApiPropertyOptional({ enum: VehicleType })
  @IsOptional()
  @IsEnum(VehicleType)
  vehicleType?: VehicleType;

  @ApiPropertyOptional({ enum: FuelType })
  @IsOptional()
  @IsEnum(FuelType)
  fuelType?: FuelType;

  @ApiPropertyOptional({ example: 'Bengaluru' })
  @IsOptional()
  @IsString()
  depotCity?: string;

  @ApiPropertyOptional({ example: 'Karnataka' })
  @IsOptional()
  @IsString()
  depotState?: string;

  @ApiPropertyOptional({ example: 2020 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1980)
  yearMin?: number;

  @ApiPropertyOptional({ example: 2024 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1980)
  yearMax?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  mileageMin?: number;

  @ApiPropertyOptional({ example: 200000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  mileageMax?: number;

  @ApiPropertyOptional({
    enum: VEHICLE_SORT_FIELDS,
    example: 'createdAt',
    description: 'Sort field',
  })
  @IsOptional()
  @IsIn([...VEHICLE_SORT_FIELDS])
  sortBy?: (typeof VEHICLE_SORT_FIELDS)[number] = 'createdAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], example: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
