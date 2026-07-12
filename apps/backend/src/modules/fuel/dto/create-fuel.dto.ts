import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { FuelType } from '@transitops/shared-types';

export class CreateFuelDto {
  @ApiProperty({ example: 'VH-1001', description: 'Vehicle identifier' })
  @IsString()
  @IsNotEmpty()
  vehicleId!: string;

  @ApiPropertyOptional({ example: 'TR-2001' })
  @IsOptional()
  @IsString()
  tripId?: string;

  @ApiPropertyOptional({ example: 'DR-3001' })
  @IsOptional()
  @IsString()
  driverId?: string;

  @ApiProperty({ example: 'Shell Highway Station' })
  @IsString()
  @IsNotEmpty()
  fuelStation!: string;

  @ApiProperty({ enum: FuelType, example: FuelType.DIESEL })
  @IsEnum(FuelType)
  fuelType!: FuelType;

  @ApiProperty({ example: 45.5, description: 'Fuel quantity in liters' })
  @IsNumber()
  @Min(0.01)
  quantity!: number;

  @ApiProperty({ example: 1.85, description: 'Price per liter' })
  @IsNumber()
  @Min(0.01)
  pricePerLiter!: number;

  @ApiPropertyOptional({ example: 125430 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  odometerReading?: number;

  @ApiProperty({ example: '2026-03-15' })
  @IsString()
  @IsNotEmpty()
  filledAt!: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/receipts/fuel-001.jpg' })
  @IsOptional()
  @IsString()
  receiptImage?: string;

  @ApiPropertyOptional({ example: 'Full tank before long haul' })
  @IsOptional()
  @IsString()
  notes?: string;
}
