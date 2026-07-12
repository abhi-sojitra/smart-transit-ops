import { BloodGroup, DriverStatus, LicenseCategory, LicenseStatus } from '@transitops/shared-types';
import { LICENSE_EXPIRING_DAYS } from '../constants/driver.constants';
import { DriverDocument } from '../schema/driver.schema';

function toPlain(doc: DriverDocument): Record<string, unknown> {
  if (doc && typeof doc.toObject === 'function') {
    return doc.toObject({ flattenMaps: true }) as Record<string, unknown>;
  }
  return doc as unknown as Record<string, unknown>;
}

function asString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function toIso(value?: Date | string | null): string | undefined {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

function resolveLicenseExpiry(raw: Record<string, unknown>): Date | undefined {
  const value = raw.licenseExpiryDate ?? raw.licenseExpiry;
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function computeLicenseStatus(
  licenseExpiryDate: Date | undefined,
  now = new Date(),
): LicenseStatus {
  if (!licenseExpiryDate || Number.isNaN(licenseExpiryDate.getTime())) {
    return LicenseStatus.VALID;
  }

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

function resolveFullName(raw: Record<string, unknown>): string {
  const fullName = asString(raw.fullName);
  if (fullName) return fullName;
  const composed = [asString(raw.firstName), asString(raw.lastName)].filter(Boolean).join(' ');
  if (composed) return composed;
  return asString(raw.name) ?? 'Unknown driver';
}

function resolveEnum<T extends string>(
  value: unknown,
  values: readonly T[],
  fallback?: T,
): T | undefined {
  const asValue = asString(value);
  if (!asValue) return fallback;
  return (values as readonly string[]).includes(asValue) ? (asValue as T) : fallback;
}

function resolveLicenseCategory(raw: Record<string, unknown>): LicenseCategory {
  return (
    resolveEnum(
      raw.licenseCategory ?? raw.licenseType,
      Object.values(LicenseCategory),
      LicenseCategory.OTHER,
    ) ?? LicenseCategory.OTHER
  );
}

export function mapDriverToResponse(doc: DriverDocument) {
  const raw = toPlain(doc);
  const licenseExpiryDate = resolveLicenseExpiry(raw);
  const documents = Array.isArray(raw.documents) ? raw.documents : [];
  const storedLicenseStatus = resolveEnum(raw.licenseStatus, Object.values(LicenseStatus));

  return {
    id: String(raw._id ?? doc._id),
    employeeCode: asString(raw.employeeCode) ?? asString(raw.employeeId) ?? '—',
    firstName: asString(raw.firstName) ?? '',
    lastName: asString(raw.lastName) ?? '',
    fullName: resolveFullName(raw),
    email: asString(raw.email) ?? '',
    phone: asString(raw.phone) ?? '',
    alternatePhone: asString(raw.alternatePhone),
    dateOfBirth: toIso(raw.dateOfBirth as Date | string | undefined),
    joiningDate: toIso(raw.joiningDate as Date | string | undefined) ?? '',
    licenseNumber: asString(raw.licenseNumber) ?? '',
    licenseCategory: resolveLicenseCategory(raw),
    licenseIssueDate: toIso(raw.licenseIssueDate as Date | string | undefined),
    licenseExpiryDate: toIso(licenseExpiryDate) ?? '',
    licenseStatus: storedLicenseStatus ?? computeLicenseStatus(licenseExpiryDate),
    experienceYears: typeof raw.experienceYears === 'number' ? raw.experienceYears : 0,
    address: asString(raw.address),
    city: asString(raw.city),
    state: asString(raw.state),
    country: asString(raw.country) ?? 'India',
    postalCode: asString(raw.postalCode),
    emergencyName: asString(raw.emergencyName),
    emergencyPhone: asString(raw.emergencyPhone),
    bloodGroup: resolveEnum(raw.bloodGroup, Object.values(BloodGroup), BloodGroup.UNKNOWN),
    photo: asString(raw.photo),
    documents: documents.map((entry) => {
      const d = entry as Record<string, unknown>;
      return {
        name: asString(d.name) ?? '',
        url: asString(d.url) ?? '',
        type: asString(d.type),
        uploadedAt: toIso(d.uploadedAt as Date | string | undefined),
      };
    }),
    status: resolveEnum(raw.status, Object.values(DriverStatus), DriverStatus.AVAILABLE)!,
    safetyScore: typeof raw.safetyScore === 'number' ? raw.safetyScore : 0,
    remarks: asString(raw.remarks),
    isDeleted: Boolean(raw.isDeleted),
    createdBy: asString(raw.createdBy),
    updatedBy: asString(raw.updatedBy),
    deletedBy: asString(raw.deletedBy),
    createdAt: toIso(raw.createdAt as Date | string | undefined) ?? '',
    updatedAt: toIso(raw.updatedAt as Date | string | undefined) ?? '',
    deletedAt: toIso(raw.deletedAt as Date | string | undefined),
  };
}
