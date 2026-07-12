'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { useSafeReducedMotion } from '@/hooks/use-safe-reduced-motion';
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
import { useUiStore } from '@/store';
import { actionBarSlide, staggerContainer, staggerItem } from '@/components/fleet/motion';
import {
  VehicleStatus,
  VehicleType,
  FuelType,
  type VehicleFormValues,
} from '@/types/fleet';
import { parseVehicleUniqueConflict } from '@/lib/vehicle-form-errors';

const vehicleFormSchema = z
  .object({
    vehicleId: z
      .string()
      .min(2, 'Vehicle ID is required')
      .max(32)
      .regex(/^[A-Za-z0-9-_]+$/, 'Only letters, numbers, hyphens, and underscores'),
    registrationNumber: z.string().min(4, 'Registration number is required').max(20),
    vin: z
      .string()
      .optional()
      .or(z.literal(''))
      .refine((value) => !value || (value.length >= 11 && value.length <= 17), {
        message: 'VIN must be 11–17 characters when provided',
      }),
    make: z.string().min(1, 'Make is required').max(80),
    model: z.string().min(1, 'Model is required').max(80),
    year: z.coerce.number().min(1980).max(2100).optional(),
    vehicleType: z.nativeEnum(VehicleType),
    fuelType: z.nativeEnum(FuelType),
    color: z.string().optional(),
    seatingCapacity: z.coerce.number().min(1).max(200).optional(),
    maxCapacity: z.coerce
      .number({ invalid_type_error: 'Maximum load capacity is required' })
      .min(1, 'Maximum load capacity must be at least 1 kg')
      .max(500, 'Maximum load capacity must not exceed 500 kg'),
    mileage: z.coerce.number().min(0),
    purchaseDate: z.string().optional(),
    registrationExpiryDate: z.string().min(1, 'Registration expiry is required'),
    insuranceExpiryDate: z.string().min(1, 'Insurance expiry is required'),
    fitnessCertificateExpiryDate: z.string().min(1, 'Fitness expiry is required'),
    lastServiceDate: z.string().optional(),
    nextServiceDueDate: z.string().optional(),
    depotCity: z.string().optional(),
    depotState: z.string().optional(),
    country: z.string().optional(),
    photo: z.string().optional(),
    remarks: z.string().max(500).optional(),
    status: z.nativeEnum(VehicleStatus).optional(),
  })
  .superRefine((data, ctx) => {
    const parseDateOnly = (value?: string) => {
      if (!value?.trim()) return null;
      const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
      if (!match) return null;
      return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    };
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const complianceFields = [
      { key: 'registrationExpiryDate' as const, label: 'Registration expiry' },
      { key: 'insuranceExpiryDate' as const, label: 'Insurance expiry' },
      { key: 'fitnessCertificateExpiryDate' as const, label: 'Fitness expiry' },
    ];
    for (const field of complianceFields) {
      const date = parseDateOnly(data[field.key]);
      if (!date || date.getTime() <= today.getTime()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [field.key],
          message: `${field.label} must be greater than today`,
        });
      }
    }

    const lastService = parseDateOnly(data.lastServiceDate);
    if (data.lastServiceDate?.trim()) {
      if (!lastService || lastService.getTime() > today.getTime()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['lastServiceDate'],
          message: 'Last service date must be today or a past date',
        });
      }
    }

    const nextService = parseDateOnly(data.nextServiceDueDate);
    if (data.nextServiceDueDate?.trim()) {
      if (!nextService || nextService.getTime() <= today.getTime()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['nextServiceDueDate'],
          message: 'Next service due must be greater than today',
        });
      } else if (lastService && nextService.getTime() < lastService.getTime()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['nextServiceDueDate'],
          message: 'Next service due must be on or after last service date',
        });
      }
    }
  });

export type VehicleFormSchema = z.infer<typeof vehicleFormSchema>;

interface VehicleFormProps {
  defaultValues?: Partial<VehicleFormValues>;
  submitting?: boolean;
  submitLabel?: string;
  onSubmit: (values: VehicleFormValues) => Promise<void> | void;
  onCancel?: () => void;
}

