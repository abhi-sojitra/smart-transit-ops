import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { VehicleStatus } from '@transitops/shared-types';

export class UpdateVehicleStatusDto {
  @ApiProperty({
    enum: VehicleStatus,
    example: VehicleStatus.AVAILABLE,
    description:
      'New vehicle status. Retired or non-compliant vehicles cannot become Available.',
  })
  @IsEnum(VehicleStatus)
  status!: VehicleStatus;
}
