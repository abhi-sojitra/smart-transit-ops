'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  MaintenancePriority,
  MaintenanceStatus,
  MaintenanceType,
} from '@transitops/shared-types';
import { FormField } from '@/components/forms/form-field';
import { FormShell } from '@/components/forms/form-shell';
import { Input } from '@/components/ui/input';
import { InputAffix } from '@/components/ui/input-affix';
import { DatePicker } from '@/components/ui/date-picker';
import { VehicleSelect } from '@/components/fleet/vehicle-select';
import { CharacterCountTextarea } from '@/components/ui/character-count-textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MAINTENANCE_PRIORITY_OPTIONS,
  MAINTENANCE_TYPE_OPTIONS,
  type MaintenanceFormValues,
  type VehicleLookup,
} from '@/types/maintenance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DEFAULT_FORM_OPTIONS, FILE_UPLOAD, FORM_LIMITS, PLACEHOLDERS } from '@/constants/form';
import { addDaysToDateInput } from '@/utils/date';
import { digitsOnly, positiveDecimal, sanitizeTextInput } from '@/utils/form-sanitize';
import { enhanceRegister } from '@/utils/form-register';
import { optionalPhoneField, positiveAmountField, requiredTrimmedString } from '@/utils/form-validation';

const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
const ALLOWED_FILE_EXT = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf'];

function toDateOnly(value: string): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function todayIsoDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function isAllowedFile(file: File): boolean {
  const name = file.name.toLowerCase();
  const extOk = ALLOWED_FILE_EXT.some((ext) => name.endsWith(ext));
  return ALLOWED_FILE_TYPES.includes(file.type) || extOk;
}

const schema = z
  .object({
    vehicleId: z.string().min(1, 'Vehicle is required.'),
    maintenanceType: z.nativeEnum(MaintenanceType, {
      errorMap: () => ({ message: 'Maintenance type is required.' }),
    }),
    title: requiredTrimmedString('Title', 100),
    description: z
      .string()
      .max(FORM_LIMITS.textarea, `Description must be at most ${FORM_LIMITS.textarea} characters.`)
      .optional()
      .or(z.literal('')),
    priority: z.nativeEnum(MaintenancePriority, {
      errorMap: () => ({ message: 'Priority is required.' }),
    }),
    startDate: z.string().min(1, 'Start date is required.'),
    expectedCompletionDate: z.string().min(1, 'Expected completion date is required.'),
    estimatedCost: positiveAmountField('Estimated cost'),
    actualCost: z.union([positiveAmountField('Actual cost'), z.literal('')]).optional(),
    vendorName: z.string().max(FORM_LIMITS.text).optional(),
    vendorPhone: optionalPhoneField('Vendor phone'),
    serviceCenter: z.string().max(FORM_LIMITS.text).optional(),
    odometerReading: z.union([z.coerce.number().min(0), z.literal('')]).optional(),
    nextServiceDue: z.string().optional().or(z.literal('')),
    notes: z
      .string()
      .max(FORM_LIMITS.textarea, `Notes must be at most ${FORM_LIMITS.textarea} characters.`)
      .optional()
      .or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    const today = toDateOnly(todayIsoDate());
    const start = toDateOnly(data.startDate);
    const expected = toDateOnly(data.expectedCompletionDate);

    if (start < today) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Start date must be today or a future date',
        path: ['startDate'],
      });
    }

    if (expected < today) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Expected completion must be today or a future date',
        path: ['expectedCompletionDate'],
      });
    }

    if (expected < start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Expected completion cannot be before start date',
        path: ['expectedCompletionDate'],
      });
    }

    if (data.nextServiceDue) {
      const nextDue = toDateOnly(data.nextServiceDue);
      if (nextDue <= expected) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Next service due must be after expected completion',
          path: ['nextServiceDue'],
        });
      }
    }
  });

interface MaintenanceFormProps {
  mode: 'create' | 'edit';
  initialValues?: Partial<MaintenanceFormValues>;
  vehicles?: VehicleLookup[];
  status?: MaintenanceStatus;
  loading?: boolean;
  onSubmit: (values: MaintenanceFormValues) => void;
  onFilesSelected?: (files: File[]) => void;
}

