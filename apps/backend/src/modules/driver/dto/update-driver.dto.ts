import { PartialType, OmitType, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';
import { CreateDriverDto } from './create-driver.dto';
import { IsDateAfter } from '../validators/driver.validators';

export class UpdateDriverDto extends PartialType(
  OmitType(CreateDriverDto, ['licenseExpiryDate'] as const),
) {
  @ApiPropertyOptional({ example: '2028-02-15' })
  @IsOptional()
  @IsDateString()
  @IsDateAfter('licenseIssueDate')
  licenseExpiryDate?: string;
}
