import {
  DriverStatus,
  ExpenseStatus,
  LicenseStatus,
  MaintenanceStatus,
  RoleCode,
  TripStatus,
  UserAccountStatus,
  VehicleStatus,
  type Driver,
  type FuelExpense,
  type MaintenanceRecord,
  type User,
  type Vehicle,
} from '@transitops/shared-types';

export const mockVehicles: Vehicle[] = [
  {
    id: '1',
    vehicleId: 'VH-1001',
    model: 'Freightliner Cascadia',
    year: 2022,
    status: VehicleStatus.ACTIVE,
    lastService: '2026-06-12',
    mileage: 84210,
    maxCapacity: 18000,
  },
  {
    id: '2',
    vehicleId: 'VH-1002',
    model: 'Volvo VNL 860',
    year: 2021,
    status: VehicleStatus.MAINTENANCE,
    lastService: '2026-07-01',
    mileage: 120430,
    maxCapacity: 20000,
  },
  {
    id: '3',
    vehicleId: 'VH-1003',
    model: 'Kenworth T680',
    year: 2023,
    status: VehicleStatus.ON_TRIP,
    lastService: '2026-05-20',
    mileage: 45120,
    maxCapacity: 17000,
  },
  {
    id: '4',
    vehicleId: 'VH-1004',
    model: 'Peterbilt 579',
    year: 2020,
    status: VehicleStatus.AVAILABLE,
    lastService: '2026-04-18',
    mileage: 156890,
    maxCapacity: 19000,
  },
];

export const mockDrivers: Driver[] = [
  {
    id: '1',
    name: 'Maya Chen',
    employeeId: 'DR-204',
    licenseType: 'CDL-A',
    licenseStatus: LicenseStatus.VALID,
    lastTrip: '2026-07-10',
    safetyScore: 96,
    status: DriverStatus.AVAILABLE,
  },
  {
    id: '2',
    name: 'Jordan Lee',
    employeeId: 'DR-188',
    licenseType: 'CDL-A',
    licenseStatus: LicenseStatus.EXPIRING,
    lastTrip: '2026-07-11',
    safetyScore: 88,
    status: DriverStatus.ON_TRIP,
  },
  {
    id: '3',
    name: 'Sam Okonkwo',
    employeeId: 'DR-155',
    licenseType: 'CDL-B',
    licenseStatus: LicenseStatus.VALID,
    lastTrip: '2026-07-08',
    safetyScore: 91,
    status: DriverStatus.OFF_DUTY,
  },
];

export const mockMaintenance: MaintenanceRecord[] = [
  {
    id: '1',
    vehicleId: 'VH-1002',
    serviceType: 'Oil Change',
    status: MaintenanceStatus.IN_PROGRESS,
    date: '2026-07-12',
    cost: 420,
  },
  {
    id: '2',
    vehicleId: 'VH-1001',
    serviceType: 'Tire Rotation',
    status: MaintenanceStatus.SCHEDULED,
    date: '2026-07-15',
    cost: 280,
  },
  {
    id: '3',
    vehicleId: 'VH-1004',
    serviceType: 'Brake Inspection',
    status: MaintenanceStatus.COMPLETED,
    date: '2026-07-05',
    cost: 650,
  },
];

export const mockExpenses: FuelExpense[] = [
  {
    id: '1',
    date: '2026-07-11',
    vehicleId: 'VH-1003',
    type: 'FUEL',
    amount: 312.5,
    liters: 180,
    status: ExpenseStatus.APPROVED,
  },
  {
    id: '2',
    date: '2026-07-10',
    vehicleId: 'VH-1001',
    type: 'FUEL',
    amount: 289.1,
    liters: 165,
    status: ExpenseStatus.PENDING,
  },
  {
    id: '3',
    date: '2026-07-09',
    vehicleId: 'VH-1004',
    type: 'OPERATING',
    amount: 95,
    status: ExpenseStatus.APPROVED,
  },
];

export const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@transitops.com',
    firstName: 'System',
    lastName: 'Admin',
    roles: [RoleCode.SUPER_ADMIN],
    status: UserAccountStatus.ACTIVE,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
  {
    id: '2',
    email: 'dispatcher@transitops.com',
    firstName: 'Alex',
    lastName: 'Rivera',
    roles: [RoleCode.DISPATCHER],
    status: UserAccountStatus.ACTIVE,
    createdAt: '2026-02-12',
    updatedAt: '2026-02-12',
  },
];

export const mockActivities = [
  { id: '1', message: 'VH-1003 departed Chicago → Detroit', time: '12 min ago', status: TripStatus.DISPATCHED },
  { id: '2', message: 'Maintenance started on VH-1002', time: '34 min ago', status: MaintenanceStatus.IN_PROGRESS },
  { id: '3', message: 'Driver Maya Chen completed trip TR-8821', time: '1 hr ago', status: TripStatus.COMPLETED },
  { id: '4', message: 'Fuel expense submitted for VH-1001', time: '2 hr ago', status: ExpenseStatus.PENDING },
];

export const fleetStatusData = [
  { name: 'Available', value: 32 },
  { name: 'On Trip', value: 28 },
  { name: 'Maintenance', value: 12 },
  { name: 'Retired', value: 5 },
];

export const tripVolumeData = [
  { month: 'Jan', trips: 120 },
  { month: 'Feb', trips: 142 },
  { month: 'Mar', trips: 138 },
  { month: 'Apr', trips: 160 },
  { month: 'May', trips: 175 },
  { month: 'Jun', trips: 190 },
];

export const fuelConsumptionData = [
  { month: 'Jan', liters: 4200 },
  { month: 'Feb', liters: 3900 },
  { month: 'Mar', liters: 4500 },
  { month: 'Apr', liters: 4100 },
  { month: 'May', liters: 4700 },
  { month: 'Jun', liters: 4400 },
];
