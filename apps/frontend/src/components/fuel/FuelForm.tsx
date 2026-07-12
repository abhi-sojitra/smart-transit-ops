'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FuelType } from '@transitops/shared-types';
import { FormField } from '@/components/forms/form-field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fuelFormSchema, type FuelFormValues } from '@/types/fuel-expense';

interface FuelFormProps {
  defaultValues?: Partial<FuelFormValues>;
  onSubmit: (values: FuelFormValues) => void | Promise<void>;
  loading?: boolean;
  submitLabel?: string;
}

export function FuelForm({
  defaultValues,
  onSubmit,
  loading,
  submitLabel = 'Save Fuel Log',
}: FuelFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FuelFormValues>({
    resolver: zodResolver(fuelFormSchema),
    defaultValues: {
      fuelType: FuelType.DIESEL,
      filledAt: new Date().toISOString().slice(0, 10),
      ...defaultValues,
    },
  });

  const fuelType = watch('fuelType');

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
        <FormField label="Fuel Station" htmlFor="fuelStation" error={errors.fuelStation?.message}>
          <Input id="fuelStation" placeholder="Shell Highway Station" {...register('fuelStation')} />
        </FormField>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Fuel Type" htmlFor="fuelType" error={errors.fuelType?.message}>
          <Select value={fuelType} onValueChange={(v) => setValue('fuelType', v as FuelType)}>
            <SelectTrigger id="fuelType">
              <SelectValue placeholder="Select fuel type" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(FuelType).map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Filled At" htmlFor="filledAt" error={errors.filledAt?.message}>
          <Input id="filledAt" type="date" {...register('filledAt')} />
        </FormField>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label="Quantity (L)" htmlFor="quantity" error={errors.quantity?.message}>
          <Input id="quantity" type="number" step="0.1" {...register('quantity')} />
        </FormField>
        <FormField label="Price/Liter" htmlFor="pricePerLiter" error={errors.pricePerLiter?.message}>
          <Input id="pricePerLiter" type="number" step="0.01" {...register('pricePerLiter')} />
        </FormField>
        <FormField label="Odometer" htmlFor="odometerReading" error={errors.odometerReading?.message}>
          <Input id="odometerReading" type="number" {...register('odometerReading')} />
        </FormField>
      </div>
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
