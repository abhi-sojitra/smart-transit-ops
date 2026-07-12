import type { DriverStatus, LicenseStatus } from './status';
import type { PaginationMeta } from './api';

export enum LicenseCategory {
  LMV = 'LMV',
  HMV = 'HMV',
  CDL_A = 'CDL_A',
  CDL_B = 'CDL_B',
  CDL_C = 'CDL_C',
  MCWG = 'MCWG',
  OTHER = 'OTHER',
}

export enum BloodGroup {
  A_POSITIVE = 'A+',
  A_NEGATIVE = 'A-',
  B_POSITIVE = 'B+',
  B_NEGATIVE = 'B-',
  AB_POSITIVE = 'AB+',
  AB_NEGATIVE = 'AB-',
  O_POSITIVE = 'O+',
  O_NEGATIVE = 'O-',
  UNKNOWN = 'UNKNOWN',
}

export interface DriverDocumentFile {
  name: string;
  url: string;
  type?: string;
  uploadedAt?: string;
}

export interface Driver {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  dateOfBirth?: string;
  joiningDate: string;
  licenseNumber: string;
  licenseCategory: LicenseCategory;
  licenseIssueDate?: string;
  licenseExpiryDate: string;
  licenseStatus?: LicenseStatus;
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
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  /** @deprecated Prefer fullName — kept for scaffold mock compatibility */
  name?: string;
  /** @deprecated Prefer employeeCode */
  employeeId?: string;
  /** @deprecated Prefer licenseCategory */
  licenseType?: string;
  lastTrip?: string;
}

export interface DriverStatistics {
  totalDrivers: number;
  available: number;
  onTrip: number;
  offDuty: number;
  suspended: number;
  licenseExpiring: number;
  averageSafetyScore: number;
}

export interface DriverListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: DriverStatus;
  licenseCategory?: LicenseCategory;
  city?: string;
  state?: string;
  experienceMin?: number;
  experienceMax?: number;
  sortBy?: 'fullName' | 'joiningDate' | 'safetyScore' | 'experienceYears' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface DriverListResult {
  items: Driver[];
  meta: PaginationMeta;
}
