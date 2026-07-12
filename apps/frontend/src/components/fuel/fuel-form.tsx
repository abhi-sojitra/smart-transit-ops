'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, useReducedMotion } from 'framer-motion';
import { FuelType } from '@transitops/shared-types';
import { FormField } from '@/components/forms/form-field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { VehicleSelect } from '@/components/fleet/vehicle-select';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUiStore } from '@/store';
import { actionBarSlide, staggerContainer, staggerItem } from '@/components/drivers/motion';
import { fuelFormSchema, type FuelFormValues } from '@/types/fuel-expense';
import { toDateInput } from '@/utils/date';

interface FuelFormProps {
  defaultValues?: Partial<FuelFormValues>;
  submitting?: boolean;
  submitLabel?: string;
  onSubmit: (values: FuelFormValues) => Promise<void> | void;
  onCancel?: () => void;
}

const emptyDefaults: FuelFormValues = {
  vehicleId: '',
  tripId: '',
  driverId: '',
  fuelStation: '',
  fuelType: FuelType.DIESEL,
  quantity: 0,
  pricePerLiter: 0,
  odometerReading: undefined,
  filledAt: toDateInput(new Date()),
  receiptImage: '',
  notes: '',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.section
      variants={staggerItem}
      className="space-y-4 rounded-xl border border-border bg-card/40 p-4 md:p-5"
    >
      <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </h2>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </motion.section>
  );
}

export function FuelForm({
  defaultValues,
  submitting,
  submitLabel = 'Save Fuel Log',
  onSubmit,
  onCancel,
}: FuelFormProps) {
  const sidebarCollapsed = useUiStore((s) => s.sidebarCollapsed);
  const reduceMotion = useReducedMotion();
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 768px)');
    const sync = () => setIsDesktop(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<FuelFormValues>({
    resolver: zodResolver(fuelFormSchema),
    defaultValues: { ...emptyDefaults, ...defaultValues },
  });

  const fuelType = watch('fuelType');
  const vehicleId = watch('vehicleId');
  const actionBarLeft = isDesktop ? (sidebarCollapsed ? 72 : 260) : 0;

  const clean = (values: FuelFormValues): FuelFormValues => ({
    ...values,
    vehicleId: values.vehicleId.trim(),
    tripId: values.tripId?.trim() || undefined,
    driverId: values.driverId?.trim() || undefined,
    fuelStation: values.fuelStation.trim(),
    receiptImage: values.receiptImage?.trim() || undefined,
    notes: values.notes?.trim() || undefined,
  });

  return (
    <>
      <motion.form
        id="fuel-form"
        className="space-y-5 pb-28"
        variants={staggerContainer}
        initial={reduceMotion ? false : 'hidden'}
        animate="show"
        onSubmit={handleSubmit(async (values) => {
          await onSubmit(clean(values));
        })}
      >
        <Section title="Assignment">
          <FormField label="Vehicle" htmlFor="vehicleId" error={errors.vehicleId?.message}>
            <VehicleSelect
              id="vehicleId"
              value={vehicleId}
              onChange={(v) => setValue('vehicleId', v, { shouldValidate: true })}
              aria-invalid={Boolean(errors.vehicleId)}
            />
          </FormField>
          <FormField label="Trip ID" htmlFor="tripId" error={errors.tripId?.message}>
            <Input id="tripId" placeholder="TR-2001 (optional)" {...register('tripId')} />
          </FormField>
          <FormField label="Driver ID" htmlFor="driverId" error={errors.driverId?.message}>
            <Input id="driverId" placeholder="DR-3001 (optional)" {...register('driverId')} />
          </FormField>
        </Section>

        <Section title="Fuel Details">
          <FormField label="Fuel Station" htmlFor="fuelStation" error={errors.fuelStation?.message}>
            <Input id="fuelStation" placeholder="Shell Highway Station" {...register('fuelStation')} />
          </FormField>
          <FormField label="Fuel Type" htmlFor="fuelType" error={errors.fuelType?.message}>
            <Select
              value={fuelType}
              onValueChange={(v) => setValue('fuelType', v as FuelType, { shouldValidate: true })}
            >
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
            <Controller
              name="filledAt"
              control={control}
              render={({ field }) => (
                <DatePicker
                  id="filledAt"
                  value={field.value}
                  onChange={field.onChange}
                  disableFuture
                  aria-invalid={Boolean(errors.filledAt)}
                />
              )}
            />
          </FormField>
          <FormField label="Odometer" htmlFor="odometerReading" error={errors.odometerReading?.message}>
            <Input id="odometerReading" type="number" {...register('odometerReading')} />
          </FormField>
        </Section>

        <Section title="Cost">
          <FormField label="Quantity (L)" htmlFor="quantity" error={errors.quantity?.message}>
            <Input id="quantity" type="number" step="0.1" {...register('quantity')} />
          </FormField>
          <FormField label="Price / Liter" htmlFor="pricePerLiter" error={errors.pricePerLiter?.message}>
            <Input id="pricePerLiter" type="number" step="0.01" {...register('pricePerLiter')} />
          </FormField>
        </Section>

        <Section title="Additional">
          <FormField label="Receipt URL" htmlFor="receiptImage" error={errors.receiptImage?.message}>
            <Input id="receiptImage" placeholder="https://..." {...register('receiptImage')} />
          </FormField>
          <FormField
            label="Notes"
            htmlFor="notes"
            error={errors.notes?.message}
            className="md:col-span-2"
          >
            <Textarea id="notes" rows={3} {...register('notes')} />
          </FormField>
        </Section>
      </motion.form>

      <motion.div
        className="fixed bottom-0 right-0 z-30 border-t border-border bg-background/95 px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.12)] backdrop-blur transition-[left] duration-200 md:px-6"
        style={{ left: actionBarLeft }}
        variants={actionBarSlide}
        initial={reduceMotion ? false : 'hidden'}
        animate="show"
      >
        <div className="flex flex-wrap items-center justify-end gap-2">
          {onCancel ? (
            <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
              Cancel
            </Button>
          ) : null}
          <Button type="submit" form="fuel-form" loading={submitting}>
            {submitLabel}
          </Button>
        </div>
      </motion.div>
    </>
  );
}
