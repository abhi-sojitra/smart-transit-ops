import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  Validate,
} from 'class-validator';
import {
  MaintenancePriority,
  MaintenanceStatus,
  MaintenanceType,
} from '@transitops/shared-types';
import {
  IsAfterExpectedCompletionConstraint,
  IsCompletionAfterStartConstraint,
  IsTodayOrFutureConstraint,
} from '../validators/date-range.validator';
import { IsPositiveCostConstraint } from '../validators/cost.validator';

export class CreateMaintenanceDto {
  @ApiProperty({ example: '665f1a2b3c4d5e6f7a8b9c0d', description: 'Vehicle MongoDB ObjectId' })
  @IsMongoId()
  vehicleId!: string;

  @ApiProperty({ enum: MaintenanceType, example: MaintenanceType.PREVENTIVE })
  @IsEnum(MaintenanceType)
  maintenanceType!: MaintenanceType;

  @ApiProperty({ example: 'Scheduled 10k mile service', maxLength: 100 })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  title!: string;

  @ApiPropertyOptional({
    example: 'Full preventive inspection including fluids and brakes',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ enum: MaintenancePriority, example: MaintenancePriority.MEDIUM })
  @IsOptional()
  @IsEnum(MaintenancePriority)
  priority?: MaintenancePriority;

  @ApiPropertyOptional({ enum: MaintenanceStatus, example: MaintenanceStatus.SCHEDULED })
  @IsOptional()
  @IsEnum(MaintenanceStatus)
  status?: MaintenanceStatus;

  @ApiProperty({ example: '2026-07-12', description: 'Must be today or a future date' })
  @IsDateString()
  @Validate(IsTodayOrFutureConstraint)
  startDate!: string;

  @ApiProperty({ example: '2026-07-15', description: 'Must be today/future and >= startDate' })
  @IsDateString()
  @Validate(IsTodayOrFutureConstraint)
  @Validate(IsCompletionAfterStartConstraint)
  expectedCompletionDate!: string;

  @ApiProperty({ example: 850.5, description: 'Must be greater than zero' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Validate(IsPositiveCostConstraint)
  estimatedCost!: number;

  @ApiPropertyOptional({ example: 900 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  actualCost?: number;

  @ApiPropertyOptional({ example: 'FleetCare Motors' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  vendorName?: string;

  @ApiPropertyOptional({ example: '+1-555-0142' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  vendorPhone?: string;

  @ApiPropertyOptional({ example: 'Downtown Service Center' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  serviceCenter?: string;

  @ApiPropertyOptional({ example: 84210 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  odometerReading?: number;

  @ApiPropertyOptional({
    example: '2026-10-12',
    description: 'Must be after expectedCompletionDate',
  })
  @IsOptional()
  @IsDateString()
  @Validate(IsAfterExpectedCompletionConstraint)
  nextServiceDue?: string;

  @ApiPropertyOptional({ example: 'Customer requested OEM parts only', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class UpdateMaintenanceDto extends PartialType(
  OmitType(CreateMaintenanceDto, ['vehicleId'] as const),
) {
  @ApiPropertyOptional({ example: 'Updated internal notes', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class CompleteMaintenanceDto {
  @ApiPropertyOptional({ example: 920.75 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  actualCost?: number;

  @ApiPropertyOptional({ example: 'Replaced pads and rotors', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @ApiPropertyOptional({ example: '2026-07-14' })
  @IsOptional()
  @IsDateString()
  completedDate?: string;
}

export class CancelMaintenanceDto {
  @ApiPropertyOptional({ example: 'Parts unavailable — reschedule later', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
