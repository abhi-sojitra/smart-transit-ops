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
import { Textarea } from '@/components/ui/textarea';
import type { TripRecord } from '@/types/trip';

const schema = z.object({
  reason: z.string().min(1, 'Reason is required'),
  notes: z.string().optional(),
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
        <form className="space-y-4" onSubmit={handleSubmit(onConfirm)}>
          <FormField label="Reason" htmlFor="cancelReason" error={errors.reason?.message}>
            <Textarea id="cancelReason" {...register('reason')} />
          </FormField>
          <FormField label="Notes" htmlFor="cancelNotes">
            <Textarea id="cancelNotes" {...register('notes')} />
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
