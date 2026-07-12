'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ExpenseStatus, ExpenseType } from '@transitops/shared-types';
import { FormField } from '@/components/forms/form-field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { expenseFormSchema, type ExpenseFormValues } from '@/types/fuel-expense';

interface ExpenseFormProps {
  defaultValues?: Partial<ExpenseFormValues>;
  onSubmit: (values: ExpenseFormValues) => void | Promise<void>;
  loading?: boolean;
  submitLabel?: string;
  showStatus?: boolean;
}

export function ExpenseForm({
  defaultValues,
  onSubmit,
  loading,
  submitLabel = 'Save Expense',
  showStatus = false,
}: ExpenseFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      expenseType: ExpenseType.OTHER,
      expenseDate: new Date().toISOString().slice(0, 10),
      status: ExpenseStatus.PENDING,
      ...defaultValues,
    },
  });

  const expenseType = watch('expenseType');
  const status = watch('status');

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Vehicle ID" htmlFor="vehicleId" error={errors.vehicleId?.message}>
          <Input id="vehicleId" placeholder="VH-1001" {...register('vehicleId')} />
        </FormField>
        <FormField label="Trip ID" htmlFor="tripId" error={errors.tripId?.message}>
          <Input id="tripId" placeholder="TR-2001 (optional)" {...register('tripId')} />
        </FormField>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Driver ID" htmlFor="driverId" error={errors.driverId?.message}>
          <Input id="driverId" placeholder="DR-3001 (optional)" {...register('driverId')} />
        </FormField>
        <FormField label="Expense Type" htmlFor="expenseType" error={errors.expenseType?.message}>
          <Select
            value={expenseType}
            onValueChange={(v) => setValue('expenseType', v as ExpenseType)}
          >
            <SelectTrigger id="expenseType">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(ExpenseType).map((type) => (
                <SelectItem key={type} value={type}>
                  {type.replaceAll('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      </div>
      <FormField label="Title" htmlFor="title" error={errors.title?.message}>
        <Input id="title" placeholder="Highway Toll - I-95" {...register('title')} />
      </FormField>
      <FormField label="Description" htmlFor="description" error={errors.description?.message}>
        <Textarea id="description" {...register('description')} />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Amount" htmlFor="amount" error={errors.amount?.message}>
          <Input id="amount" type="number" step="0.01" {...register('amount')} />
        </FormField>
        <FormField label="Expense Date" htmlFor="expenseDate" error={errors.expenseDate?.message}>
          <Input id="expenseDate" type="date" {...register('expenseDate')} />
        </FormField>
      </div>
      {showStatus ? (
        <FormField label="Status" htmlFor="status" error={errors.status?.message}>
          <Select value={status} onValueChange={(v) => setValue('status', v as ExpenseStatus)}>
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(ExpenseStatus).map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      ) : null}
      <FormField label="Receipt URL" htmlFor="receiptImage" error={errors.receiptImage?.message}>
        <Input id="receiptImage" placeholder="https://..." {...register('receiptImage')} />
      </FormField>
      <FormField label="Notes" htmlFor="notes" error={errors.notes?.message}>
        <Textarea id="notes" {...register('notes')} />
      </FormField>
      <Button type="submit" className="w-full sm:w-auto" loading={loading}>
        {submitLabel}
      </Button>
    </form>
  );
}
