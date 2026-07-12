import mongoose from 'mongoose';
import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';
import {
  ExpenseStatus,
  ExpenseType,
  FuelType,
  VehicleStatus,
  DriverStatus,
  LicenseStatus,
  TripStatus,
} from '@transitops/shared-types';
import { VehicleSchema } from '../../schemas/vehicle.schema';
import { DriverSchema } from '../../schemas/driver.schema';
import { TripSchema } from '../../schemas/trip.schema';
import { FuelSchema } from '../../schemas/fuel.schema';
import { ExpenseSchema } from '../../schemas/expense.schema';
import { UserSchema } from '../../schemas/user.schema';

loadEnv({ path: resolve(__dirname, '../../../.env') });

const DEMO_FUEL_ENTRIES = [
  {
    vehicleId: 'VH-1001',
    tripId: 'TR-2001',
    driverId: 'DR-3001',
    fuelStation: 'Shell Highway Station',
    fuelType: FuelType.DIESEL,
    quantity: 65.5,
    pricePerLiter: 1.72,
    totalCost: 116.66,
    odometerReading: 85420,
    filledAt: new Date(),
    notes: 'Demo entry — full tank before Mumbai-Delhi haul',
  },
  {
    vehicleId: 'VH-1002',
    tripId: 'TR-2002',
    driverId: 'DR-3002',
    fuelStation: 'BP Express Fuel',
    fuelType: FuelType.DIESEL,
    quantity: 48.0,
    pricePerLiter: 1.85,
    totalCost: 88.8,
    odometerReading: 62100,
    filledAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    notes: 'Demo entry — mid-route refill',
  },
  {
    vehicleId: 'VH-1003',
    fuelStation: 'Indian Oil Pump #42',
    fuelType: FuelType.PETROL,
    quantity: 35.2,
    pricePerLiter: 1.95,
    totalCost: 68.64,
    odometerReading: 41200,
    filledAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    notes: 'Demo entry — local delivery van',
  },
];

const DEMO_EXPENSE_ENTRIES = [
  {
    vehicleId: 'VH-1001',
    tripId: 'TR-2001',
    driverId: 'DR-3001',
    expenseType: ExpenseType.TOLL,
    title: 'Highway Toll I-95',
    description: 'Demo toll expense for testing filters',
    amount: 45.0,
    expenseDate: new Date(),
    status: ExpenseStatus.PENDING,
    notes: 'Awaiting fleet manager approval',
  },
  {
    vehicleId: 'VH-1001',
    tripId: 'TR-2001',
    expenseType: ExpenseType.PARKING,
    title: 'Warehouse Parking Fee',
    description: 'Demo approved expense',
    amount: 18.5,
    expenseDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    status: ExpenseStatus.APPROVED,
    approvedBy: 'fleet@transitops.com',
  },
  {
    vehicleId: 'VH-1002',
    expenseType: ExpenseType.REPAIR,
    title: 'Brake Pad Replacement',
    description: 'Demo rejected expense',
    amount: 320.0,
    expenseDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    status: ExpenseStatus.REJECTED,
    notes: 'Duplicate claim — rejected for testing',
  },
  {
    vehicleId: 'VH-1003',
    tripId: 'TR-2003',
    driverId: 'DR-3003',
    expenseType: ExpenseType.INSURANCE,
    title: 'Monthly Fleet Insurance',
    amount: 890.0,
    expenseDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    status: ExpenseStatus.APPROVED,
  },
];

const FUEL_STATIONS = [
  'Shell Highway Station',
  'BP Express Fuel',
  'Total Energies Depot',
  'Indian Oil Pump #42',
  'HP Fuel Center',
  'Reliance Petrol Hub',
];

const EXPENSE_TITLES: Record<ExpenseType, string[]> = {
  [ExpenseType.TOLL]: ['Highway Toll I-95', 'Bridge Toll Fee', 'Express Lane Pass'],
  [ExpenseType.PARKING]: ['Airport Parking', 'City Center Parking', 'Warehouse Parking'],
  [ExpenseType.REPAIR]: ['Brake Pad Replacement', 'Tire Repair', 'Engine Diagnostic'],
  [ExpenseType.MAINTENANCE]: ['Scheduled Service', 'Oil Change', 'Filter Replacement'],
  [ExpenseType.INSURANCE]: ['Monthly Premium', 'Fleet Insurance', 'Liability Coverage'],
  [ExpenseType.CLEANING]: ['Interior Detailing', 'Exterior Wash', 'Sanitization'],
  [ExpenseType.TAX]: ['Road Tax', 'Vehicle Registration Tax', 'Annual Tax'],
  [ExpenseType.PERMIT]: ['Interstate Permit', 'City Entry Permit', 'Hazmat Permit'],
  [ExpenseType.FINE]: ['Speed Violation', 'Parking Fine', 'Overweight Fine'],
  [ExpenseType.OTHER]: ['Miscellaneous', 'Supplies', 'Emergency Expense'],
};

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(daysBack: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
  return date;
}

