import { DriverStatus, LicenseCategory, BloodGroup } from '@transitops/shared-types';

export const DRIVER_COLLECTION = 'drivers';

export const DRIVER_SORT_FIELDS = [
  'fullName',
  'joiningDate',
  'safetyScore',
  'experienceYears',
  'createdAt',
] as const;

export type DriverSortField = (typeof DRIVER_SORT_FIELDS)[number];

export const DRIVER_DEFAULT_PAGE = 1;
export const DRIVER_DEFAULT_LIMIT = 10;
export const DRIVER_MAX_LIMIT = 100;

export const LICENSE_EXPIRING_DAYS = 30;

export const DRIVER_STATUS_VALUES = Object.values(DriverStatus);
export const LICENSE_CATEGORY_VALUES = Object.values(LicenseCategory);
export const BLOOD_GROUP_VALUES = Object.values(BloodGroup);

export const DRIVER_UNIQUE_FIELDS = [
  'employeeCode',
  'email',
  'phone',
  'licenseNumber',
] as const;

export type DriverUniqueField = (typeof DRIVER_UNIQUE_FIELDS)[number];
