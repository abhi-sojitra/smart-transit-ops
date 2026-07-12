import { VehicleStatus, VehicleType, FuelType } from '@transitops/shared-types';

const MAKES = [
  'Tata',
  'Ashok Leyland',
  'Volvo',
  'Freightliner',
  'Kenworth',
  'Peterbilt',
  'Mahindra',
  'Eicher',
  'Force',
  'Scania',
];

const MODELS = [
  'Starbus Ultra',
  'Cascadia',
  'VNL 860',
  'T680',
  '579',
  'Viking',
  'Pro 6048',
  'Traveller',
  'Lynx',
  'Metrolink',
];

const DEPOTS = [
  { depotCity: 'Bengaluru', depotState: 'Karnataka' },
  { depotCity: 'Mumbai', depotState: 'Maharashtra' },
  { depotCity: 'Delhi', depotState: 'Delhi' },
  { depotCity: 'Hyderabad', depotState: 'Telangana' },
  { depotCity: 'Chennai', depotState: 'Tamil Nadu' },
];

const STATUSES = [
  VehicleStatus.AVAILABLE,
  VehicleStatus.ON_TRIP,
  VehicleStatus.MAINTENANCE,
  VehicleStatus.RETIRED,
  VehicleStatus.AVAILABLE,
];

const VEHICLE_TYPES = [
  VehicleType.BUS,
  VehicleType.TRUCK,
  VehicleType.MINIBUS,
  VehicleType.VAN,
  VehicleType.TRUCK,
];

const FUEL_TYPES = [
  FuelType.DIESEL,
  FuelType.DIESEL,
  FuelType.CNG,
  FuelType.DIESEL,
  FuelType.ELECTRIC,
];

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
}

export function buildDemoVehicles(count = 20) {
  return Array.from({ length: count }, (_, index) => {
    const make = MAKES[index % MAKES.length];
    const model = MODELS[index % MODELS.length];
    const depot = DEPOTS[index % DEPOTS.length];
    const status = STATUSES[index % STATUSES.length];
    const vehicleId = `VH-${1001 + index}`;
    const registrationNumber = `KA${String(10 + (index % 50)).padStart(2, '0')}AB${String(1000 + index)}`;

    let registrationExpiryDate = daysFromNow(365 + index * 20);
    let insuranceExpiryDate = daysFromNow(300 + index * 15);
    let fitnessCertificateExpiryDate = daysFromNow(280 + index * 12);

    if (index % 7 === 0) insuranceExpiryDate = daysFromNow(15);
    if (index % 9 === 0) fitnessCertificateExpiryDate = daysFromNow(20);
    if (status === VehicleStatus.RETIRED) {
      registrationExpiryDate = daysFromNow(400);
    }

    const lastServiceDate = daysFromNow(-(30 + index * 5));
    const nextServiceDueDate =
      index % 6 === 0 ? daysFromNow(5) : daysFromNow(90 + index * 3);

    return {
      vehicleId,
      registrationNumber,
      vin: `VIN${String(100000000000000 + index).slice(0, 17)}`,
      make,
      model,
      year: 2018 + (index % 7),
      vehicleType: VEHICLE_TYPES[index % VEHICLE_TYPES.length],
      fuelType: FUEL_TYPES[index % FUEL_TYPES.length],
      color: ['White', 'Blue', 'Silver', 'Red', 'Yellow'][index % 5],
      seatingCapacity: 12 + (index % 40),
      mileage: 15000 + index * 4200,
      purchaseDate: new Date(2018 + (index % 6), index % 12, 15),
      registrationExpiryDate,
      insuranceExpiryDate,
      fitnessCertificateExpiryDate,
      lastServiceDate,
      nextServiceDueDate,
      depotCity: depot.depotCity,
      depotState: depot.depotState,
      country: 'India',
      photo: undefined,
      documents: [],
      status,
      remarks: index % 4 === 0 ? 'Demo seed vehicle' : undefined,
      isDeleted: false,
      createdBy: 'seed',
    };
  });
}
