import { z } from 'zod';
import { ExpenseStatus, ExpenseType, FuelType } from '@transitops/shared-types';

export const fuelFormSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle is required'),
  tripId: z.string().optional(),
  driverId: z.string().optional(),
  fuelStation: z.string().min(1, 'Fuel station is required'),
  fuelType: z.nativeEnum(FuelType, { errorMap: () => ({ message: 'Fuel type is required' }) }),
  quantity: z.coerce.number().positive('Quantity must be greater than zero'),
  pricePerLiter: z.coerce.number().positive('Price must be greater than zero'),
  odometerReading: z.coerce.number().min(0).optional(),
  filledAt: z.string().min(1, 'Date is required'),
  receiptImage: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  notes: z.string().optional(),
});

export const expenseFormSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle is required'),
  tripId: z.string().optional(),
  driverId: z.string().optional(),
  expenseType: z.nativeEnum(ExpenseType, { errorMap: () => ({ message: 'Expense type is required' }) }),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  amount: z.coerce.number().positive('Amount must be greater than zero'),
  expenseDate: z.string().min(1, 'Date is required'),
  receiptImage: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  status: z.nativeEnum(ExpenseStatus).optional(),
  notes: z.string().optional(),
});

export type FuelFormValues = z.infer<typeof fuelFormSchema>;
export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

export const fuelFilterSchema = z.object({
  search: z.string().optional(),
  vehicleId: z.string().optional(),
  tripId: z.string().optional(),
  driverId: z.string().optional(),
  fuelType: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export const expenseFilterSchema = z.object({
  search: z.string().optional(),
  vehicleId: z.string().optional(),
  tripId: z.string().optional(),
  driverId: z.string().optional(),
  expenseType: z.string().optional(),
  status: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export type FuelFilterValues = z.infer<typeof fuelFilterSchema>;
export type ExpenseFilterValues = z.infer<typeof expenseFilterSchema>;
