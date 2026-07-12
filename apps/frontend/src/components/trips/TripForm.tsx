'use client';

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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAvailableDrivers, useAvailableVehicles } from '@/hooks/use-trips';
import type { CreateTripInput } from '@/types/trip';

const schema = z
  .object({
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
  })
  .refine((values) => new Date(values.plannedEndDate) >= new Date(values.plannedStartDate), {
    message: 'End date must be after start date',
    path: ['plannedEndDate'],
  });

export type TripFormValues = z.infer<typeof schema>;

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

export function TripForm({ defaultValues, submitLabel = 'Save trip', loading, onSubmit }: TripFormProps) {
  const { data: vehicles, isLoading: loadingVehicles } = useAvailableVehicles();
  const { data: drivers, isLoading: loadingDrivers } = useAvailableDrivers();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
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

  const selectedVehicleId = watch('vehicleId');
  const selectedVehicle = vehicles?.find((v) => v._id === selectedVehicleId);

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
    >
      <Card>
        <CardHeader>
          <CardTitle>Trip</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField label="Source" htmlFor="source" error={errors.source?.message}>
            <Input id="source" {...register('source')} />
          </FormField>
          <FormField label="Destination" htmlFor="destination" error={errors.destination?.message}>
            <Input id="destination" {...register('destination')} />
          </FormField>
          <FormField label="Planned start" htmlFor="plannedStartDate" error={errors.plannedStartDate?.message}>
            <Input id="plannedStartDate" type="datetime-local" {...register('plannedStartDate')} />
          </FormField>
          <FormField label="Planned end" htmlFor="plannedEndDate" error={errors.plannedEndDate?.message}>
            <Input id="plannedEndDate" type="datetime-local" {...register('plannedEndDate')} />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vehicle & Driver</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField label="Vehicle" htmlFor="vehicleId" error={errors.vehicleId?.message}>
            <Select
              value={watch('vehicleId')}
              onValueChange={(value) => setValue('vehicleId', value, { shouldValidate: true })}
              disabled={loadingVehicles}
            >
              <SelectTrigger id="vehicleId">
                <SelectValue placeholder="Select available vehicle" />
              </SelectTrigger>
              <SelectContent>
                {vehicles?.map((vehicle) => (
                  <SelectItem key={vehicle._id} value={vehicle._id}>
                    {vehicle.vehicleId} · {vehicle.model} · cap {vehicle.maxCapacity}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Driver" htmlFor="driverId" error={errors.driverId?.message}>
            <Select
              value={watch('driverId')}
              onValueChange={(value) => setValue('driverId', value, { shouldValidate: true })}
              disabled={loadingDrivers}
            >
              <SelectTrigger id="driverId">
                <SelectValue placeholder="Select available driver" />
              </SelectTrigger>
              <SelectContent>
                {drivers?.map((driver) => {
                  const value = driver.id ?? driver._id;
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
          <FormField label="Cargo name" htmlFor="cargoName" error={errors.cargoName?.message}>
            <Input id="cargoName" {...register('cargoName')} />
          </FormField>
          <FormField label="Cargo weight" htmlFor="cargoWeight" error={errors.cargoWeight?.message}>
            <Input id="cargoWeight" type="number" {...register('cargoWeight')} />
          </FormField>
          <FormField label="Cargo type" htmlFor="cargoType" error={errors.cargoType?.message}>
            <Select
              value={watch('cargoType')}
              onValueChange={(value) => setValue('cargoType', value as CargoType, { shouldValidate: true })}
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
          <FormField label="Planned distance (mi)" htmlFor="plannedDistance" error={errors.plannedDistance?.message}>
            <Input id="plannedDistance" type="number" {...register('plannedDistance')} />
          </FormField>
          <FormField
            label="Estimated revenue"
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
          <FormField label="Notes" htmlFor="notes">
            <Textarea id="notes" rows={4} {...register('notes')} />
          </FormField>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" loading={loading}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
