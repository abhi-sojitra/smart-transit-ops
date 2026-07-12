'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { CargoType } from '@transitops/shared-types';
import { FormField } from '@/components/forms/form-field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAvailableDrivers, useAvailableVehicles } from '@/hooks/use-trips';
import type { CreateTripInput } from '@/types/trip';

const tripFormBaseSchema = z.object({
  source: z.string().min(2, 'Source is required'),
  destination: z.string().min(2, 'Destination is required'),
  vehicleId: z.string().min(1, 'Vehicle is required'),
  driverId: z.string().min(1, 'Driver is required'),
  cargoName: z.string().min(1, 'Cargo name is required'),
  cargoWeight: z.coerce.number().min(0, 'Weight must be >= 0'),
  cargoType: z.nativeEnum(CargoType),
  plannedDistance: z.coerce.number().min(1, 'Distance is required'),
  plannedStartDate: z.string().min(1, 'Start date is required'),
  plannedEndDate: z.string().min(1, 'End date is required'),
  estimatedRevenue: z.coerce.number().min(0, 'Revenue must be >= 0'),
  notes: z.string().optional(),
});

export type TripFormValues = z.infer<typeof tripFormBaseSchema>;

function createTripSchema(getCapacity: (vehicleId: string) => number | undefined) {
  return tripFormBaseSchema
    .refine((values) => new Date(values.plannedEndDate) >= new Date(values.plannedStartDate), {
      message: 'End date must be after start date',
      path: ['plannedEndDate'],
    })
    .superRefine((values, ctx) => {
      if (!values.vehicleId) return;
      const capacity = getCapacity(values.vehicleId);
      if (capacity === undefined) return;
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

export function TripForm({ defaultValues, submitLabel = 'Save trip', loading, onSubmit }: TripFormProps) {
  const {
    data: vehicles = [],
    isLoading: loadingVehicles,
    isError: vehiclesError,
    isSuccess: vehiclesReady,
  } = useAvailableVehicles();
  const {
    data: drivers = [],
    isLoading: loadingDrivers,
    isError: driversError,
    isSuccess: driversReady,
  } = useAvailableDrivers();

  const vehiclesRef = useRef(vehicles);
  vehiclesRef.current = vehicles;

  const schema = useMemo(
    () =>
      createTripSchema((vehicleId) => {
        const vehicle = vehiclesRef.current.find((item) => assetId(item) === vehicleId);
        if (!vehicle) return undefined;
        return Number(vehicle.maxCapacity) || 0;
      }),
    [],
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<TripFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      source: defaultValues?.source ?? '',
      destination: defaultValues?.destination ?? '',
      vehicleId: defaultValues?.vehicleId ?? '',
      driverId: defaultValues?.driverId ?? '',
      cargoName: defaultValues?.cargoName ?? '',
      cargoWeight: defaultValues?.cargoWeight ?? 0,
      cargoType: defaultValues?.cargoType ?? CargoType.GENERAL,
      plannedDistance: defaultValues?.plannedDistance ?? 100,
      plannedStartDate: toLocalInput(defaultValues?.plannedStartDate),
      plannedEndDate: toLocalInput(defaultValues?.plannedEndDate),
      estimatedRevenue: defaultValues?.estimatedRevenue ?? 0,
      notes: defaultValues?.notes ?? '',
    },
  });

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty || loading) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty, loading]);

  const selectedVehicleId = watch('vehicleId');
  const selectedDriverId = watch('driverId');

  useEffect(() => {
    if (!vehiclesReady || loadingVehicles) return;
    if (!selectedVehicleId) return;
    const stillAvailable = vehicles.some((vehicle) => assetId(vehicle) === selectedVehicleId);
    if (!stillAvailable) {
      setValue('vehicleId', '', { shouldValidate: true, shouldDirty: true });
    }
  }, [vehicles, vehiclesReady, loadingVehicles, selectedVehicleId, setValue]);

  useEffect(() => {
    if (!driversReady || loadingDrivers) return;
    if (!selectedDriverId) return;
    const stillAvailable = drivers.some((driver) => assetId(driver) === selectedDriverId);
    if (!stillAvailable) {
      setValue('driverId', '', { shouldValidate: true, shouldDirty: true });
    }
  }, [drivers, driversReady, loadingDrivers, selectedDriverId, setValue]);

  const selectedVehicle = vehicles.find((v) => assetId(v) === selectedVehicleId);

  return (
    <form
      className="space-y-6"
      onSubmit={handleSubmit((values) =>
        onSubmit({
          ...values,
          plannedStartDate: new Date(values.plannedStartDate).toISOString(),
          plannedEndDate: new Date(values.plannedEndDate).toISOString(),
        }),
      )}
      noValidate
    >
      <Card>
        <CardHeader>
          <CardTitle>Trip</CardTitle>
          <CardDescription>Route and planned schedule for this dispatch.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField label="Source *" htmlFor="source" error={errors.source?.message}>
            <Input id="source" autoFocus placeholder="Chicago, IL" {...register('source')} />
          </FormField>
          <FormField label="Destination *" htmlFor="destination" error={errors.destination?.message}>
            <Input id="destination" placeholder="Detroit, MI" {...register('destination')} />
          </FormField>
          <FormField
            label="Planned start *"
            htmlFor="plannedStartDate"
            error={errors.plannedStartDate?.message}
          >
            <Input id="plannedStartDate" type="datetime-local" {...register('plannedStartDate')} />
          </FormField>
          <FormField label="Planned end *" htmlFor="plannedEndDate" error={errors.plannedEndDate?.message}>
            <Input id="plannedEndDate" type="datetime-local" {...register('plannedEndDate')} />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vehicle & Driver</CardTitle>
          <CardDescription>Only available assets can be assigned.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField
            label="Vehicle *"
            htmlFor="vehicleId"
            error={
              errors.vehicleId?.message ??
              (vehiclesError ? 'Failed to load vehicles' : undefined)
            }
            description={
              !loadingVehicles && !vehiclesError && vehicles.length === 0
                ? 'No free vehicles right now. Cancel or complete an active trip first.'
                : undefined
            }
          >
            <Select
              value={selectedVehicleId || undefined}
              onValueChange={(value) =>
                setValue('vehicleId', value, { shouldValidate: true, shouldDirty: true })
              }
              disabled={loadingVehicles || vehiclesError || vehicles.length === 0}
            >
              <SelectTrigger id="vehicleId">
                <SelectValue
                  placeholder={
                    loadingVehicles
                      ? 'Loading vehicles…'
                      : vehicles.length === 0
                        ? 'No available vehicles'
                        : 'Select available vehicle'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {vehicles.map((vehicle) => {
                  const id = assetId(vehicle);
                  if (!id) return null;
                  const name = [vehicle.make, vehicle.model].filter(Boolean).join(' ').trim();
                  return (
                    <SelectItem key={id} value={id}>
                      {name || vehicle.model || vehicle.vehicleId} · cap {vehicle.maxCapacity}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </FormField>
          <FormField
            label="Driver *"
            htmlFor="driverId"
            error={
              errors.driverId?.message ?? (driversError ? 'Failed to load drivers' : undefined)
            }
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
          {selectedVehicle ? (
            <p className="text-xs text-muted-foreground md:col-span-2">
              Selected capacity: {selectedVehicle.maxCapacity}. Cargo weight cannot exceed this value.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cargo</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <FormField label="Cargo name *" htmlFor="cargoName" error={errors.cargoName?.message}>
            <Input id="cargoName" {...register('cargoName')} />
          </FormField>
          <FormField label="Cargo weight *" htmlFor="cargoWeight" error={errors.cargoWeight?.message}>
            <Input id="cargoWeight" type="number" {...register('cargoWeight')} />
          </FormField>
          <FormField label="Cargo type *" htmlFor="cargoType" error={errors.cargoType?.message}>
            <Select
              value={watch('cargoType')}
              onValueChange={(value) =>
                setValue('cargoType', value as CargoType, { shouldValidate: true, shouldDirty: true })
              }
            >
              <SelectTrigger id="cargoType">
                <SelectValue />
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
            label="Planned distance (mi) *"
            htmlFor="plannedDistance"
            error={errors.plannedDistance?.message}
          >
            <Input id="plannedDistance" type="number" {...register('plannedDistance')} />
          </FormField>
          <FormField
            label="Estimated revenue *"
            htmlFor="estimatedRevenue"
            error={errors.estimatedRevenue?.message}
          >
            <Input id="estimatedRevenue" type="number" {...register('estimatedRevenue')} />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <FormField label="Notes" htmlFor="notes" description="Optional dispatch instructions.">
            <Textarea id="notes" rows={4} {...register('notes')} />
          </FormField>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {isDirty ? 'You have unsaved changes.' : 'All changes saved.'}
        </p>
        <Button type="submit" loading={loading} disabled={loading}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
