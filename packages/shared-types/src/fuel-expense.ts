import type { ExpenseStatus } from './status';

export enum FuelType {
  DIESEL = 'DIESEL',
  PETROL = 'PETROL',
  CNG = 'CNG',
  ELECTRIC = 'ELECTRIC',
  HYBRID = 'HYBRID',
  OTHER = 'OTHER',
}

export enum ExpenseType {
  TOLL = 'TOLL',
  PARKING = 'PARKING',
  REPAIR = 'REPAIR',
  MAINTENANCE = 'MAINTENANCE',
  INSURANCE = 'INSURANCE',
  CLEANING = 'CLEANING',
  TAX = 'TAX',
  PERMIT = 'PERMIT',
  FINE = 'FINE',
  OTHER = 'OTHER',
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  tripId?: string;
  driverId?: string;
  fuelStation: string;
  fuelType: FuelType;
  quantity: number;
  pricePerLiter: number;
  totalCost: number;
  odometerReading?: number;
  filledAt: string;
  receiptImage?: string;
  notes?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseRecord {
  id: string;
  vehicleId: string;
  tripId?: string;
  driverId?: string;
  expenseType: ExpenseType;
  title: string;
  description?: string;
  amount: number;
  expenseDate: string;
  receiptImage?: string;
  approvedBy?: string;
  status: ExpenseStatus;
  notes?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FuelStatistics {
  totalFuelCost: number;
  totalFuelQuantity: number;
  averageFuelCost: number;
  averageFuelEfficiency: number;
  monthlyFuelCost: { month: string; cost: number }[];
  fuelConsumptionTrend: { date: string; quantity: number; cost: number }[];
}

export interface ExpenseStatistics {
  totalExpenses: number;
  pending: number;
  approved: number;
  rejected: number;
  expenseByCategory: { type: ExpenseType; amount: number; count: number }[];
  monthlyExpenses: { month: string; amount: number }[];
}

export interface OperationalCost {
  fuelCost: number;
  maintenanceCost: number;
  expenseCost: number;
  totalCost: number;
}

export interface VehicleCostHistory {
  vehicleId: string;
  period: string;
  fuelCost: number;
  maintenanceCost: number;
  expenseCost: number;
  totalCost: number;
}

export interface TripCostSummary {
  tripId: string;
  fuelCost: number;
  expenseCost: number;
  totalCost: number;
}
