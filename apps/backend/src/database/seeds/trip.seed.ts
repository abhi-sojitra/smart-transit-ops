import { Types } from 'mongoose';
import {
  CargoType,
  DriverStatus,
  LicenseStatus,
  MaintenanceStatus,
  TripStatus,
  VehicleStatus,
} from '@transitops/shared-types';
import { VehicleSchema } from '../../modules/vehicle/schema/vehicle.schema';
import { DriverSchema } from '../../modules/driver/schema/driver.schema';
import { MaintenanceSchema } from '../../modules/maintenance/schema/maintenance.schema';
import { TripSchema } from '../../modules/trip/schema/trip.schema';

const CITIES = [
  ['Chicago, IL', 'Detroit, MI'],
  ['Dallas, TX', 'Houston, TX'],
  ['Atlanta, GA', 'Miami, FL'],
  ['Seattle, WA', 'Portland, OR'],
  ['Denver, CO', 'Phoenix, AZ'],
  ['New York, NY', 'Boston, MA'],
  ['Los Angeles, CA', 'San Diego, CA'],
  ['Nashville, TN', 'Memphis, TN'],
];

const CARGO = [
  { name: 'Electronics', type: CargoType.FRAGILE, weight: 8000 },
  { name: 'Produce', type: CargoType.PERISHABLE, weight: 12000 },
  { name: 'Steel Coils', type: CargoType.BULK, weight: 18000 },
  { name: 'Chemicals', type: CargoType.HAZARDOUS, weight: 9000 },
  { name: 'Furniture', type: CargoType.GENERAL, weight: 7000 },
  { name: 'Auto Parts', type: CargoType.GENERAL, weight: 11000 },
];

const TRIP_STATUSES: TripStatus[] = [
  TripStatus.DRAFT,
  TripStatus.DISPATCHED,
  TripStatus.IN_PROGRESS,
  TripStatus.COMPLETED,
  TripStatus.CANCELLED,
];

export async function seedTripDispatcherData(mongoose: typeof import('mongoose')) {
  const VehicleModel = mongoose.models.Vehicle || mongoose.model('Vehicle', VehicleSchema);
  const DriverModel = mongoose.models.Driver || mongoose.model('Driver', DriverSchema);
  const MaintenanceModel =
    mongoose.models.Maintenance || mongoose.model('Maintenance', MaintenanceSchema);
  const TripModel = mongoose.models.Trip || mongoose.model('Trip', TripSchema);

  console.log('Seeding vehicles...');
  await Promise.all([
    TripModel.deleteMany({}),
    MaintenanceModel.deleteMany({}),
    VehicleModel.deleteMany({}),
    DriverModel.deleteMany({}),
  ]);

  // Drop legacy unique indexes from earlier module drafts (null collisions).
  await Promise.allSettled([
    VehicleModel.collection.dropIndexes(),
    DriverModel.collection.dropIndexes(),
  ]);

  const vehicles = [];
  for (let i = 1; i <= 12; i++) {
    const status =
      i === 2
        ? VehicleStatus.MAINTENANCE
        : i === 3
          ? VehicleStatus.ON_TRIP
          : i === 12
            ? VehicleStatus.RETIRED
            : VehicleStatus.AVAILABLE;
    const doc = await VehicleModel.create({
      vehicleId: `VH-${1000 + i}`,
      vehicleNumber: `VH-${1000 + i}`,
      registrationNumber: `REG-${1000 + i}`,
      make: ['Freightliner', 'Volvo', 'Kenworth', 'Peterbilt'][i % 4],
      model: `Model-${i}`,
      year: 2019 + (i % 6),
      type: 'Tractor',
      status,
      maxCapacity: 15000 + i * 500,
      mileage: 40000 + i * 3500,
      isDeleted: false,
    });
    vehicles.push(doc);
  }

  console.log('Seeding drivers...');
  const drivers = [];
  const names = [
    ['Maya', 'Chen'],
    ['Jordan', 'Lee'],
    ['Sam', 'Okonkwo'],
    ['Ava', 'Patel'],
    ['Noah', 'Kim'],
    ['Emma', 'Garcia'],
    ['Liam', 'Nguyen'],
    ['Olivia', 'Brown'],
  ];
  for (let i = 0; i < names.length; i++) {
    const [firstName, lastName] = names[i];
    const status =
      i === 1 ? DriverStatus.ON_TRIP : i === 5 ? DriverStatus.SUSPENDED : DriverStatus.AVAILABLE;
    const licenseStatus = i === 6 ? LicenseStatus.EXPIRED : LicenseStatus.VALID;
    const doc = await DriverModel.create({
      firstName,
      lastName,
      employeeId: `DR-${200 + i}`,
      employeeCode: `DR-${200 + i}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@transitops.com`,
      licenseType: 'CDL-A',
      licenseNumber: `LIC-${2000 + i}`,
      licenseExpiry: new Date(Date.UTC(2027, i % 12, 15)),
      licenseStatus,
      safetyScore: 80 + (i % 20),
      status,
      isDeleted: false,
    });
    drivers.push(doc);
  }

  const maintenanceVehicle = vehicles.find((v) => v.status === VehicleStatus.MAINTENANCE);
  if (maintenanceVehicle) {
    await MaintenanceModel.create({
      vehicleId: maintenanceVehicle._id,
      serviceType: 'Brake Overhaul',
      status: MaintenanceStatus.IN_PROGRESS,
      date: new Date(),
      cost: 1200,
      notes: 'Seeded active maintenance',
      isDeleted: false,
    });
  }

  console.log('Seeding 50 trips...');
  const availableVehicles = vehicles.filter((v) => v.status === VehicleStatus.AVAILABLE);
  const availableDrivers = drivers.filter((d) => d.status === DriverStatus.AVAILABLE);

  for (let i = 1; i <= 50; i++) {
    const tripNumber = `TR-${String(i).padStart(4, '0')}`;
    const status = TRIP_STATUSES[i % TRIP_STATUSES.length];
    const [source, destination] = CITIES[i % CITIES.length];
    const cargo = CARGO[i % CARGO.length];
    const vehicle = availableVehicles[i % availableVehicles.length] ?? vehicles[0];
    const driver = availableDrivers[i % availableDrivers.length] ?? drivers[0];
    const start = new Date();
    start.setDate(start.getDate() - (50 - i));
    const end = new Date(start);
    end.setHours(end.getHours() + 8 + (i % 5));

    const payload: Record<string, unknown> = {
      tripNumber,
      source,
      destination,
      vehicleId: vehicle._id as Types.ObjectId,
      driverId: driver._id as Types.ObjectId,
      cargoName: cargo.name,
      cargoWeight: cargo.weight,
      cargoType: cargo.type,
      plannedDistance: 200 + i * 12,
      plannedStartDate: start,
      plannedEndDate: end,
      estimatedRevenue: 1500 + i * 45,
      status,
      notes: `Seeded trip ${tripNumber}`,
      isDeleted: false,
      tripDocuments: [],
    };

    if (status === TripStatus.IN_PROGRESS || status === TripStatus.COMPLETED) {
      payload.actualStartDate = start;
    }
    if (status === TripStatus.COMPLETED) {
      payload.actualEndDate = end;
      payload.actualDistance = 200 + i * 12 + (i % 7);
      payload.fuelConsumed = 40 + (i % 30);
      payload.actualRevenue = 1500 + i * 45 + (i % 100);
    }

    await TripModel.create(payload);
  }

  console.log('Trip dispatcher seed data ready.');
}
