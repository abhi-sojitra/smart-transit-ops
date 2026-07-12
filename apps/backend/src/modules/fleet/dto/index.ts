import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  VehicleStatus,
  VehicleType,
  FuelType,
  ComplianceStatus,
  ServiceDueStatus,
} from '@transitops/shared-types';

export class VehicleResponseDto {
  @ApiProperty({ example: '665f1a2b3c4d5e6f7a8b9c0d' })
  id!: string;

  @ApiProperty({ example: 'VH-1001' })
  vehicleId!: string;

  @ApiProperty({ example: 'KA01AB1234' })
  registrationNumber!: string;

  @ApiPropertyOptional({ example: '1HGBH41JXMN109186' })
  vin?: string;

  @ApiProperty({ example: 'Tata' })
  make!: string;

  @ApiProperty({ example: 'Starbus Ultra' })
  model!: string;

  @ApiPropertyOptional({ example: 2022 })
  year?: number;

  @ApiProperty({ enum: VehicleType })
  vehicleType!: VehicleType;

  @ApiProperty({ enum: FuelType })
  fuelType!: FuelType;

  @ApiPropertyOptional({ example: 'White' })
  color?: string;

  @ApiPropertyOptional({ example: 45 })
  seatingCapacity?: number;

  @ApiProperty({ example: 500, description: 'Maximum load capacity in kilograms' })
  maxCapacity!: number;

  @ApiProperty({ example: 84210 })
  mileage!: number;

  @ApiPropertyOptional()
  purchaseDate?: string;

  @ApiProperty()
  registrationExpiryDate!: string;

  @ApiProperty()
  insuranceExpiryDate!: string;

  @ApiProperty()
  fitnessCertificateExpiryDate!: string;

  @ApiProperty({ enum: ComplianceStatus })
  registrationStatus!: ComplianceStatus;

  @ApiProperty({ enum: ComplianceStatus })
  insuranceStatus!: ComplianceStatus;

  @ApiProperty({ enum: ComplianceStatus })
  fitnessStatus!: ComplianceStatus;

  @ApiProperty({ enum: ServiceDueStatus })
  serviceDueStatus!: ServiceDueStatus;

  @ApiPropertyOptional()
  lastServiceDate?: string;

  @ApiPropertyOptional()
  nextServiceDueDate?: string;

  @ApiPropertyOptional()
  depotCity?: string;

  @ApiPropertyOptional()
  depotState?: string;

  @ApiPropertyOptional()
  country?: string;

  @ApiProperty({ enum: VehicleStatus })
  status!: VehicleStatus;

  @ApiPropertyOptional()
  remarks?: string;

  @ApiProperty({ example: false })
  isDeleted!: boolean;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class VehicleStatisticsResponseDto {
  @ApiProperty({ example: 20 })
  totalVehicles!: number;

  @ApiProperty({ example: 8 })
  available!: number;

  @ApiProperty({ example: 5 })
  onTrip!: number;

  @ApiProperty({ example: 4 })
  maintenance!: number;

  @ApiProperty({ example: 3 })
  retired!: number;

  @ApiProperty({ example: 2 })
  insuranceExpiring!: number;

  @ApiProperty({ example: 1 })
  fitnessExpiring!: number;

  @ApiProperty({ example: 3 })
  serviceDueSoon!: number;

  @ApiProperty({ example: 87420.5 })
  averageMileage!: number;
}

export class PaginatedVehiclesResponseDto {
  @ApiProperty({ type: [VehicleResponseDto] })
  items!: VehicleResponseDto[];

  @ApiProperty({
    example: { page: 1, limit: 10, total: 20, totalPages: 2 },
  })
  meta!: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
