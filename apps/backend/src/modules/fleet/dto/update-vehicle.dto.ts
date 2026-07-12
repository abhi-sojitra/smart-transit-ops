import { PartialType, OmitType, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';
import { CreateVehicleDto } from './create-vehicle.dto';
import {
  IsDateAfter,
  IsFutureDate,
  IsPastOrToday,
} from '../validators/fleet.validators';

export class UpdateVehicleDto extends PartialType(
  OmitType(CreateVehicleDto, [
    'registrationExpiryDate',
    'insuranceExpiryDate',
    'fitnessCertificateExpiryDate',
    'lastServiceDate',
    'nextServiceDueDate',
  ] as const),
) {
  @ApiPropertyOptional({ example: '2028-06-15' })
  @IsOptional()
  @IsDateString()
  @IsFutureDate({ message: 'registrationExpiryDate must be greater than today' })
  registrationExpiryDate?: string;

  @ApiPropertyOptional({ example: '2027-12-31' })
  @IsOptional()
  @IsDateString()
  @IsFutureDate({ message: 'insuranceExpiryDate must be greater than today' })
  insuranceExpiryDate?: string;

  @ApiPropertyOptional({ example: '2027-09-30' })
  @IsOptional()
  @IsDateString()
  @IsFutureDate({ message: 'fitnessCertificateExpiryDate must be greater than today' })
  fitnessCertificateExpiryDate?: string;

  @ApiPropertyOptional({ example: '2026-06-12' })
  @IsOptional()
  @IsDateString()
  @IsPastOrToday({ message: 'lastServiceDate must be today or a past date' })
  lastServiceDate?: string;

  @ApiPropertyOptional({ example: '2026-12-12' })
  @IsOptional()
  @IsDateString()
  @IsFutureDate({ message: 'nextServiceDueDate must be greater than today' })
  @IsDateAfter('lastServiceDate', {
    message: 'nextServiceDueDate must be on or after lastServiceDate',
  })
  nextServiceDueDate?: string;
}
