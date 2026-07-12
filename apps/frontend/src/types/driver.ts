import {
  BloodGroup,
  DriverStatus,
  LicenseCategory,
  type Driver,
  type DriverListQuery,
  type DriverStatistics,
  type PaginationMeta,
} from '@transitops/shared-types';

export type {
  Driver,
  DriverListQuery,
  DriverStatistics,
  PaginationMeta,
};

export { BloodGroup, DriverStatus, LicenseCategory };

export interface DriverListResponse {
  items: Driver[];
  meta: PaginationMeta;
}

export interface DriverFormValues {
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  dateOfBirth?: string;
  joiningDate: string;
  licenseNumber: string;
  licenseCategory: LicenseCategory;
  licenseIssueDate?: string;
  licenseExpiryDate: string;
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
  remarks?: string;
  status?: DriverStatus;
  safetyScore?: number;
}

export interface DriverFiltersState {
  search: string;
  status: DriverStatus | 'ALL';
  licenseCategory: LicenseCategory | 'ALL';
  city: string;
  state: string;
  experienceMin: string;
  experienceMax: string;
  sortBy: NonNullable<DriverListQuery['sortBy']>;
  sortOrder: 'asc' | 'desc';
  page: number;
  limit: number;
}
