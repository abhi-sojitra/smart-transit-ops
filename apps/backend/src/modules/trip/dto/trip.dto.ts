import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CargoType, TripStatus } from '@transitops/shared-types';
import { TRIP_SORT_FIELDS } from '../constants/trip.constants';

export class TripDocumentDto {
  @ApiProperty({ example: 'Bill of Lading' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty({ example: 'https://cdn.example.com/bol.pdf' })
  @IsString()
  @MinLength(1)
  url!: string;
}

export class CreateTripDto {
  @ApiProperty({ example: 'Chicago, IL' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  source!: string;

  @ApiProperty({ example: 'Detroit, MI' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  destination!: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  vehicleId!: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439012' })
  @IsMongoId()
  driverId!: string;

  @ApiProperty({ example: 'Electronics' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  cargoName!: string;

  @ApiProperty({ example: 12000 })
  @IsNumber()
  @Min(0)
  cargoWeight!: number;

  @ApiProperty({ enum: CargoType, example: CargoType.GENERAL })
  @IsEnum(CargoType)
  cargoType!: CargoType;

  @ApiProperty({ example: 450 })
  @IsNumber()
  @Min(1)
  plannedDistance!: number;

  @ApiProperty({ example: '2026-07-15T08:00:00.000Z' })
  @IsDateString()
  plannedStartDate!: string;

  @ApiProperty({ example: '2026-07-15T18:00:00.000Z' })
  @IsDateString()
  plannedEndDate!: string;

  @ApiProperty({ example: 3500 })
  @IsNumber()
  @Min(0)
  estimatedRevenue!: number;

  @ApiPropertyOptional({ example: 'Priority customer delivery' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional({ type: [TripDocumentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TripDocumentDto)
  tripDocuments?: TripDocumentDto[];
}

export class UpdateTripDto extends PartialType(CreateTripDto) {}

export class CompleteTripDto {
  @ApiProperty({ example: 462 })
  @IsNumber()
  @Min(0)
  actualDistance!: number;

  @ApiProperty({ example: 78.5 })
  @IsNumber()
  @Min(0)
  fuelConsumed!: number;

  @ApiProperty({ example: 3650 })
  @IsNumber()
  @Min(0)
  actualRevenue!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class CancelTripDto {
  @ApiPropertyOptional({ example: 'Customer cancelled shipment' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class QueryTripDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ example: 'TR-1001' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: TripStatus })
  @IsOptional()
  @IsEnum(TripStatus)
  status?: TripStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  driverId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  vehicleId?: string;

  @ApiPropertyOptional({ example: '2026-07-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-07-31T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ enum: TRIP_SORT_FIELDS, default: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: (typeof TRIP_SORT_FIELDS)[number] = 'createdAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
