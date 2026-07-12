'use client';

import { toast } from 'sonner';

export const notify = {
  fuelAdded: () => toast.success('Fuel log added successfully'),
  fuelUpdated: () => toast.success('Fuel log updated successfully'),
  fuelDeleted: () => toast.success('Fuel log deleted successfully'),
  expenseAdded: () => toast.success('Expense added successfully'),
  expenseUpdated: () => toast.success('Expense updated successfully'),
  expenseDeleted: () => toast.success('Expense deleted successfully'),
  validationFailed: (message?: string) =>
    toast.error(message ?? 'Validation failed. Please check the form.'),
  error: (message: string) => toast.error(message),
};
