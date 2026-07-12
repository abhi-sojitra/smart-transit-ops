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
import { CharacterCountTextarea } from '@/components/ui/character-count-textarea';
import { DEFAULT_FORM_OPTIONS, FORM_LIMITS, PLACEHOLDERS } from '@/constants/form';
import { sanitizeTextInput } from '@/utils/form-sanitize';
import { enhanceRegister } from '@/utils/form-register';
import { requiredTrimmedString } from '@/utils/form-validation';
import type { TripRecord } from '@/types/trip';

const schema = z.object({
  reason: requiredTrimmedString('Cancellation reason', FORM_LIMITS.text),
  notes: z.string().max(FORM_LIMITS.textarea).optional(),
});

type FormValues = z.infer<typeof schema>;

interface CancelTripDialogProps {
  open: boolean;
  trip: TripRecord | null;
  loading?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (values: FormValues) => void;
}

export function CancelTripDialog({
  open,
  trip,
  loading,
  onOpenChange,
  onConfirm,
}: CancelTripDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    ...DEFAULT_FORM_OPTIONS,
    resolver: zodResolver(schema),
    defaultValues: { reason: '', notes: '' },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel trip {trip?.tripNumber}</DialogTitle>
          <DialogDescription>
            Cancelling restores vehicle and driver to Available when they were on this trip.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit(onConfirm)} noValidate>
          <FormField label="Reason" htmlFor="cancelReason" required error={errors.reason?.message}>
            <CharacterCountTextarea
              id="cancelReason"
              rows={3}
              maxLength={FORM_LIMITS.text}
              placeholder={PLACEHOLDERS.cancelReason}
              {...enhanceRegister(register('reason'), {
                transform: (v) => sanitizeTextInput(v, FORM_LIMITS.text),
              })}
            />
          </FormField>
          <FormField label="Notes" htmlFor="cancelNotes" error={errors.notes?.message}>
            <CharacterCountTextarea
              id="cancelNotes"
              rows={2}
              maxLength={FORM_LIMITS.textarea}
              placeholder={PLACEHOLDERS.notes}
              {...register('notes')}
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button type="submit" variant="danger" loading={loading}>
              Cancel trip
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