function randomAmount(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

async function seedFuelExpense() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is required');

  await mongoose.connect(uri);

  const VehicleModel = mongoose.model('Vehicle', VehicleSchema);
  const DriverModel = mongoose.model('Driver', DriverSchema);
  const TripModel = mongoose.model('Trip', TripSchema);
  const FuelModel = mongoose.model('Fuel', FuelSchema);
  const ExpenseModel = mongoose.model('Expense', ExpenseSchema);
  const UserModel = mongoose.model('User', UserSchema);

  const driverUser = await UserModel.findOne({ email: 'driver@transitops.com' });
  const driverUserId = driverUser?._id as mongoose.Types.ObjectId | undefined;

  console.log('Seeding reference data (vehicles, drivers, trips)...');

  const vehicleIds: string[] = [];
  for (let i = 1; i <= 10; i++) {
    const vehicleId = `VH-${1000 + i}`;
    vehicleIds.push(vehicleId);
    await VehicleModel.findOneAndUpdate(
      { vehicleId },
      {
        $set: {
          vehicleId,
          model: randomItem(['Volvo FH16', 'Mercedes Actros', 'Scania R450', 'Tata Prima']),
          year: 2018 + (i % 6),
          type: randomItem(['Truck', 'Van', 'Bus']),
          status: VehicleStatus.AVAILABLE,
          mileage: 50000 + i * 1200,
        },
      },
      { upsert: true },
    );
  }

  const driverIds: string[] = [];
  for (let i = 1; i <= 8; i++) {
    const employeeId = `DR-${3000 + i}`;
    driverIds.push(employeeId);
    await DriverModel.findOneAndUpdate(
      { employeeId },
      {
        $set: {
          name: `Driver ${i}`,
          employeeId,
          licenseType: 'Commercial',
          licenseStatus: LicenseStatus.VALID,
          safetyScore: 75 + (i % 20),
          status: DriverStatus.AVAILABLE,
        },
      },
      { upsert: true },
    );
  }

  const tripIds: string[] = [];
  for (let i = 1; i <= 15; i++) {
    const tripId = `TR-${2000 + i}`;
    tripIds.push(tripId);
    await TripModel.findOneAndUpdate(
      { tripId },
      {
        $set: {
          tripId,
          origin: randomItem(['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Pune']),
          destination: randomItem(['Hyderabad', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Lucknow']),
          vehicleId: randomItem(vehicleIds),
          driverId: randomItem(driverIds),
          status: TripStatus.COMPLETED,
        },
      },
      { upsert: true },
    );
  }

  // Maintenance docs are seeded via maintenance.seed.ts into the `maintenance` collection.

  console.log('Seeding demo fuel logs (predictable test entries)...');
  await FuelModel.deleteMany({});
  const demoFuelDocs = DEMO_FUEL_ENTRIES.map((entry) => ({
    ...entry,
    isDeleted: false,
    ...(driverUserId && entry.driverId === 'DR-3001' ? { createdBy: driverUserId } : {}),
  }));

  console.log('Seeding 50 additional fuel logs...');
  const fuelDocs = Array.from({ length: 50 }, (_, i) => {
    const quantity = randomAmount(20, 120);
    const pricePerLiter = randomAmount(1.2, 2.5);
    return {
      vehicleId: randomItem(vehicleIds),
      tripId: Math.random() > 0.3 ? randomItem(tripIds) : undefined,
      driverId: Math.random() > 0.2 ? randomItem(driverIds) : undefined,
      fuelStation: randomItem(FUEL_STATIONS),
      fuelType: randomItem(Object.values(FuelType)),
      quantity,
      pricePerLiter,
      totalCost: Math.round(quantity * pricePerLiter * 100) / 100,
      odometerReading: 80000 + i * 500 + Math.floor(Math.random() * 200),
      filledAt: randomDate(90),
      notes: i % 5 === 0 ? 'Full tank refill' : undefined,
      isDeleted: false,
    };
  });
  await FuelModel.insertMany([...demoFuelDocs, ...fuelDocs]);

  console.log('Seeding demo expense records (predictable test entries)...');
  await ExpenseModel.deleteMany({});
  const demoExpenseDocs = DEMO_EXPENSE_ENTRIES.map((entry) => ({
    ...entry,
    isDeleted: false,
    ...(driverUserId && entry.driverId === 'DR-3001'
      ? { createdBy: driverUserId }
      : {}),
  }));

  console.log('Seeding 50 additional expense records...');
  const expenseTypes = Object.values(ExpenseType);
  const statuses = Object.values(ExpenseStatus);
  const expenseDocs = Array.from({ length: 50 }, () => {
    const expenseType = randomItem(expenseTypes);
    return {
      vehicleId: randomItem(vehicleIds),
      tripId: Math.random() > 0.4 ? randomItem(tripIds) : undefined,
      driverId: Math.random() > 0.3 ? randomItem(driverIds) : undefined,
      expenseType,
      title: randomItem(EXPENSE_TITLES[expenseType]),
      description: 'Auto-generated seed expense',
      amount: randomAmount(10, 1500),
      expenseDate: randomDate(120),
      status: randomItem(statuses),
      notes: undefined,
      isDeleted: false,
    };
  });
  await ExpenseModel.insertMany([...demoExpenseDocs, ...expenseDocs]);

  console.log('Fuel & Expense seed completed successfully.');
  console.log('');
  console.log('Demo entries created:');
  console.log('  Fuel:    VH-1001 @ Shell Highway Station ($116.66)');
  console.log('  Fuel:    VH-1002 @ BP Express Fuel ($88.80)');
  console.log('  Expense: Highway Toll I-95 — PENDING ($45.00)');
  console.log('  Expense: Warehouse Parking Fee — APPROVED ($18.50)');
  console.log('  Expense: Brake Pad Replacement — REJECTED ($320.00)');
  console.log('');
  console.log('Login with fleet@transitops.com / Fleet@12345 to test CRUD');
  console.log('Login with driver@transitops.com / Driver@12345 to test own records');
  await mongoose.disconnect();
}

seedFuelExpense().catch(async (err) => {
  console.error('Seed failed:', err);
  await mongoose.disconnect();
  process.exit(1);
});
