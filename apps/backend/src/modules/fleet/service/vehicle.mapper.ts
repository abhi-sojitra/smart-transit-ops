import { ComplianceStatus, ServiceDueStatus } from '@transitops/shared-types';
import {
  COMPLIANCE_EXPIRING_DAYS,
  SERVICE_DUE_SOON_DAYS,
} from '../constants/fleet.constants';
import { VehicleDocument } from '../schema/vehicle.schema';

function toIso(value?: Date | null): string | undefined {
  if (!value) return undefined;
  return value.toISOString();
}

export function computeComplianceStatus(expiryDate: Date, now = new Date()): ComplianceStatus {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);

  if (expiry.getTime() <= today.getTime()) {
    return ComplianceStatus.EXPIRED;
  }

  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() + COMPLIANCE_EXPIRING_DAYS);
  if (expiry.getTime() <= cutoff.getTime()) {
    return ComplianceStatus.EXPIRING;
  }

  return ComplianceStatus.VALID;
}

export function isComplianceExpired(expiryDate: Date, now = new Date()): boolean {
  return computeComplianceStatus(expiryDate, now) === ComplianceStatus.EXPIRED;
}

export function computeServiceDueStatus(
  nextServiceDueDate?: Date | null,
  now = new Date(),
): ServiceDueStatus {
  if (!nextServiceDueDate) return ServiceDueStatus.OK;

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const due = new Date(nextServiceDueDate);
  due.setHours(0, 0, 0, 0);

  if (due.getTime() < today.getTime()) {
    return ServiceDueStatus.OVERDUE;
  }

  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() + SERVICE_DUE_SOON_DAYS);
  if (due.getTime() <= cutoff.getTime()) {
    return ServiceDueStatus.DUE_SOON;
  }

  return ServiceDueStatus.OK;
}

export function hasExpiredCompliance(doc: VehicleDocument, now = new Date()): boolean {
  return (
    isComplianceExpired(doc.registrationExpiryDate, now) ||
    isComplianceExpired(doc.insuranceExpiryDate, now) ||
    isComplianceExpired(doc.fitnessCertificateExpiryDate, now)
  );
}

export function mapVehicleToResponse(doc: VehicleDocument) {
  return {
    id: String(doc._id),
    vehicleId: doc.vehicleId,
    registrationNumber: doc.registrationNumber,
    vin: doc.vin,
    make: doc.make,
    model: doc.model,
    year: doc.year,
    vehicleType: doc.vehicleType,
    fuelType: doc.fuelType,
    color: doc.color,
    seatingCapacity: doc.seatingCapacity,
    mileage: doc.mileage,
    purchaseDate: toIso(doc.purchaseDate),
    registrationExpiryDate: toIso(doc.registrationExpiryDate)!,
    insuranceExpiryDate: toIso(doc.insuranceExpiryDate)!,
    fitnessCertificateExpiryDate: toIso(doc.fitnessCertificateExpiryDate)!,
    registrationStatus: computeComplianceStatus(doc.registrationExpiryDate),
    insuranceStatus: computeComplianceStatus(doc.insuranceExpiryDate),
    fitnessStatus: computeComplianceStatus(doc.fitnessCertificateExpiryDate),
    serviceDueStatus: computeServiceDueStatus(doc.nextServiceDueDate),
    lastServiceDate: toIso(doc.lastServiceDate),
    nextServiceDueDate: toIso(doc.nextServiceDueDate),
    depotCity: doc.depotCity,
    depotState: doc.depotState,
    country: doc.country,
    photo: doc.photo,
    documents: (doc.documents ?? []).map((d) => ({
      name: d.name,
      url: d.url,
      type: d.type,
      uploadedAt: toIso(d.uploadedAt),
    })),
    status: doc.status,
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
