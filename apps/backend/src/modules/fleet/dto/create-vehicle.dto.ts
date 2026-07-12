import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsDateString,
  IsArray,
  IsUrl,
  Min,
  Max,
  MinLength,
  MaxLength,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { VehicleStatus, VehicleType, FuelType } from '@transitops/shared-types';
import { IsDateAfter, IsFutureDate } from '../validators/fleet.validators';

export class VehicleDocumentDto {
  @ApiProperty({ example: 'Registration.pdf' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty({ example: 'https://cdn.example.com/docs/registration.pdf' })
  @IsUrl()
  url!: string;

  @ApiPropertyOptional({ example: 'application/pdf' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ example: '2026-01-15T10:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  uploadedAt?: string;
}

export class CreateVehicleDto {
  @ApiProperty({ example: 'VH-1001' })
  @IsString()
  @MinLength(2)
  @MaxLength(32)
  @Matches(/^[A-Za-z0-9-_]+$/, {
    message: 'vehicleId may only contain letters, numbers, hyphens, and underscores',
  })
  vehicleId!: string;

  @ApiProperty({ example: 'KA01AB1234' })
  @IsString()
  @MinLength(4)
  @MaxLength(20)
  registrationNumber!: string;

  @ApiPropertyOptional({ example: '1HGBH41JXMN109186' })
  @IsOptional()
  @IsString()
  @MinLength(11)
  @MaxLength(17)
  vin?: string;

  @ApiProperty({ example: 'Tata' })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  make!: string;

  @ApiProperty({ example: 'Starbus Ultra' })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  model!: string;

  @ApiPropertyOptional({ example: 2022, minimum: 1980, maximum: 2100 })
  @IsOptional()
  @IsNumber()
  @Min(1980)
  @Max(2100)
  year?: number;

  @ApiProperty({ enum: VehicleType, example: VehicleType.BUS })
  @IsEnum(VehicleType)
  vehicleType!: VehicleType;

  @ApiProperty({ enum: FuelType, example: FuelType.DIESEL })
  @IsEnum(FuelType)
  fuelType!: FuelType;

  @ApiPropertyOptional({ example: 'White' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  color?: string;

  @ApiPropertyOptional({ example: 45, minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(200)
  seatingCapacity?: number;

  @ApiProperty({ example: 84210, minimum: 0 })
  @IsNumber()
  @Min(0)
  mileage!: number;

  @ApiPropertyOptional({ example: '2022-06-15' })
  @IsOptional()
  @IsDateString()
  purchaseDate?: string;

  @ApiProperty({ example: '2028-06-15' })
  @IsDateString()
  @IsFutureDate({ message: 'registrationExpiryDate must be greater than today' })
  registrationExpiryDate!: string;

  @ApiProperty({ example: '2027-12-31' })
  @IsDateString()
  @IsFutureDate({ message: 'insuranceExpiryDate must be greater than today' })
  insuranceExpiryDate!: string;

  @ApiProperty({ example: '2027-09-30' })
  @IsDateString()
  @IsFutureDate({ message: 'fitnessCertificateExpiryDate must be greater than today' })
  fitnessCertificateExpiryDate!: string;

  @ApiPropertyOptional({ example: '2026-06-12' })
  @IsOptional()
  @IsDateString()
  lastServiceDate?: string;

  @ApiPropertyOptional({ example: '2026-12-12' })
  @IsOptional()
  @IsDateString()
  @IsDateAfter('lastServiceDate')
  nextServiceDueDate?: string;

  @ApiPropertyOptional({ example: 'Bengaluru' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  depotCity?: string;

  @ApiPropertyOptional({ example: 'Karnataka' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  depotState?: string;

  @ApiPropertyOptional({ example: 'India' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  country?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/photos/vh-1001.jpg' })
  @IsOptional()
  @IsString()
  photo?: string;

  @ApiPropertyOptional({ type: [VehicleDocumentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VehicleDocumentDto)
  documents?: VehicleDocumentDto[];

  @ApiPropertyOptional({ enum: VehicleStatus, example: VehicleStatus.AVAILABLE })
  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus;

  @ApiPropertyOptional({ example: 'Primary intercity route vehicle' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  remarks?: string;
}
