'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, useReducedMotion } from 'framer-motion';
import { FuelType } from '@transitops/shared-types';
import { FormField } from '@/components/forms/form-field';
import { FormShell } from '@/components/forms/form-shell';
import { FormSection } from '@/components/forms/form-section';
import { FormActionBar } from '@/components/forms/form-action-bar';
import { Input } from '@/components/ui/input';
import { InputAffix } from '@/components/ui/input-affix';
import { CharacterCountTextarea } from '@/components/ui/character-count-textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { VehicleSelect } from '@/components/fleet/vehicle-select';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { staggerContainer } from '@/components/drivers/motion';
import { DEFAULT_FORM_OPTIONS, FORM_LIMITS, PLACEHOLDERS } from '@/constants/form';
import { useUnsavedChangesWarning } from '@/hooks/use-unsaved-changes';
import { fuelFormSchema, type FuelFormValues } from '@/types/fuel-expense';
import { toDateInput } from '@/utils/date';
import { optionalString, positiveDecimal, sanitizeTextInput } from '@/utils/form-sanitize';
import { enhanceRegister } from '@/utils/form-register';

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
  quantity: undefined as unknown as number,
  pricePerLiter: undefined as unknown as number,
  odometerReading: undefined,
  filledAt: toDateInput(new Date()),
  receiptImage: '',
  notes: '',
};

export function FuelForm({
  defaultValues,
  submitting,
  submitLabel = 'Save Fuel Log',
  onSubmit,
  onCancel,
}: FuelFormProps) {
  const reduceMotion = useReducedMotion();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors, isDirty },
  } = useForm<FuelFormValues>({
    ...DEFAULT_FORM_OPTIONS,
    resolver: zodResolver(fuelFormSchema),
    defaultValues: { ...emptyDefaults, ...defaultValues },
  });

  useUnsavedChangesWarning(isDirty, !submitting);

  const fuelType = watch('fuelType');
  const vehicleId = watch('vehicleId');

  const clean = (values: FuelFormValues): FuelFormValues => ({
    ...values,
    vehicleId: values.vehicleId.trim(),
    tripId: optionalString(values.tripId),
    driverId: optionalString(values.driverId),
    fuelStation: values.fuelStation.trim(),
    receiptImage: optionalString(values.receiptImage),
    notes: optionalString(values.notes),
  });

  return (
    <>
      <motion.form
        id="fuel-form"
        className="space-y-5 pb-28"
        variants={staggerContainer}
        initial={reduceMotion ? false : 'hidden'}
        animate="show"
        noValidate
        onSubmit={handleSubmit(async (values) => {
          await onSubmit(clean(values));
        })}
      >
        <FormShell submitting={submitting}>
          <FormSection title="Assignment">
          <FormField label="Vehicle" htmlFor="vehicleId" required error={errors.vehicleId?.message}>
            <VehicleSelect
              id="vehicleId"
              value={vehicleId}
              onChange={(v) => setValue('vehicleId', v, { shouldValidate: true })}
              aria-invalid={Boolean(errors.vehicleId)}
            />
          </FormField>
          <FormField label="Trip ID" htmlFor="tripId" error={errors.tripId?.message}>
            <Input
              id="tripId"
              autoComplete="off"
              maxLength={FORM_LIMITS.text}
              placeholder={PLACEHOLDERS.tripId}
              {...enhanceRegister(register('tripId'), {
                transform: (v) => sanitizeTextInput(v, FORM_LIMITS.text),
              })}
            />
          </FormField>
          <FormField label="Driver ID" htmlFor="driverId" error={errors.driverId?.message}>
            <Input
              id="driverId"
              autoComplete="off"
              maxLength={FORM_LIMITS.text}
              placeholder={PLACEHOLDERS.driverId}
              {...enhanceRegister(register('driverId'), {
                transform: (v) => sanitizeTextInput(v, FORM_LIMITS.text),
              })}
            />
          </FormField>
          </FormSection>

          <FormSection title="Fuel Details">
          <FormField
            label="Fuel Station"
            htmlFor="fuelStation"
            required
            error={errors.fuelStation?.message}
          >
            <Input
              id="fuelStation"
              autoComplete="organization"
              maxLength={FORM_LIMITS.text}
              placeholder={PLACEHOLDERS.fuelStation}
              {...enhanceRegister(register('fuelStation'), {
                transform: (v) => sanitizeTextInput(v, FORM_LIMITS.text),
              })}
            />
          </FormField>
          <FormField label="Fuel Type" htmlFor="fuelType" required error={errors.fuelType?.message}>
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
          <FormField label="Filled At" htmlFor="filledAt" required error={errors.filledAt?.message}>
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
            <InputAffix
              id="odometerReading"
              suffix="km"
              type="number"
              inputMode="numeric"
              min={0}
              placeholder={PLACEHOLDERS.odometer}
              {...register('odometerReading')}
            />
          </FormField>
          </FormSection>

          <FormSection title="Cost">
          <FormField label="Quantity" htmlFor="quantity" required error={errors.quantity?.message}>
            <InputAffix
              id="quantity"
              suffix="L"
              inputMode="decimal"
              placeholder={PLACEHOLDERS.fuelQuantity}
              {...enhanceRegister(register('quantity'), {
                transform: (v) => positiveDecimal(String(v)),
              })}
            />
          </FormField>
          <FormField
            label="Price per Liter"
            htmlFor="pricePerLiter"
            required
            error={errors.pricePerLiter?.message}
          >
            <InputAffix
              id="pricePerLiter"
              prefix="₹"
              inputMode="decimal"
              placeholder="Example: 96.50"
              {...enhanceRegister(register('pricePerLiter'), {
                transform: (v) => positiveDecimal(String(v)),
              })}
            />
          </FormField>
          </FormSection>

          <FormSection title="Additional">
          <FormField label="Receipt URL" htmlFor="receiptImage" error={errors.receiptImage?.message}>
            <Input
              id="receiptImage"
              type="url"
              inputMode="url"
              maxLength={FORM_LIMITS.url}
              placeholder={PLACEHOLDERS.receiptUrl}
              {...register('receiptImage')}
            />
          </FormField>
          <FormField
            label="Notes"
            htmlFor="notes"
            error={errors.notes?.message}
            className="md:col-span-2"
          >
            <CharacterCountTextarea
              id="notes"
              rows={3}
              maxLength={FORM_LIMITS.textarea}
              placeholder={PLACEHOLDERS.notes}
              {...register('notes')}
            />
          </FormField>
          </FormSection>
        </FormShell>
      </motion.form>

      <FormActionBar
        formId="fuel-form"
        submitting={submitting}
        submitLabel={submitLabel}
        onCancel={onCancel}
        isDirty={isDirty}
      />
    </>
  );
}
