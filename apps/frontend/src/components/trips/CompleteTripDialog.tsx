'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/forms/form-field';
import { InputAffix } from '@/components/ui/input-affix';
import { CharacterCountTextarea } from '@/components/ui/character-count-textarea';
import { DEFAULT_FORM_OPTIONS, FORM_LIMITS, PLACEHOLDERS } from '@/constants/form';
import { positiveDecimal } from '@/utils/form-sanitize';
import { enhanceRegister } from '@/utils/form-register';
import { nonNegativeAmountField } from '@/utils/form-validation';
import type { TripRecord } from '@/types/trip';

const schema = z.object({
  actualDistance: nonNegativeAmountField('Actual distance'),
  fuelConsumed: nonNegativeAmountField('Fuel consumed'),
  actualRevenue: nonNegativeAmountField('Actual revenue'),
  notes: z.string().max(FORM_LIMITS.textarea).optional(),
});

type FormValues = z.infer<typeof schema>;

interface CompleteTripDialogProps {
  open: boolean;
  trip: TripRecord | null;
  loading?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (values: FormValues) => void;
}

export function CompleteTripDialog({
  open,
  trip,
  loading,
  onOpenChange,
  onConfirm,
}: CompleteTripDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    ...DEFAULT_FORM_OPTIONS,
    resolver: zodResolver(schema),
    values: {
      actualDistance: trip?.plannedDistance ?? 0,
      fuelConsumed: 0,
      actualRevenue: trip?.estimatedRevenue ?? 0,
      notes: trip?.notes ?? '',
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Complete trip {trip?.tripNumber}</DialogTitle>
          <DialogDescription>
            Capture actual distance, fuel consumed, and revenue. Vehicle and driver return to Available.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit(onConfirm)} noValidate>
          <FormField
            label="Actual Distance"
            htmlFor="actualDistance"
            required
            error={errors.actualDistance?.message}
          >
            <InputAffix
              id="actualDistance"
              suffix="km"
              inputMode="decimal"
              placeholder={PLACEHOLDERS.distance}
              {...enhanceRegister(register('actualDistance'), {
                transform: (v) => positiveDecimal(String(v)),
              })}
            />
          </FormField>
          <FormField
            label="Fuel Consumed"
            htmlFor="fuelConsumed"
            required
            error={errors.fuelConsumed?.message}
          >
            <InputAffix
              id="fuelConsumed"
              suffix="L"
              inputMode="decimal"
              placeholder={PLACEHOLDERS.fuelQuantity}
              {...enhanceRegister(register('fuelConsumed'), {
                transform: (v) => positiveDecimal(String(v)),
              })}
            />
          </FormField>
          <FormField
            label="Actual Revenue"
            htmlFor="actualRevenue"
            required
            error={errors.actualRevenue?.message}
          >
            <InputAffix
              id="actualRevenue"
              prefix="₹"
              inputMode="decimal"
              placeholder={PLACEHOLDERS.amount}
              {...enhanceRegister(register('actualRevenue'), {
                transform: (v) => positiveDecimal(String(v)),
              })}
            />
          </FormField>
          <FormField label="Notes" htmlFor="completeNotes" error={errors.notes?.message}>
            <CharacterCountTextarea
              id="completeNotes"
              maxLength={FORM_LIMITS.textarea}
              placeholder={PLACEHOLDERS.notes}
              {...register('notes')}
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button type="submit" loading={loading}>
              Complete trip
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
