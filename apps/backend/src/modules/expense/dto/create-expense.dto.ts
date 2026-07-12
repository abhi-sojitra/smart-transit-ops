import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ExpenseStatus, ExpenseType } from '@transitops/shared-types';

export class CreateExpenseDto {
  @ApiProperty({ example: 'VH-1001' })
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

  @ApiProperty({ enum: ExpenseType, example: ExpenseType.TOLL })
  @IsEnum(ExpenseType)
  expenseType!: ExpenseType;

  @ApiProperty({ example: 'Highway Toll - I-95' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({ example: 'Toll payment at checkpoint 12' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 25.5 })
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @ApiProperty({ example: '2026-03-15' })
  @IsString()
  @IsNotEmpty()
  expenseDate!: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/receipts/expense-001.jpg' })
  @IsOptional()
  @IsString()
  receiptImage?: string;

  @ApiPropertyOptional({ enum: ExpenseStatus, default: ExpenseStatus.PENDING })
  @IsOptional()
  @IsEnum(ExpenseStatus)
  status?: ExpenseStatus;

  @ApiPropertyOptional({ example: 'Submitted by driver' })
  @IsOptional()
  @IsString()
  notes?: string;
}
