'use client';

import * as React from 'react';
import { useEffect, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { CargoType } from '@transitops/shared-types';
import { FormField } from '@/components/forms/form-field';
import { Input } from '@/components/ui/input';
import { InputAffix } from '@/components/ui/input-affix';
import { CharacterCountTextarea } from '@/components/ui/character-count-textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { VehicleSelect } from '@/components/fleet/vehicle-select';
import { useAvailableDrivers } from '@/hooks/use-trips';
import { DEFAULT_FORM_OPTIONS, FORM_LIMITS, PLACEHOLDERS } from '@/constants/form';
import { useUnsavedChangesWarning } from '@/hooks/use-unsaved-changes';
import type { CreateTripInput } from '@/types/trip';
import { positiveDecimal, sanitizeTextInput } from '@/utils/form-sanitize';
import { enhanceRegister } from '@/utils/form-register';
import { nonNegativeAmountField, positiveAmountField, requiredTrimmedString } from '@/utils/form-validation';

const tripFormBaseSchema = z.object({
  source: requiredTrimmedString('Source location', FORM_LIMITS.text),
  destination: requiredTrimmedString('Destination location', FORM_LIMITS.text),
  vehicleId: z.string().min(1, 'Vehicle is required.'),
  driverId: z.string().min(1, 'Driver is required.'),
  cargoName: requiredTrimmedString('Cargo name', FORM_LIMITS.text),
  cargoWeight: positiveAmountField('Cargo weight'),
  cargoType: z.nativeEnum(CargoType, { errorMap: () => ({ message: 'Cargo type is required.' }) }),
  plannedDistance: positiveAmountField('Planned distance'),
  plannedStartDate: z.string().min(1, 'Planned start date and time is required.'),
  plannedEndDate: z.string().min(1, 'Planned end date and time is required.'),
  estimatedRevenue: nonNegativeAmountField('Estimated revenue'),
  notes: z.string().max(FORM_LIMITS.textarea).optional(),
});

export type TripFormValues = z.infer<typeof tripFormBaseSchema>;

function createTripSchema(getCapacity: () => number | null | undefined) {
  return tripFormBaseSchema
    .refine((values) => new Date(values.plannedEndDate) >= new Date(values.plannedStartDate), {
      message: 'Planned end must be on or after the planned start.',
      path: ['plannedEndDate'],
    })
    .superRefine((values, ctx) => {
      if (!values.vehicleId) return;
      const capacity = getCapacity();
      if (capacity === null || capacity === undefined) return;
      if (capacity <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['vehicleId'],
          message: 'Vehicle has no max load capacity configured',
        });
        return;
      }
      if (values.cargoWeight > capacity) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['cargoWeight'],
          message: `Cargo weight exceeds vehicle capacity (${capacity}).`,
        });
      }
    });
}

interface TripFormProps {
  defaultValues?: Partial<TripFormValues>;
  submitLabel?: string;
  loading?: boolean;
  onSubmit: (values: CreateTripInput) => void;
  onCancel?: () => void;
}

