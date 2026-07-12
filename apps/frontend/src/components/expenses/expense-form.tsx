'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, useReducedMotion } from 'framer-motion';
import { ExpenseStatus, ExpenseType } from '@transitops/shared-types';
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
import { expenseFormSchema, type ExpenseFormValues } from '@/types/fuel-expense';
import { toDateInput } from '@/utils/date';

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
  amount: 0,
  expenseDate: toDateInput(new Date()),
  receiptImage: '',
  status: ExpenseStatus.PENDING,
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

export function ExpenseForm({
  defaultValues,
  submitting,
  submitLabel = 'Save Expense',
  showStatus = false,
  onSubmit,
  onCancel,
}: ExpenseFormProps) {
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
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: { ...emptyDefaults, ...defaultValues },
  });

  const expenseType = watch('expenseType');
  const status = watch('status');
  const vehicleId = watch('vehicleId');
  const actionBarLeft = isDesktop ? (sidebarCollapsed ? 72 : 260) : 0;

  const clean = (values: ExpenseFormValues): ExpenseFormValues => ({
    ...values,
    vehicleId: values.vehicleId.trim(),
    tripId: values.tripId?.trim() || undefined,
    driverId: values.driverId?.trim() || undefined,
    title: values.title.trim(),
    description: values.description?.trim() || undefined,
    receiptImage: values.receiptImage?.trim() || undefined,
    notes: values.notes?.trim() || undefined,
  });

  return (
    <>
      <motion.form
        id="expense-form"
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

        <Section title="Expense Details">
          <FormField label="Expense Type" htmlFor="expenseType" error={errors.expenseType?.message}>
            <Select
              value={expenseType}
              onValueChange={(v) => setValue('expenseType', v as ExpenseType, { shouldValidate: true })}
            >
              <SelectTrigger id="expenseType">
                <SelectValue placeholder="Select type" />
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
          <FormField label="Expense Date" htmlFor="expenseDate" error={errors.expenseDate?.message}>
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
            error={errors.title?.message}
            className="md:col-span-2"
          >
            <Input id="title" placeholder="Highway Toll - I-95" {...register('title')} />
          </FormField>
          <FormField
            label="Description"
            htmlFor="description"
            error={errors.description?.message}
            className="md:col-span-2"
          >
            <Textarea id="description" rows={2} {...register('description')} />
          </FormField>
        </Section>

        <Section title="Cost">
          <FormField label="Amount" htmlFor="amount" error={errors.amount?.message}>
            <Input id="amount" type="number" step="0.01" {...register('amount')} />
          </FormField>
          {showStatus ? (
            <FormField label="Status" htmlFor="status" error={errors.status?.message}>
              <Select
                value={status}
                onValueChange={(v) => setValue('status', v as ExpenseStatus, { shouldValidate: true })}
              >
                <SelectTrigger id="status">
                  <SelectValue />
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
          <Button type="submit" form="expense-form" loading={submitting}>
            {submitLabel}
          </Button>
        </div>
      </motion.div>
    </>
  );
}
