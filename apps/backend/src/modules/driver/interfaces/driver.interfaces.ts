import { DriverStatus, LicenseCategory, BloodGroup } from '@transitops/shared-types';
import type { DriverSortField } from '../constants/driver.constants';

export interface DriverDocumentFile {
  name: string;
  url: string;
  type?: string;
  uploadedAt?: Date;
}

export interface DriverEntity {
  employeeCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  dateOfBirth?: Date;
  joiningDate: Date;
  licenseNumber: string;
  licenseCategory: LicenseCategory;
  licenseIssueDate?: Date;
  licenseExpiryDate: Date;
  experienceYears: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  emergencyName?: string;
  emergencyPhone?: string;
  bloodGroup?: BloodGroup;
  photo?: string;
  documents?: DriverDocumentFile[];
  status: DriverStatus;
  safetyScore: number;
  remarks?: string;
  isDeleted: boolean;
  createdBy?: string;
  updatedBy?: string;
  deletedBy?: string;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface DriverListFilters {
  search?: string;
  status?: DriverStatus;
  licenseCategory?: LicenseCategory;
  city?: string;
  state?: string;
  experienceMin?: number;
  experienceMax?: number;
}

export interface DriverListOptions {
  page: number;
  limit: number;
  sortBy: DriverSortField;
  sortOrder: 'asc' | 'desc';
  filters: DriverListFilters;
}

export interface DriverListResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DriverStatisticsResult {
  totalDrivers: number;
  available: number;
  onTrip: number;
  offDuty: number;
  suspended: number;
  licenseExpiring: number;
  averageSafetyScore: number;
}

export interface SoftDeletePayload {
  deletedBy?: string;
  deletedAt: Date;
}