function toLocalInput(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

function assetId(asset: { id?: string; _id?: string }): string {
  return String(asset.id ?? asset._id ?? '');
}

export function TripForm({
  defaultValues,
  submitLabel = 'Save trip',
  loading,
  onSubmit,
  onCancel,
}: TripFormProps) {
  const {
    data: drivers = [],
    isLoading: loadingDrivers,
    isError: driversError,
    isSuccess: driversReady,
  } = useAvailableDrivers();

  const [selectedVehicleCapacity, setSelectedVehicleCapacity] = React.useState<number | null>(null);
  const capacityRef = useRef(selectedVehicleCapacity);
  capacityRef.current = selectedVehicleCapacity;

  const schema = useMemo(() => createTripSchema(() => capacityRef.current), []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<TripFormValues>({
    ...DEFAULT_FORM_OPTIONS,
    resolver: zodResolver(schema),
    defaultValues: {
      source: defaultValues?.source ?? '',
      destination: defaultValues?.destination ?? '',
      vehicleId: defaultValues?.vehicleId ?? '',
      driverId: defaultValues?.driverId ?? '',
      cargoName: defaultValues?.cargoName ?? '',
      cargoWeight: defaultValues?.cargoWeight ?? (undefined as unknown as number),
      cargoType: defaultValues?.cargoType ?? CargoType.GENERAL,
      plannedDistance: defaultValues?.plannedDistance ?? (undefined as unknown as number),
      plannedStartDate: toLocalInput(defaultValues?.plannedStartDate),
      plannedEndDate: toLocalInput(defaultValues?.plannedEndDate),
      estimatedRevenue: defaultValues?.estimatedRevenue ?? 0,
      notes: defaultValues?.notes ?? '',
    },
  });

  useUnsavedChangesWarning(isDirty, !loading);

  const selectedVehicleId = watch('vehicleId');
  const selectedDriverId = watch('driverId');
  const plannedStartDate = watch('plannedStartDate');
  const cargoWeight = watch('cargoWeight');
  const minStartDateTime = toLocalInput(new Date().toISOString());
  const minEndDateTime = plannedStartDate || minStartDateTime;

  useEffect(() => {
    if (!driversReady || loadingDrivers) return;
    if (!selectedDriverId) return;
    const stillAvailable = drivers.some((driver) => assetId(driver) === selectedDriverId);
    if (!stillAvailable) {
      setValue('driverId', '', { shouldValidate: true, shouldDirty: true });
    }
  }, [drivers, driversReady, loadingDrivers, selectedDriverId, setValue]);

  useEffect(() => {
    if (
      selectedVehicleCapacity != null &&
      cargoWeight != null &&
      Number(cargoWeight) > selectedVehicleCapacity
    ) {
      setValue('cargoWeight', selectedVehicleCapacity, { shouldValidate: true });
    }
  }, [selectedVehicleCapacity, cargoWeight, setValue]);

  return (
    <form
      className="space-y-6"
      noValidate
      onSubmit={handleSubmit((values) =>
        onSubmit({
          ...values,
          plannedStartDate: new Date(values.plannedStartDate).toISOString(),
          plannedEndDate: new Date(values.plannedEndDate).toISOString(),
        }),
      )}
    >
      <Card>
        <CardHeader>
          <CardTitle>Trip</CardTitle>
          <CardDescription>Route and planned schedule for this dispatch.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField label="Source" htmlFor="source" required error={errors.source?.message}>
            <Input
              id="source"
              autoFocus
              maxLength={FORM_LIMITS.text}
              placeholder={PLACEHOLDERS.source}
              {...enhanceRegister(register('source'), {
                transform: (v) => sanitizeTextInput(v, FORM_LIMITS.text),
              })}
            />
          </FormField>
          <FormField label="Destination" htmlFor="destination" required error={errors.destination?.message}>
            <Input
              id="destination"
              maxLength={FORM_LIMITS.text}
              placeholder={PLACEHOLDERS.destination}
              {...enhanceRegister(register('destination'), {
                transform: (v) => sanitizeTextInput(v, FORM_LIMITS.text),
              })}
            />
          </FormField>
          <FormField
            label="Planned Start"
            htmlFor="plannedStartDate"
            required
            error={errors.plannedStartDate?.message}
          >
            <Input
              id="plannedStartDate"
              type="datetime-local"
              min={minStartDateTime}
              {...register('plannedStartDate')}
            />
          </FormField>
          <FormField
            label="Planned End"
            htmlFor="plannedEndDate"
            required
            error={errors.plannedEndDate?.message}
          >
            <Input
              id="plannedEndDate"
              type="datetime-local"
              min={minEndDateTime}
              {...register('plannedEndDate')}
            />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vehicle & Driver</CardTitle>
          <CardDescription>Only available assets can be assigned.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField label="Vehicle" htmlFor="vehicleId" required error={errors.vehicleId?.message}>
            <VehicleSelect
              id="vehicleId"
              source="available"
              valueKey="id"
              value={selectedVehicleId}
              placeholder="Select available vehicle"
              onChange={(value) =>
                setValue('vehicleId', value, { shouldValidate: true, shouldDirty: true })
              }
              onVehicleSelect={(vehicle) => {
                setSelectedVehicleCapacity(vehicle?.maxCapacity ?? null);
              }}
              aria-invalid={Boolean(errors.vehicleId)}
            />
          </FormField>
          <FormField
            label="Driver"
            htmlFor="driverId"
            required
            error={errors.driverId?.message ?? (driversError ? 'Failed to load drivers.' : undefined)}
            description={
              !loadingDrivers && !driversError && drivers.length === 0
                ? 'No free drivers right now. Cancel or complete an active trip first.'
                : undefined
            }
          >
            <Select
              value={selectedDriverId || undefined}
              onValueChange={(value) =>
                setValue('driverId', value, { shouldValidate: true, shouldDirty: true })
              }
              disabled={loadingDrivers || driversError || drivers.length === 0}
            >
              <SelectTrigger id="driverId">
                <SelectValue
                  placeholder={
                    loadingDrivers
                      ? 'Loading drivers…'
                      : drivers.length === 0
                        ? 'No available drivers'
                        : 'Select available driver'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {drivers.map((driver) => {
                  const value = assetId(driver);
                  if (!value) return null;
                  return (
                    <SelectItem key={value} value={value}>
                      {driver.fullName ?? `${driver.firstName} ${driver.lastName}`} ·{' '}
                      {driver.employeeCode ?? driver.employeeId}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </FormField>
          {selectedVehicleCapacity != null ? (
            <p className="text-xs text-muted-foreground md:col-span-2">
              Selected capacity: {selectedVehicleCapacity} kg. Cargo weight cannot exceed this value.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cargo</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <FormField label="Cargo Name" htmlFor="cargoName" required error={errors.cargoName?.message}>
            <Input
              id="cargoName"
              maxLength={FORM_LIMITS.text}
              placeholder={PLACEHOLDERS.cargoName}
              {...enhanceRegister(register('cargoName'), {
                transform: (v) => sanitizeTextInput(v, FORM_LIMITS.text),
              })}
            />
          </FormField>
          <FormField label="Cargo Weight" htmlFor="cargoWeight" required error={errors.cargoWeight?.message}>
            <InputAffix
              id="cargoWeight"
              suffix="kg"
              inputMode="decimal"
              max={selectedVehicleCapacity ?? undefined}
              placeholder={PLACEHOLDERS.weight}
              {...enhanceRegister(register('cargoWeight'), {
                transform: (v) => positiveDecimal(String(v)),
              })}
            />
          </FormField>
          <FormField label="Cargo Type" htmlFor="cargoType" required error={errors.cargoType?.message}>
            <Select
              value={watch('cargoType')}
              onValueChange={(value) =>
                setValue('cargoType', value as CargoType, { shouldValidate: true, shouldDirty: true })
              }
            >
              <SelectTrigger id="cargoType">
                <SelectValue placeholder="Select cargo type" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(CargoType).map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Distance & Revenue</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField
            label="Planned Distance"
            htmlFor="plannedDistance"
            required
            error={errors.plannedDistance?.message}
          >
            <InputAffix
              id="plannedDistance"
              suffix="km"
              inputMode="decimal"
              placeholder={PLACEHOLDERS.distance}
              {...enhanceRegister(register('plannedDistance'), {
                transform: (v) => positiveDecimal(String(v)),
              })}
            />
          </FormField>
          <FormField
            label="Estimated Revenue"
            htmlFor="estimatedRevenue"
            required
            error={errors.estimatedRevenue?.message}
          >
            <InputAffix
              id="estimatedRevenue"
              prefix="₹"
              inputMode="decimal"
              placeholder={PLACEHOLDERS.amount}
              {...enhanceRegister(register('estimatedRevenue'), {
                transform: (v) => positiveDecimal(String(v)),
              })}
            />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <FormField label="Notes" htmlFor="notes" description="Optional dispatch instructions.">
            <CharacterCountTextarea
              id="notes"
              rows={4}
              maxLength={FORM_LIMITS.textarea}
              placeholder={PLACEHOLDERS.notes}
              {...register('notes')}
            />
          </FormField>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {isDirty ? 'You have unsaved changes.' : 'All changes saved.'}
        </p>
        <div className="flex gap-2">
          {onCancel ? (
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
          ) : null}
          <Button type="submit" loading={loading} disabled={loading}>
            {submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}
