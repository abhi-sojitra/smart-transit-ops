import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { DriverStatus } from '@transitops/shared-types';

export class UpdateDriverStatusDto {
  @ApiProperty({
    enum: DriverStatus,
    example: DriverStatus.AVAILABLE,
    description: 'New driver status. Expired or suspended drivers cannot become Available.',
  })
  @IsEnum(DriverStatus)
  status!: DriverStatus;
}
