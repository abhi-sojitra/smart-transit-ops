import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DriverStatus, LicenseCategory, BloodGroup, LicenseStatus } from '@transitops/shared-types';

export class DriverResponseDto {
  @ApiProperty({ example: '665f1a2b3c4d5e6f7a8b9c0d' })
  id!: string;

  @ApiProperty({ example: 'EMP-1001' })
  employeeCode!: string;

  @ApiProperty({ example: 'Maya' })
  firstName!: string;

  @ApiProperty({ example: 'Chen' })
  lastName!: string;

  @ApiProperty({ example: 'Maya Chen' })
  fullName!: string;

  @ApiProperty({ example: 'maya.chen@transitops.com' })
  email!: string;

  @ApiProperty({ example: '+919876543210' })
  phone!: string;

  @ApiPropertyOptional({ example: '+919876543211' })
  alternatePhone?: string;

  @ApiPropertyOptional({ example: '1990-05-12T00:00:00.000Z' })
  dateOfBirth?: string;

  @ApiProperty({ example: '2020-03-01T00:00:00.000Z' })
  joiningDate!: string;

  @ApiProperty({ example: 'DL-09-2020-0012345' })
  licenseNumber!: string;

  @ApiProperty({ enum: LicenseCategory })
  licenseCategory!: LicenseCategory;

  @ApiPropertyOptional({ example: '2020-02-15T00:00:00.000Z' })
  licenseIssueDate?: string;

  @ApiProperty({ example: '2028-02-15T00:00:00.000Z' })
  licenseExpiryDate!: string;

  @ApiProperty({ enum: LicenseStatus })
  licenseStatus!: LicenseStatus;

  @ApiProperty({ example: 5 })
  experienceYears!: number;

  @ApiPropertyOptional()
  address?: string;

  @ApiPropertyOptional()
  city?: string;

  @ApiPropertyOptional()
  state?: string;

  @ApiPropertyOptional()
  country?: string;

  @ApiPropertyOptional()
  postalCode?: string;

  @ApiPropertyOptional()
  emergencyName?: string;

  @ApiPropertyOptional()
  emergencyPhone?: string;

  @ApiPropertyOptional({ enum: BloodGroup })
  bloodGroup?: BloodGroup;

  @ApiPropertyOptional()
  photo?: string;

  @ApiProperty({ enum: DriverStatus })
  status!: DriverStatus;

  @ApiProperty({ example: 95 })
  safetyScore!: number;

  @ApiPropertyOptional()
  remarks?: string;

  @ApiProperty({ example: false })
  isDeleted!: boolean;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class DriverStatisticsResponseDto {
  @ApiProperty({ example: 20 })
  totalDrivers!: number;

  @ApiProperty({ example: 8 })
  available!: number;

  @ApiProperty({ example: 5 })
  onTrip!: number;

  @ApiProperty({ example: 4 })
  offDuty!: number;

  @ApiProperty({ example: 3 })
  suspended!: number;

  @ApiProperty({ example: 2 })
  licenseExpiring!: number;

  @ApiProperty({ example: 87.5 })
  averageSafetyScore!: number;
}

export class PaginatedDriversResponseDto {
  @ApiProperty({ type: [DriverResponseDto] })
  items!: DriverResponseDto[];

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
