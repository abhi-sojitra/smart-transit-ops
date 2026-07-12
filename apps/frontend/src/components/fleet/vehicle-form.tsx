'use client';

import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { useSafeReducedMotion } from '@/hooks/use-safe-reduced-motion';
import { FormField } from '@/components/forms/form-field';
import { FormShell } from '@/components/forms/form-shell';
import { FormSection } from '@/components/forms/form-section';
import { FormActionBar } from '@/components/forms/form-action-bar';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { CharacterCountTextarea } from '@/components/ui/character-count-textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { staggerContainer } from '@/components/fleet/motion';
import {
  COUNTRIES,
  DEFAULT_FORM_OPTIONS,
  FORM_LIMITS,
  INDIAN_STATES,
  PLACEHOLDERS,
} from '@/constants/form';
import { useUnsavedChangesWarning } from '@/hooks/use-unsaved-changes';
import {
  VehicleStatus,
  VehicleType,
  FuelType,
  type VehicleFormValues,
} from '@/types/fleet';
import { parseVehicleUniqueConflict } from '@/lib/vehicle-form-errors';
import { optionalString, sanitizeTextInput, uppercase } from '@/utils/form-sanitize';
import { enhanceRegister } from '@/utils/form-register';
import {
  employeeCodeField,
  optionalTrimmedString,
  requiredTrimmedString,
  urlField,
  vehicleNumberField,
} from '@/utils/form-validation';