export function MaintenanceForm({
  mode,
  initialValues,
  status,
  loading,
  onSubmit,
  onFilesSelected,
}: MaintenanceFormProps) {
  const notesOnly = status === MaintenanceStatus.COMPLETED;
  const [fileError, setFileError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<MaintenanceFormValues>({
    ...DEFAULT_FORM_OPTIONS,
    resolver: zodResolver(schema),
    defaultValues: {
      vehicleId: '',
      maintenanceType: MaintenanceType.PREVENTIVE,
      title: '',
      description: '',
      priority: MaintenancePriority.MEDIUM,
      startDate: '',
      expectedCompletionDate: '',
      estimatedCost: undefined as unknown as number,
      actualCost: '',
      vendorName: '',
      vendorPhone: '',
      serviceCenter: '',
      odometerReading: '',
      nextServiceDue: '',
      notes: '',
      ...initialValues,
    },
  });

  const vehicleId = watch('vehicleId');
  const startDate = watch('startDate');
  const expectedCompletionDate = watch('expectedCompletionDate');
  const maintenanceType = watch('maintenanceType');
  const priority = watch('priority');
  const title = watch('title') ?? '';
  const description = watch('description') ?? '';
  const notes = watch('notes') ?? '';

  const nextServiceMinDate = addDaysToDateInput(expectedCompletionDate, 1);

  const handleFiles = (fileList: FileList | null) => {
    if (!onFilesSelected || !fileList?.length) return;
    const files = Array.from(fileList);
    const invalid = files.filter((file) => !isAllowedFile(file));
    if (invalid.length) {
      const message = 'Only image and PDF files are allowed';
      setFileError(message);
      toast.error(message);
      return;
    }
    setFileError(null);
    onFilesSelected(files);
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <FormShell submitting={loading}>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Vehicle</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField label="Vehicle" htmlFor="vehicleId" required error={errors.vehicleId?.message}>
            <VehicleSelect
              id="vehicleId"
              value={vehicleId}
              valueKey="id"
              disabled={mode === 'edit' || notesOnly}
              onChange={(v) => setValue('vehicleId', v, { shouldValidate: true })}
              onVehicleSelect={(vehicle) => {
                if (vehicle && mode === 'create') {
                  setValue('odometerReading', vehicle.mileage ?? '');
                }
              }}
              aria-invalid={Boolean(errors.vehicleId)}
            />
          </FormField>
          <FormField
            label="Odometer"
            htmlFor="odometerReading"
            error={errors.odometerReading?.message as string | undefined}
          >
            <Input
              id="odometerReading"
              type="number"
              disabled={notesOnly}
              {...register('odometerReading')}
            />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Maintenance</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField label="Type" htmlFor="maintenanceType" error={errors.maintenanceType?.message}>
            <Select
              value={maintenanceType}
              disabled={notesOnly}
              onValueChange={(v) =>
                setValue('maintenanceType', v as MaintenanceType, { shouldValidate: true })
              }
            >
              <SelectTrigger id="maintenanceType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MAINTENANCE_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Priority" htmlFor="priority" error={errors.priority?.message}>
            <Select
              value={priority}
              disabled={notesOnly}
              onValueChange={(v) =>
                setValue('priority', v as MaintenancePriority, { shouldValidate: true })
              }
            >
              <SelectTrigger id="priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MAINTENANCE_PRIORITY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField
            label="Title"
            htmlFor="title"
            required
            error={errors.title?.message}
            counter={`${title.length}/100`}
            className="md:col-span-2"
          >
            <Input
              id="title"
              maxLength={100}
              disabled={notesOnly}
              placeholder="Example: Engine oil change and filter replacement"
              {...enhanceRegister(register('title'), {
                transform: (v) => sanitizeTextInput(v, 100),
              })}
            />
          </FormField>
          <FormField
            label="Description"
            htmlFor="description"
            error={errors.description?.message}
            counter={`${description.length}/${FORM_LIMITS.textarea}`}
            className="md:col-span-2"
          >
            <CharacterCountTextarea
              id="description"
              maxLength={FORM_LIMITS.textarea}
              disabled={notesOnly}
              placeholder="Describe the maintenance work (optional)"
              {...register('description')}
            />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Vendor</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <FormField label="Vendor Name" htmlFor="vendorName">
            <Input
              id="vendorName"
              disabled={notesOnly}
              maxLength={FORM_LIMITS.text}
              placeholder={PLACEHOLDERS.vendorName}
              {...register('vendorName')}
            />
          </FormField>
          <FormField label="Vendor Phone" htmlFor="vendorPhone" error={errors.vendorPhone?.message}>
            <Input
              id="vendorPhone"
              type="tel"
              inputMode="numeric"
              disabled={notesOnly}
              maxLength={FORM_LIMITS.phone}
              placeholder={PLACEHOLDERS.phone}
              {...enhanceRegister(register('vendorPhone'), {
                transform: (v) => digitsOnly(v, FORM_LIMITS.phone),
              })}
            />
          </FormField>
          <FormField label="Service Center" htmlFor="serviceCenter">
            <Input
              id="serviceCenter"
              disabled={notesOnly}
              maxLength={FORM_LIMITS.text}
              placeholder={PLACEHOLDERS.serviceCenter}
              {...register('serviceCenter')}
            />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Schedule</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <FormField label="Start date" htmlFor="startDate" error={errors.startDate?.message}>
            <Controller
              name="startDate"
              control={control}
              render={({ field }) => (
                <DatePicker
                  id="startDate"
                  value={field.value}
                  onChange={field.onChange}
                  disabled={notesOnly}
                  disablePast
                />
              )}
            />
          </FormField>
          <FormField
            label="Expected completion"
            htmlFor="expectedCompletionDate"
            error={errors.expectedCompletionDate?.message}
          >
            <Controller
              name="expectedCompletionDate"
              control={control}
              render={({ field }) => (
                <DatePicker
                  id="expectedCompletionDate"
                  value={field.value}
                  onChange={field.onChange}
                  disabled={notesOnly}
                  disablePast
                  minDate={startDate || undefined}
                />
              )}
            />
          </FormField>
          <FormField
            label="Next service due"
            htmlFor="nextServiceDue"
            error={errors.nextServiceDue?.message}
          >
            <Controller
              name="nextServiceDue"
              control={control}
              render={({ field }) => (
                <DatePicker
                  id="nextServiceDue"
                  value={field.value}
                  onChange={field.onChange}
                  disabled={notesOnly}
                  minDate={nextServiceMinDate}
                  requireFuture={!nextServiceMinDate}
                />
              )}
            />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cost</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField
            label="Estimated Cost"
            htmlFor="estimatedCost"
            required
            error={errors.estimatedCost?.message}
          >
            <InputAffix
              id="estimatedCost"
              prefix="₹"
              inputMode="decimal"
              disabled={notesOnly}
              placeholder={PLACEHOLDERS.cost}
              {...enhanceRegister(register('estimatedCost'), {
                transform: (v) => positiveDecimal(String(v)),
              })}
            />
          </FormField>
          <FormField
            label="Actual Cost"
            htmlFor="actualCost"
            error={errors.actualCost?.message as string | undefined}
          >
            <InputAffix
              id="actualCost"
              prefix="₹"
              inputMode="decimal"
              disabled={notesOnly}
              placeholder={PLACEHOLDERS.cost}
              {...enhanceRegister(register('actualCost'), {
                transform: (v) => positiveDecimal(String(v)),
              })}
            />
          </FormField>
        </CardContent>
      </Card>

      {onFilesSelected ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Files</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="file"
              multiple
              accept={FILE_UPLOAD.accept}
              onChange={(e) => {
                handleFiles(e.target.files);
                e.target.value = '';
              }}
            />
            <p className="mt-2 text-xs text-muted-foreground">{FILE_UPLOAD.acceptLabel}</p>
            {fileError ? <p className="mt-1 text-xs text-destructive">{fileError}</p> : null}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <FormField
            label="Internal Notes"
            htmlFor="notes"
            error={errors.notes?.message}
            counter={`${notes.length}/${FORM_LIMITS.textarea}`}
          >
            <CharacterCountTextarea
              id="notes"
              maxLength={FORM_LIMITS.textarea}
              placeholder={PLACEHOLDERS.notes}
              {...register('notes')}
            />
          </FormField>
          {notesOnly ? (
            <p className="mt-2 text-xs text-amber-500">
              Completed maintenance can only update notes.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="submit" loading={loading}>
          {mode === 'create' ? 'Create maintenance' : 'Save changes'}
        </Button>
      </div>
      </FormShell>
    </form>
  );
}
