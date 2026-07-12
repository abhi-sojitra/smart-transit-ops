import { z } from 'zod';
import { ExpenseStatus, ExpenseType, FuelType } from '@transitops/shared-types';
import { FORM_LIMITS } from '@/constants/form';
import { startOfToday } from '@/utils/date';
import {
  notesField,
  optionalTrimmedString,
  positiveAmountField,
  requiredTrimmedString,
  urlField,
} from '@/utils/form-validation';

function isFutureDate(value: string): boolean {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() > startOfToday().getTime();
}

export const fuelFormSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle is required.'),
  tripId: optionalTrimmedString(FORM_LIMITS.text),
  driverId: optionalTrimmedString(FORM_LIMITS.text),
  fuelStation: requiredTrimmedString('Fuel station name', FORM_LIMITS.text),
  fuelType: z.nativeEnum(FuelType, { errorMap: () => ({ message: 'Fuel type is required.' }) }),
  quantity: positiveAmountField('Quantity'),
  pricePerLiter: positiveAmountField('Price per liter'),
  odometerReading: z.coerce.number().min(0, 'Odometer cannot be negative.').optional(),
  filledAt: z
    .string()
    .min(1, 'Filled date is required.')
    .refine((value) => !isFutureDate(value), 'Filled date cannot be in the future.'),
  receiptImage: urlField('Receipt URL'),
  notes: notesField,
});

export const expenseFormSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle is required.'),
  tripId: optionalTrimmedString(FORM_LIMITS.text),
  driverId: optionalTrimmedString(FORM_LIMITS.text),
  expenseType: z.nativeEnum(ExpenseType, {
    errorMap: () => ({ message: 'Expense type is required.' }),
  }),
  title: requiredTrimmedString('Expense title', FORM_LIMITS.text),
  description: optionalTrimmedString(FORM_LIMITS.textarea),
  amount: positiveAmountField('Amount'),
  expenseDate: z
    .string()
    .min(1, 'Expense date is required.')
    .refine((value) => !isFutureDate(value), 'Expense date cannot be in the future.'),
  receiptImage: urlField('Receipt URL'),
  status: z.nativeEnum(ExpenseStatus).optional(),
  notes: notesField,
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

export type FuelSortField = 'createdAt' | 'totalCost' | 'quantity' | 'filledAt';
export type ExpenseSortField = 'createdAt' | 'amount' | 'expenseDate' | 'expenseType';

export interface FuelFiltersState extends FuelFilterValues {
  sortBy: FuelSortField;
  sortOrder: 'asc' | 'desc';
  page: number;
  limit: number;
}

export interface ExpenseFiltersState extends ExpenseFilterValues {
  sortBy: ExpenseSortField;
  sortOrder: 'asc' | 'desc';
  page: number;
  limit: number;
}
