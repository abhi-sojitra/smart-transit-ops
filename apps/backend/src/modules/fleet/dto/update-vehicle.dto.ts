import { PartialType, OmitType, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';
import { CreateVehicleDto } from './create-vehicle.dto';
import { IsDateAfter } from '../validators/fleet.validators';

export class UpdateVehicleDto extends PartialType(
  OmitType(CreateVehicleDto, [
    'registrationExpiryDate',
    'insuranceExpiryDate',
    'fitnessCertificateExpiryDate',
  ] as const),
) {
  @ApiPropertyOptional({ example: '2028-06-15' })
  @IsOptional()
  @IsDateString()
  registrationExpiryDate?: string;

  @ApiPropertyOptional({ example: '2027-12-31' })
  @IsOptional()
  @IsDateString()
  insuranceExpiryDate?: string;

  @ApiPropertyOptional({ example: '2027-09-30' })
  @IsOptional()
  @IsDateString()
  fitnessCertificateExpiryDate?: string;

  @ApiPropertyOptional({ example: '2026-12-12' })
  @IsOptional()
  @IsDateString()
  @IsDateAfter('lastServiceDate')
  nextServiceDueDate?: string;
}