const emptyDefaults: VehicleFormSchema = {
  vehicleId: '',
  registrationNumber: '',
  vin: '',
  make: '',
  model: '',
  year: undefined,
  vehicleType: VehicleType.BUS,
  fuelType: FuelType.DIESEL,
  color: '',
  seatingCapacity: undefined,
  maxCapacity: 0,
  mileage: 0,
  purchaseDate: '',
  registrationExpiryDate: '',
  insuranceExpiryDate: '',
  fitnessCertificateExpiryDate: '',
  lastServiceDate: '',
  nextServiceDueDate: '',
  depotCity: '',
  depotState: '',
  country: 'India',
  photo: '',
  remarks: '',
  status: VehicleStatus.AVAILABLE,
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

export function VehicleForm({
  defaultValues,
  submitting,
  submitLabel = 'Save Vehicle',
  onSubmit,
  onCancel,
}: VehicleFormProps) {
  const sidebarCollapsed = useUiStore((s) => s.sidebarCollapsed);
  const reduceMotion = useSafeReducedMotion();
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
    setError,
    watch,
    formState: { errors },
  } = useForm<VehicleFormSchema>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: { ...emptyDefaults, ...defaultValues },
  });

  const clean = (values: VehicleFormSchema): VehicleFormValues => {
    const optional = (v?: string) => (v && v.trim() ? v.trim() : undefined);
    return {
      ...values,
      vehicleId: values.vehicleId.trim(),
      registrationNumber: values.registrationNumber.trim(),
      vin: optional(values.vin),
      make: values.make.trim(),
      model: values.model.trim(),
      color: optional(values.color),
      maxCapacity: Number(values.maxCapacity),
      purchaseDate: optional(values.purchaseDate),
      lastServiceDate: optional(values.lastServiceDate),
      nextServiceDueDate: optional(values.nextServiceDueDate),
      depotCity: optional(values.depotCity),
      depotState: optional(values.depotState),
      country: optional(values.country),
      photo: optional(values.photo),
      remarks: optional(values.remarks),
    };
  };

  const actionBarLeft = isDesktop ? (sidebarCollapsed ? 72 : 260) : 0;

  return (
    <>
      <motion.form
        id="vehicle-form"
        className="space-y-5 pb-28"
        noValidate
        variants={staggerContainer}
        initial={reduceMotion ? false : 'hidden'}
        animate="show"
        onSubmit={handleSubmit(async (values) => {
          try {
            await onSubmit(clean(values));
          } catch (error) {
            const conflict = parseVehicleUniqueConflict(error);
            if (conflict) {
              setError(conflict.field, { type: 'server', message: conflict.message });
              return;
            }
            throw error;
          }
        })}
      >
        <Section title="Vehicle Identity">
          <FormField label="Vehicle ID" htmlFor="vehicleId" error={errors.vehicleId?.message}>
            <Input id="vehicleId" placeholder="VH-1001" {...register('vehicleId')} />
          </FormField>
          <FormField
            label="Registration Number"
            htmlFor="registrationNumber"
            error={errors.registrationNumber?.message}
          >
            <Input id="registrationNumber" {...register('registrationNumber')} />
          </FormField>
          <FormField label="VIN" htmlFor="vin" error={errors.vin?.message}>
            <Input id="vin" {...register('vin')} />
          </FormField>
          <FormField label="Make" htmlFor="make" error={errors.make?.message}>
            <Input id="make" {...register('make')} />
          </FormField>
          <FormField label="Model" htmlFor="model" error={errors.model?.message}>
            <Input id="model" {...register('model')} />
          </FormField>
          <FormField label="Year" htmlFor="year" error={errors.year?.message}>
            <Input id="year" type="number" {...register('year')} />
          </FormField>
        </Section>

        <Section title="Specifications">
          <FormField label="Vehicle Type" htmlFor="vehicleType" error={errors.vehicleType?.message}>
            <Select
              value={watch('vehicleType')}
              onValueChange={(value) =>
                setValue('vehicleType', value as VehicleType, { shouldValidate: true })
              }
            >
              <SelectTrigger id="vehicleType">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(VehicleType).map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.replaceAll('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Fuel Type" htmlFor="fuelType" error={errors.fuelType?.message}>
            <Select
              value={watch('fuelType')}
              onValueChange={(value) =>
                setValue('fuelType', value as FuelType, { shouldValidate: true })
              }
            >
              <SelectTrigger id="fuelType">
                <SelectValue placeholder="Select fuel" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(FuelType).map((fuel) => (
                  <SelectItem key={fuel} value={fuel}>
                    {fuel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Color" htmlFor="color" error={errors.color?.message}>
            <Input id="color" {...register('color')} />
          </FormField>
          <FormField
            label="Seating Capacity"
            htmlFor="seatingCapacity"
            error={errors.seatingCapacity?.message}
          >
            <Input id="seatingCapacity" type="number" {...register('seatingCapacity')} />
          </FormField>
          <FormField
            label="Maximum Load Capacity (kg)"
            htmlFor="maxCapacity"
            error={errors.maxCapacity?.message}
          >
            <Input
              id="maxCapacity"
              type="number"
              step={1}
              placeholder="e.g. 500"
              {...register('maxCapacity')}
            />
          </FormField>
          <FormField label="Mileage (km)" htmlFor="mileage" error={errors.mileage?.message}>
            <Input id="mileage" type="number" {...register('mileage')} />
          </FormField>
          <FormField label="Purchase Date" htmlFor="purchaseDate" error={errors.purchaseDate?.message}>
            <Input id="purchaseDate" type="date" {...register('purchaseDate')} />
          </FormField>
        </Section>

        <Section title="Compliance">
          <FormField
            label="Registration Expiry"
            htmlFor="registrationExpiryDate"
            error={errors.registrationExpiryDate?.message}
          >
            <Input id="registrationExpiryDate" type="date" {...register('registrationExpiryDate')} />
          </FormField>
          <FormField
            label="Insurance Expiry"
            htmlFor="insuranceExpiryDate"
            error={errors.insuranceExpiryDate?.message}
          >
            <Input id="insuranceExpiryDate" type="date" {...register('insuranceExpiryDate')} />
          </FormField>
          <FormField
            label="Fitness Certificate Expiry"
            htmlFor="fitnessCertificateExpiryDate"
            error={errors.fitnessCertificateExpiryDate?.message}
          >
            <Input
              id="fitnessCertificateExpiryDate"
              type="date"
              {...register('fitnessCertificateExpiryDate')}
            />
          </FormField>
          <FormField label="Status" htmlFor="status" error={errors.status?.message}>
            <Select
              value={watch('status')}
              onValueChange={(value) =>
                setValue('status', value as VehicleStatus, { shouldValidate: true })
              }
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(VehicleStatus).map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.replaceAll('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </Section>

        <Section title="Service & Depot">
          <FormField
            label="Last Service Date"
            htmlFor="lastServiceDate"
            error={errors.lastServiceDate?.message}
          >
            <Input id="lastServiceDate" type="date" {...register('lastServiceDate')} />
          </FormField>
          <FormField
            label="Next Service Due"
            htmlFor="nextServiceDueDate"
            error={errors.nextServiceDueDate?.message}
          >
            <Input id="nextServiceDueDate" type="date" {...register('nextServiceDueDate')} />
          </FormField>
          <FormField label="Depot City" htmlFor="depotCity" error={errors.depotCity?.message}>
            <Input id="depotCity" {...register('depotCity')} />
          </FormField>
          <FormField label="Depot State" htmlFor="depotState" error={errors.depotState?.message}>
            <Input id="depotState" {...register('depotState')} />
          </FormField>
          <FormField label="Country" htmlFor="country" error={errors.country?.message}>
            <Input id="country" {...register('country')} />
          </FormField>
          <FormField label="Remarks" htmlFor="remarks" error={errors.remarks?.message}>
            <Textarea id="remarks" rows={3} {...register('remarks')} />
          </FormField>
        </Section>
      </motion.form>

      <motion.div
        className="fixed bottom-0 right-0 z-30 border-t border-border bg-background/95 px-4 py-3 backdrop-blur"
        style={{ left: actionBarLeft }}
        variants={actionBarSlide}
        initial={reduceMotion ? false : 'hidden'}
        animate="show"
      >
        <div className="mx-auto flex max-w-5xl justify-end gap-2">
          {onCancel ? (
            <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
              Cancel
            </Button>
          ) : null}
          <Button type="submit" form="vehicle-form" loading={submitting}>
            {submitLabel}
          </Button>
        </div>
      </motion.div>
    </>
  );
}
