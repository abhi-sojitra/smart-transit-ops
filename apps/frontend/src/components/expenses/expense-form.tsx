'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, useReducedMotion } from 'framer-motion';
import { ExpenseStatus, ExpenseType } from '@transitops/shared-types';
import { FormField } from '@/components/forms/form-field';
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
import { expenseFormSchema, type ExpenseFormValues } from '@/types/fuel-expense';
import { toDateInput } from '@/utils/date';
import { optionalString, positiveDecimal, sanitizeTextInput } from '@/utils/form-sanitize';
import { enhanceRegister } from '@/utils/form-register';

interface ExpenseFormProps {
  defaultValues?: Partial<ExpenseFormValues>;
  submitting?: boolean;
  submitLabel?: string;
  showStatus?: boolean;
  onSubmit: (values: ExpenseFormValues) => Promise<void> | void;
  onCancel?: () => void;
}

const emptyDefaults: ExpenseFormValues = {
  vehicleId: '',
  tripId: '',
  driverId: '',
  expenseType: ExpenseType.OTHER,
  title: '',
  description: '',
  amount: undefined as unknown as number,
  expenseDate: toDateInput(new Date()),
  receiptImage: '',
  status: ExpenseStatus.PENDING,
  notes: '',
};

export function ExpenseForm({
  defaultValues,
  submitting,
  submitLabel = 'Save Expense',
  showStatus = false,
  onSubmit,
  onCancel,
}: ExpenseFormProps) {
  const reduceMotion = useReducedMotion();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors, isDirty },
  } = useForm<ExpenseFormValues>({
    ...DEFAULT_FORM_OPTIONS,
    resolver: zodResolver(expenseFormSchema),
    defaultValues: { ...emptyDefaults, ...defaultValues },
  });

  useUnsavedChangesWarning(isDirty, !submitting);

  const expenseType = watch('expenseType');
  const status = watch('status');
  const vehicleId = watch('vehicleId');

  const clean = (values: ExpenseFormValues): ExpenseFormValues => ({
    ...values,
    vehicleId: values.vehicleId.trim(),
    tripId: optionalString(values.tripId),
    driverId: optionalString(values.driverId),
    title: values.title.trim(),
    description: optionalString(values.description),
    receiptImage: optionalString(values.receiptImage),
    notes: optionalString(values.notes),
  });

  return (
    <>
      <motion.form
        id="expense-form"
        className="space-y-5 pb-28"
        variants={staggerContainer}
        initial={reduceMotion ? false : 'hidden'}
        animate="show"
        noValidate
        onSubmit={handleSubmit(async (values) => {
          await onSubmit(clean(values));
        })}
      >
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
              maxLength={FORM_LIMITS.text}
              placeholder={PLACEHOLDERS.driverId}
              {...enhanceRegister(register('driverId'), {
                transform: (v) => sanitizeTextInput(v, FORM_LIMITS.text),
              })}
            />
          </FormField>
        </FormSection>

        <FormSection title="Expense Details">
          <FormField
            label="Expense Type"
            htmlFor="expenseType"
            required
            error={errors.expenseType?.message}
          >
            <Select
              value={expenseType}
              onValueChange={(v) => setValue('expenseType', v as ExpenseType, { shouldValidate: true })}
            >
              <SelectTrigger id="expenseType">
                <SelectValue placeholder="Select expense type" />
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
          <FormField
            label="Expense Date"
            htmlFor="expenseDate"
            required
            error={errors.expenseDate?.message}
          >
            <Controller
              name="expenseDate"
              control={control}
              render={({ field }) => (
                <DatePicker
                  id="expenseDate"
                  value={field.value}
                  onChange={field.onChange}
                  disableFuture
                  aria-invalid={Boolean(errors.expenseDate)}
                />
              )}
            />
          </FormField>
          <FormField
            label="Title"
            htmlFor="title"
            required
            error={errors.title?.message}
            className="md:col-span-2"
          >
            <Input
              id="title"
              maxLength={FORM_LIMITS.text}
              placeholder={PLACEHOLDERS.title}
              {...enhanceRegister(register('title'), {
                transform: (v) => sanitizeTextInput(v, FORM_LIMITS.text),
              })}
            />
          </FormField>
          <FormField
            label="Description"
            htmlFor="description"
            error={errors.description?.message}
            className="md:col-span-2"
          >
            <CharacterCountTextarea
              id="description"
              rows={2}
              maxLength={FORM_LIMITS.textarea}
              placeholder="Describe the expense (optional)"
              {...register('description')}
            />
          </FormField>
        </FormSection>

        <FormSection title="Cost">
          <FormField label="Amount" htmlFor="amount" required error={errors.amount?.message}>
            <InputAffix
              id="amount"
              prefix="₹"
              inputMode="decimal"
              placeholder={PLACEHOLDERS.amount}
              {...enhanceRegister(register('amount'), {
                transform: (v) => positiveDecimal(String(v)),
              })}
            />
          </FormField>
          {showStatus ? (
            <FormField label="Status" htmlFor="status" error={errors.status?.message}>
              <Select
                value={status}
                onValueChange={(v) => setValue('status', v as ExpenseStatus, { shouldValidate: true })}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
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
      </motion.form>

      <FormActionBar
        formId="expense-form"
        submitting={submitting}
        submitLabel={submitLabel}
        onCancel={onCancel}
        isDirty={isDirty}
      />
    </>
  );
}
