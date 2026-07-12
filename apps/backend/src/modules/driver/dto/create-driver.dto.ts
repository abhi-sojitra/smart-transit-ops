import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsNumber,
  IsDateString,
  IsArray,
  IsUrl,
  Min,
  Max,
  MinLength,
  MaxLength,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DriverStatus, LicenseCategory, BloodGroup } from '@transitops/shared-types';
import { IsDateAfter, IsFutureDate } from '../validators/driver.validators';

export class DriverDocumentDto {
  @ApiProperty({ example: 'License Scan.pdf' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty({ example: 'https://cdn.example.com/docs/license.pdf' })
  @IsUrl()
  url!: string;

  @ApiPropertyOptional({ example: 'application/pdf' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ example: '2026-01-15T10:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  uploadedAt?: string;
}

export class CreateDriverDto {
  @ApiProperty({ example: 'EMP-1001' })
  @IsString()
  @MinLength(2)
  @MaxLength(32)
  @Matches(/^[A-Za-z0-9-_]+$/, {
    message: 'employeeCode may only contain letters, numbers, hyphens, and underscores',
  })
  employeeCode!: string;

  @ApiProperty({ example: 'Maya' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  firstName!: string;

  @ApiProperty({ example: 'Chen' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  lastName!: string;

  @ApiProperty({ example: 'maya.chen@transitops.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '+919876543210' })
  @IsString()
  @Matches(/^\+?[0-9]{10,15}$/, { message: 'phone must be a valid phone number' })
  phone!: string;

  @ApiPropertyOptional({ example: '+919876543211' })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9]{10,15}$/, { message: 'alternatePhone must be a valid phone number' })
  alternatePhone?: string;

  @ApiPropertyOptional({ example: '1990-05-12' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiProperty({ example: '2020-03-01' })
  @IsDateString()
  joiningDate!: string;

  @ApiProperty({ example: 'DL-09-2020-0012345' })
  @IsString()
  @MinLength(5)
  @MaxLength(40)
  licenseNumber!: string;

  @ApiProperty({ enum: LicenseCategory, example: LicenseCategory.CDL_A })
  @IsEnum(LicenseCategory)
  licenseCategory!: LicenseCategory;

  @ApiPropertyOptional({ example: '2020-02-15' })
  @IsOptional()
  @IsDateString()
  licenseIssueDate?: string;

  @ApiProperty({ example: '2028-02-15' })
  @IsDateString()
  @IsFutureDate({ message: 'licenseExpiryDate must be greater than today' })
  @IsDateAfter('licenseIssueDate')
  licenseExpiryDate!: string;

  @ApiProperty({ example: 5, minimum: 0 })
  @IsNumber()
  @Min(0)
  @Max(60)
  experienceYears!: number;

  @ApiPropertyOptional({ example: '12 MG Road' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  address?: string;

  @ApiPropertyOptional({ example: 'Bengaluru' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string;

  @ApiPropertyOptional({ example: 'Karnataka' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  state?: string;

  @ApiPropertyOptional({ example: 'India' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  country?: string;

  @ApiPropertyOptional({ example: '560001' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @ApiPropertyOptional({ example: 'Li Chen' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  emergencyName?: string;

  @ApiPropertyOptional({ example: '+919812345678' })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9]{10,15}$/, { message: 'emergencyPhone must be a valid phone number' })
  emergencyPhone?: string;

  @ApiPropertyOptional({ enum: BloodGroup, example: BloodGroup.O_POSITIVE })
  @IsOptional()
  @IsEnum(BloodGroup)
  bloodGroup?: BloodGroup;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/photos/maya.jpg' })
  @IsOptional()
  @IsString()
  photo?: string;

  @ApiPropertyOptional({ type: [DriverDocumentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DriverDocumentDto)
  documents?: DriverDocumentDto[];

  @ApiPropertyOptional({ enum: DriverStatus, example: DriverStatus.AVAILABLE })
  @IsOptional()
  @IsEnum(DriverStatus)
  status?: DriverStatus;

  @ApiPropertyOptional({ example: 95, minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  safetyScore?: number;

  @ApiPropertyOptional({ example: 'Preferred for long-haul routes' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  remarks?: string;
}
