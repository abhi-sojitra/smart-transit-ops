export enum VehicleStatus {
  AVAILABLE = 'AVAILABLE',
  ON_TRIP = 'ON_TRIP',
  MAINTENANCE = 'MAINTENANCE',
  RETIRED = 'RETIRED',
  ACTIVE = 'ACTIVE',
  IN_SERVICE = 'IN_SERVICE',
}

export enum DriverStatus {
  AVAILABLE = 'AVAILABLE',
  ON_TRIP = 'ON_TRIP',
  SUSPENDED = 'SUSPENDED',
  OFF_DUTY = 'OFF_DUTY',
}

export enum LicenseStatus {
  VALID = 'VALID',
  EXPIRING = 'EXPIRING',
  EXPIRED = 'EXPIRED',
}

export enum TripStatus {
  DRAFT = 'DRAFT',
  DISPATCHED = 'DISPATCHED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum MaintenanceStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export enum ExpenseStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum UserAccountStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}
