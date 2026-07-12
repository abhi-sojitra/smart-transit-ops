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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { TripRecord } from '@/types/trip';

const schema = z.object({
  actualDistance: z.coerce.number().min(0),
  fuelConsumed: z.coerce.number().min(0),
  actualRevenue: z.coerce.number().min(0),
  notes: z.string().optional(),
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
        <form className="space-y-4" onSubmit={handleSubmit(onConfirm)}>
          <FormField label="Actual distance (mi)" htmlFor="actualDistance" error={errors.actualDistance?.message}>
            <Input id="actualDistance" type="number" step="0.1" {...register('actualDistance')} />
          </FormField>
          <FormField label="Fuel consumed" htmlFor="fuelConsumed" error={errors.fuelConsumed?.message}>
            <Input id="fuelConsumed" type="number" step="0.1" {...register('fuelConsumed')} />
          </FormField>
          <FormField label="Actual revenue" htmlFor="actualRevenue" error={errors.actualRevenue?.message}>
            <Input id="actualRevenue" type="number" step="0.01" {...register('actualRevenue')} />
          </FormField>
          <FormField label="Notes" htmlFor="completeNotes">
            <Textarea id="completeNotes" {...register('notes')} />
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
