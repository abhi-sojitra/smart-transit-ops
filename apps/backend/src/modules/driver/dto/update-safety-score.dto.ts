import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Max, Min } from 'class-validator';

export class UpdateSafetyScoreDto {
  @ApiProperty({
    example: 92,
    minimum: 0,
    maximum: 100,
    description: 'Safety score between 0 and 100',
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  safetyScore!: number;
}
