import { LicenseStatus } from '@transitops/shared-types';
import { LICENSE_EXPIRING_DAYS } from '../constants/driver.constants';
import { DriverDocument } from '../schema/driver.schema';

function toIso(value?: Date | null): string | undefined {
  if (!value) return undefined;
  return value.toISOString();
}

export function computeLicenseStatus(licenseExpiryDate: Date, now = new Date()): LicenseStatus {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(licenseExpiryDate);
  expiry.setHours(0, 0, 0, 0);

  if (expiry.getTime() <= today.getTime()) {
    return LicenseStatus.EXPIRED;
  }

  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() + LICENSE_EXPIRING_DAYS);
  if (expiry.getTime() <= cutoff.getTime()) {
    return LicenseStatus.EXPIRING;
  }

  return LicenseStatus.VALID;
}

export function isLicenseExpired(licenseExpiryDate: Date, now = new Date()): boolean {
  return computeLicenseStatus(licenseExpiryDate, now) === LicenseStatus.EXPIRED;
}

export function mapDriverToResponse(doc: DriverDocument) {
  return {
    id: String(doc._id),
    employeeCode: doc.employeeCode,
    firstName: doc.firstName,
    lastName: doc.lastName,
    fullName: doc.fullName,
    email: doc.email,
    phone: doc.phone,
    alternatePhone: doc.alternatePhone,
    dateOfBirth: toIso(doc.dateOfBirth),
    joiningDate: toIso(doc.joiningDate)!,
    licenseNumber: doc.licenseNumber,
    licenseCategory: doc.licenseCategory,
    licenseIssueDate: toIso(doc.licenseIssueDate),
    licenseExpiryDate: toIso(doc.licenseExpiryDate)!,
    licenseStatus: computeLicenseStatus(doc.licenseExpiryDate),
    experienceYears: doc.experienceYears,
    address: doc.address,
    city: doc.city,
    state: doc.state,
    country: doc.country,
    postalCode: doc.postalCode,
    emergencyName: doc.emergencyName,
    emergencyPhone: doc.emergencyPhone,
    bloodGroup: doc.bloodGroup,
    photo: doc.photo,
    documents: (doc.documents ?? []).map((d) => ({
      name: d.name,
      url: d.url,
      type: d.type,
      uploadedAt: toIso(d.uploadedAt),
    })),
    status: doc.status,
    safetyScore: doc.safetyScore,
    remarks: doc.remarks,
    isDeleted: doc.isDeleted,
    createdBy: doc.createdBy,
    updatedBy: doc.updatedBy,
    deletedBy: doc.deletedBy,
    createdAt: toIso(doc.createdAt)!,
    updatedAt: toIso(doc.updatedAt)!,
    deletedAt: toIso(doc.deletedAt),
  };
}
