import mongoose from 'mongoose';
import {
  MaintenancePriority,
  MaintenanceStatus,
  MaintenanceType,
  VehicleStatus,
} from '@transitops/shared-types';
import { VehicleSchema } from '../../schemas/vehicle.schema';
import { MaintenanceSchema } from '../../modules/maintenance/schema/maintenance.schema';

const VEHICLE_SEEDS = [
  { vehicleId: 'VH-1001', model: 'Freightliner Cascadia', year: 2022, status: VehicleStatus.AVAILABLE, mileage: 84210, maxCapacity: 40 },
  { vehicleId: 'VH-1002', model: 'Volvo VNL 860', year: 2021, status: VehicleStatus.MAINTENANCE, mileage: 120430, maxCapacity: 40 },
  { vehicleId: 'VH-1003', model: 'Kenworth T680', year: 2023, status: VehicleStatus.ON_TRIP, mileage: 45120, maxCapacity: 45 },
  { vehicleId: 'VH-1004', model: 'Peterbilt 579', year: 2020, status: VehicleStatus.AVAILABLE, mileage: 156890, maxCapacity: 40 },
  { vehicleId: 'VH-1005', model: 'International LT', year: 2022, status: VehicleStatus.AVAILABLE, mileage: 67340, maxCapacity: 35 },
  { vehicleId: 'VH-1006', model: 'Mack Anthem', year: 2021, status: VehicleStatus.MAINTENANCE, mileage: 98100, maxCapacity: 40 },
  { vehicleId: 'VH-1007', model: 'Freightliner M2', year: 2019, status: VehicleStatus.AVAILABLE, mileage: 201450, maxCapacity: 30 },
  { vehicleId: 'VH-1008', model: 'Volvo VNR', year: 2023, status: VehicleStatus.AVAILABLE, mileage: 22100, maxCapacity: 40 },
  { vehicleId: 'VH-1009', model: 'Kenworth T880', year: 2020, status: VehicleStatus.RETIRED, mileage: 312000, maxCapacity: 50 },
  { vehicleId: 'VH-1010', model: 'Peterbilt 567', year: 2022, status: VehicleStatus.AVAILABLE, mileage: 55400, maxCapacity: 40 },
];

const TYPES = Object.values(MaintenanceType);
const PRIORITIES = Object.values(MaintenancePriority);

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function daysFrom(base: Date, n: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}

export async function seedMaintenanceAndVehicles(
  connection: typeof mongoose,
): Promise<void> {
  const VehicleModel = connection.models.Vehicle ?? connection.model('Vehicle', VehicleSchema);
  const MaintenanceModel =
    connection.models.Maintenance ?? connection.model('Maintenance', MaintenanceSchema);

  console.log('Seeding vehicles (for maintenance integration)...');
  const vehicleObjectIds: mongoose.Types.ObjectId[] = [];
  for (const vehicle of VEHICLE_SEEDS) {
    const doc = await VehicleModel.findOneAndUpdate(
      { vehicleId: vehicle.vehicleId },
      { $set: { ...vehicle, isDeleted: false } },
      { upsert: true, new: true },
    );
    vehicleObjectIds.push(doc._id as mongoose.Types.ObjectId);
  }

  const existingCount = await MaintenanceModel.countDocuments({ isDeleted: { $ne: true } });
  const force = process.env.SEED_FORCE_MAINTENANCE === 'true';
  if (!force && existingCount >= 30) {
    console.log(`Maintenance already seeded (${existingCount} records). Skipping.`);
    return;
  }

  console.log(force ? 'Force re-seeding maintenance records...' : 'Seeding 30 maintenance records...');
  await MaintenanceModel.deleteMany({});

  const records = [];
  for (let i = 0; i < 30; i++) {
    const vehicleId = vehicleObjectIds[i % vehicleObjectIds.length];
    const startDate = daysAgo(40 - i);
    const expectedCompletionDate = daysFrom(startDate, 2 + (i % 5));
    let status: MaintenanceStatus;
    let completedDate: Date | undefined;

    if (i < 12) {
      status = MaintenanceStatus.COMPLETED;
      completedDate = daysFrom(startDate, 1 + (i % 3));
    } else if (i < 18) {
      status = MaintenanceStatus.SCHEDULED;
    } else if (i < 24) {
      status = MaintenanceStatus.IN_PROGRESS;
    } else if (i < 27) {
      status = MaintenanceStatus.CANCELLED;
    } else {
      status = MaintenanceStatus.SCHEDULED;
    }

    const maintenanceType =
      i % 7 === 0 ? MaintenanceType.EMERGENCY : TYPES[i % TYPES.length];

    const estimatedCost = 150 + i * 75 + (i % 3) * 40;
    const actualCost =
      status === MaintenanceStatus.COMPLETED ? estimatedCost + (i % 5) * 25 : undefined;

    records.push({
      vehicleId,
      maintenanceNumber: `MNT-2026-${String(i + 1).padStart(4, '0')}`,
      maintenanceType,
      title: `${maintenanceType.replaceAll('_', ' ')} — Unit ${(i % 10) + 1}`.slice(0, 100),
      description: `Seeded ${maintenanceType.toLowerCase()} work order #${i + 1}`,
      priority: PRIORITIES[i % PRIORITIES.length],
      status,
      startDate,
      expectedCompletionDate,
      completedDate,
      estimatedCost,
      actualCost,
      vendorName: i % 2 === 0 ? 'FleetCare Motors' : 'TransitPro Garage',
      vendorPhone: `+1-555-01${String(i).padStart(2, '0')}`,
      serviceCenter: i % 2 === 0 ? 'Downtown Service Center' : 'North Depot Bay 3',
      odometerReading: 40000 + i * 2500,
      nextServiceDue: daysFrom(expectedCompletionDate, 90),
      notes: i % 4 === 0 ? 'Use OEM parts where possible' : undefined,
      attachments: [],
      isDeleted: false,
      createdBy: 'seed',
    });
  }

  await MaintenanceModel.insertMany(records);

  const activeVehicleIds = new Set(
    records
      .filter((r) =>
        [MaintenanceStatus.SCHEDULED, MaintenanceStatus.IN_PROGRESS].includes(r.status),
      )
      .map((r) => String(r.vehicleId)),
  );

  for (const id of vehicleObjectIds) {
    const vehicle = await VehicleModel.findById(id);
    if (!vehicle || vehicle.status === VehicleStatus.RETIRED) continue;
    if (activeVehicleIds.has(String(id))) {
      await VehicleModel.findByIdAndUpdate(id, { status: VehicleStatus.MAINTENANCE });
    } else if (vehicle.status === VehicleStatus.MAINTENANCE) {
      await VehicleModel.findByIdAndUpdate(id, { status: VehicleStatus.AVAILABLE });
    }
  }

  console.log('Seeded 30 maintenance records.');
}
