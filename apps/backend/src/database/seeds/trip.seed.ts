import { Types } from 'mongoose';
import {
  CargoType,
  DriverStatus,
  TripStatus,
  VehicleStatus,
} from '@transitops/shared-types';
import { VehicleSchema } from '../../modules/fleet/schema/vehicle.schema';
import { DriverSchema } from '../../modules/driver/schema/driver.schema';
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
  const TripModel = mongoose.models.Trip || mongoose.model('Trip', TripSchema);

  console.log('Preparing trip dispatcher seed (using existing fleet vehicles)...');
  await TripModel.deleteMany({});

  const vehicles = await VehicleModel.find({ isDeleted: { $ne: true } }).exec();
  if (!vehicles.length) {
    throw new Error('No vehicles found. Seed fleet vehicles before trip data.');
  }

  // Ensure cargo capacity exists for trip validation demos.
  await VehicleModel.updateMany(
    {
      isDeleted: { $ne: true },
      $or: [{ maxCapacity: { $exists: false } }, { maxCapacity: null }, { maxCapacity: 0 }],
    },
    { $set: { maxCapacity: 20000 } },
  );

  const refreshedVehicles = await VehicleModel.find({ isDeleted: { $ne: true } }).exec();

  const drivers = await DriverModel.find({ isDeleted: { $ne: true } }).exec();
  if (!drivers.length) {
    throw new Error('No drivers found. Seed demo drivers before trip data.');
  }

  console.log('Seeding 50 trips...');
  const availableVehicles = refreshedVehicles.filter((v) => v.status === VehicleStatus.AVAILABLE);
  const availableDrivers = drivers.filter((d) => d.status === DriverStatus.AVAILABLE);
  const poolVehicles = availableVehicles.length ? availableVehicles : refreshedVehicles;
  const poolDrivers = availableDrivers.length ? availableDrivers : drivers;

  // Keep a few assets free so create/dispatch demos still work after seeding.
  const reservedVehicleCount = Math.min(3, poolVehicles.length);
  const reservedDriverCount = Math.min(3, poolDrivers.length);
  const assignableVehicles = poolVehicles.slice(reservedVehicleCount);
  const assignableDrivers = poolDrivers.slice(reservedDriverCount);
  const tripVehicles = assignableVehicles.length ? assignableVehicles : poolVehicles;
  const tripDrivers = assignableDrivers.length ? assignableDrivers : poolDrivers;

  for (let i = 1; i <= 50; i++) {
    const tripNumber = `TR-${String(i).padStart(4, '0')}`;
    const status = TRIP_STATUSES[i % TRIP_STATUSES.length];
    const [source, destination] = CITIES[i % CITIES.length];
    const cargo = CARGO[i % CARGO.length];
    const vehicle = tripVehicles[i % Math.max(tripVehicles.length, 1)] ?? refreshedVehicles[0];
    const driver = tripDrivers[i % Math.max(tripDrivers.length, 1)] ?? drivers[0];
    const capacity = vehicle.maxCapacity || vehicle.seatingCapacity || 20000;
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
      cargoWeight: Math.min(cargo.weight, capacity),
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

    if (status === TripStatus.DISPATCHED || status === TripStatus.IN_PROGRESS) {
      await Promise.all([
        VehicleModel.updateOne(
          { _id: vehicle._id },
          { $set: { status: VehicleStatus.ON_TRIP } },
        ),
        DriverModel.updateOne({ _id: driver._id }, { $set: { status: DriverStatus.ON_TRIP } }),
      ]);
    }
  }

  console.log(
    `Trip dispatcher seed data ready (${reservedVehicleCount} vehicles and ${reservedDriverCount} drivers reserved as free).`,
  );
}