const vehicleFormSchema = z
  .object({
    vehicleId: employeeCodeField,
    registrationNumber: vehicleNumberField,
    vin: z
      .string()
      .optional()
      .or(z.literal(''))
      .refine((value) => !value || (value.length >= 11 && value.length <= 17), {
        message: 'VIN must be 11–17 characters when provided',
      }),
    make: requiredTrimmedString('Make', 80),
    model: requiredTrimmedString('Model', 80),
    year: z.coerce.number().min(1980).max(2100).optional(),
    vehicleType: z.nativeEnum(VehicleType),
    fuelType: z.nativeEnum(FuelType),
    color: optionalTrimmedString(FORM_LIMITS.name),
    seatingCapacity: z.coerce.number().min(1).max(200).optional(),
    maxCapacity: z.coerce
      .number({ invalid_type_error: 'Maximum load capacity is required' })
      .min(1, 'Maximum load capacity must be at least 1 kg')
      .max(500, 'Maximum load capacity must not exceed 500 kg'),
    mileage: z.coerce.number().min(0, 'Mileage cannot be negative.'),
    purchaseDate: z.string().optional(),
    registrationExpiryDate: z.string().min(1, 'Registration expiry date is required.'),
    insuranceExpiryDate: z.string().min(1, 'Insurance expiry date is required.'),
    fitnessCertificateExpiryDate: z.string().min(1, 'Fitness certificate expiry is required.'),
    lastServiceDate: z.string().optional(),
    nextServiceDueDate: z.string().optional(),
    depotCity: optionalTrimmedString(FORM_LIMITS.name),
    depotState: z.string().optional(),
    country: z.string().optional(),
    photo: urlField('Photo URL'),
    remarks: optionalTrimmedString(FORM_LIMITS.textarea),
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

export function VehicleForm({
  defaultValues,
  submitting,
  submitLabel = 'Save Vehicle',
  onSubmit,
  onCancel,
}: VehicleFormProps) {
  const reduceMotion = useSafeReducedMotion();

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    watch,
    control,
    formState: { errors, isDirty },
  } = useForm<VehicleFormSchema>({
    ...DEFAULT_FORM_OPTIONS,
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: { ...emptyDefaults, ...defaultValues },
  });

  useUnsavedChangesWarning(isDirty, !submitting);

  const clean = (values: VehicleFormSchema): VehicleFormValues => ({
    ...values,
    vehicleId: values.vehicleId.trim(),
    registrationNumber: values.registrationNumber.trim(),
    vin: optionalString(values.vin),
    make: values.make.trim(),
    model: values.model.trim(),
    color: optionalString(values.color),
    maxCapacity: Number(values.maxCapacity),
    purchaseDate: optionalString(values.purchaseDate),
    lastServiceDate: optionalString(values.lastServiceDate),
    nextServiceDueDate: optionalString(values.nextServiceDueDate),
    depotCity: optionalString(values.depotCity),
    depotState: optionalString(values.depotState),
    country: optionalString(values.country),
    photo: optionalString(values.photo),
    remarks: optionalString(values.remarks),
  });

  return (
    <>
      <motion.form
        id="vehicle-form"
        className="space-y-5 pb-28"
        variants={staggerContainer}
        initial={reduceMotion ? false : 'hidden'}
        animate="show"
        noValidate
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
        <FormShell submitting={submitting}>
        <FormSection title="Vehicle Identity">
          <FormField label="Vehicle ID" htmlFor="vehicleId" required error={errors.vehicleId?.message}>
            <Input
              id="vehicleId"
              maxLength={FORM_LIMITS.employeeCode}
              placeholder={PLACEHOLDERS.vehicleId}
              {...enhanceRegister(register('vehicleId'), {
                transform: (v) => uppercase(sanitizeTextInput(v), FORM_LIMITS.employeeCode),
              })}
            />
          </FormField>
          <FormField
            label="Registration Number"
            htmlFor="registrationNumber"
            required
            error={errors.registrationNumber?.message}
          >
            <Input
              id="registrationNumber"
              maxLength={FORM_LIMITS.vehicleNumber}
              placeholder={PLACEHOLDERS.vehicleNumber}
              {...enhanceRegister(register('registrationNumber'), {
                transform: (v) => uppercase(sanitizeTextInput(v), FORM_LIMITS.vehicleNumber),
              })}
            />
          </FormField>
          <FormField label="VIN" htmlFor="vin" error={errors.vin?.message}>
            <Input
              id="vin"
              maxLength={17}
              placeholder="Example: 1HGCM82633A004352 (optional)"
              {...enhanceRegister(register('vin'), {
                transform: (v) => uppercase(sanitizeTextInput(v), 17),
              })}
            />
          </FormField>
          <FormField label="Make" htmlFor="make" required error={errors.make?.message}>
            <Input
              id="make"
              maxLength={80}
              placeholder="Example: Tata"
              {...enhanceRegister(register('make'), {
                transform: (v) => sanitizeTextInput(v, 80),
              })}
            />
          </FormField>
          <FormField label="Model" htmlFor="model" required error={errors.model?.message}>
            <Input
              id="model"
              maxLength={80}
              placeholder="Example: Starbus Ultra"
              {...enhanceRegister(register('model'), {
                transform: (v) => sanitizeTextInput(v, 80),
              })}
            />
          </FormField>
          <FormField label="Year" htmlFor="year" error={errors.year?.message}>
            <Input
              id="year"
              type="number"
              inputMode="numeric"
              min={1980}
              max={2100}
              placeholder="Example: 2022"
              {...register('year')}
            />
          </FormField>
        </FormSection>

        <FormSection title="Specifications">
          <FormField label="Vehicle Type" htmlFor="vehicleType" required error={errors.vehicleType?.message}>
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
          <FormField label="Fuel Type" htmlFor="fuelType" required error={errors.fuelType?.message}>
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
            <Input id="color" maxLength={FORM_LIMITS.name} placeholder="Example: White" {...register('color')} />
          </FormField>
          <FormField
            label="Seating Capacity"
            htmlFor="seatingCapacity"
            error={errors.seatingCapacity?.message}
          >
            <Input id="seatingCapacity" type="number" min={1} {...register('seatingCapacity')} />
          </FormField>
          <FormField
            label="Maximum Load Capacity (kg)"
            htmlFor="maxCapacity"
            required
            error={errors.maxCapacity?.message}
          >
            <Input
              id="maxCapacity"
              type="number"
              step={1}
              min={1}
              max={500}
              placeholder="e.g. 500"
              {...register('maxCapacity')}
            />
          </FormField>
          <FormField label="Mileage (km)" htmlFor="mileage" error={errors.mileage?.message}>
            <Input
              id="mileage"
              type="number"
              inputMode="numeric"
              min={0}
              placeholder={PLACEHOLDERS.odometer}
              {...register('mileage')}
            />
          </FormField>
          <FormField label="Purchase Date" htmlFor="purchaseDate" error={errors.purchaseDate?.message}>
            <Controller
              name="purchaseDate"
              control={control}
              render={({ field }) => (
                <DatePicker
                  id="purchaseDate"
                  value={field.value}
                  onChange={field.onChange}
                  disableFuture
                />
              )}
            />
          </FormField>
        </FormSection>

        <FormSection title="Compliance">
          <FormField
            label="Registration Expiry"
            htmlFor="registrationExpiryDate"
            required
            description="Vehicle cannot operate after registration expiry."
            error={errors.registrationExpiryDate?.message}
          >
            <Controller
              name="registrationExpiryDate"
              control={control}
              render={({ field }) => (
                <DatePicker
                  id="registrationExpiryDate"
                  value={field.value}
                  onChange={field.onChange}
                  requireFuture
                />
              )}
            />
          </FormField>
          <FormField
            label="Insurance Expiry"
            htmlFor="insuranceExpiryDate"
            required
            error={errors.insuranceExpiryDate?.message}
          >
            <Controller
              name="insuranceExpiryDate"
              control={control}
              render={({ field }) => (
                <DatePicker
                  id="insuranceExpiryDate"
                  value={field.value}
                  onChange={field.onChange}
                  requireFuture
                />
              )}
            />
          </FormField>
          <FormField
            label="Fitness Certificate Expiry"
            htmlFor="fitnessCertificateExpiryDate"
            required
            error={errors.fitnessCertificateExpiryDate?.message}
          >
            <Controller
              name="fitnessCertificateExpiryDate"
              control={control}
              render={({ field }) => (
                <DatePicker
                  id="fitnessCertificateExpiryDate"
                  value={field.value}
                  onChange={field.onChange}
                  requireFuture
                />
              )}
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
        </FormSection>

        <FormSection title="Service & Depot">
          <FormField
            label="Last Service Date"
            htmlFor="lastServiceDate"
            error={errors.lastServiceDate?.message}
          >
            <Controller
              name="lastServiceDate"
              control={control}
              render={({ field }) => (
                <DatePicker
                  id="lastServiceDate"
                  value={field.value}
                  onChange={field.onChange}
                  disableFuture
                />
              )}
            />
          </FormField>
          <FormField
            label="Next Service Due"
            htmlFor="nextServiceDueDate"
            error={errors.nextServiceDueDate?.message}
          >
            <Controller
              name="nextServiceDueDate"
              control={control}
              render={({ field }) => (
                <DatePicker
                  id="nextServiceDueDate"
                  value={field.value}
                  onChange={field.onChange}
                  minDate={watch('lastServiceDate') || undefined}
                />
              )}
            />
          </FormField>
          <FormField label="Depot City" htmlFor="depotCity" error={errors.depotCity?.message}>
            <Input id="depotCity" maxLength={FORM_LIMITS.name} placeholder={PLACEHOLDERS.city} {...register('depotCity')} />
          </FormField>
          <FormField label="Depot State" htmlFor="depotState" error={errors.depotState?.message}>
            <Select
              value={watch('depotState') || undefined}
              onValueChange={(value) => setValue('depotState', value, { shouldValidate: true })}
            >
              <SelectTrigger id="depotState">
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                {INDIAN_STATES.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Country" htmlFor="country" error={errors.country?.message}>
            <Select
              value={watch('country') || undefined}
              onValueChange={(value) => setValue('country', value, { shouldValidate: true })}
            >
              <SelectTrigger id="country">
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Remarks" htmlFor="remarks" error={errors.remarks?.message} className="md:col-span-2">
            <CharacterCountTextarea
              id="remarks"
              rows={3}
              maxLength={FORM_LIMITS.textarea}
              placeholder={PLACEHOLDERS.notes}
              {...register('remarks')}
            />
          </FormField>
        </FormSection>
        </FormShell>
      </motion.form>

      <FormActionBar
        formId="vehicle-form"
        submitting={submitting}
        submitLabel={submitLabel}
        onCancel={onCancel}
        isDirty={isDirty}
      />
    </>
  );
}
