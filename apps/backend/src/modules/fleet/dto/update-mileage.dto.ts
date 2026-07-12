import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class UpdateMileageDto {
  @ApiProperty({
    example: 85210,
    minimum: 0,
    description: 'Current odometer reading in kilometers',
  })
  @IsNumber()
  @Min(0)
  mileage!: number;
}
