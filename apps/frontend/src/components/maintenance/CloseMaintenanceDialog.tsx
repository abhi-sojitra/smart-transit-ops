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
import { positiveAmountField } from '@/utils/form-validation';

const schema = z.object({
  actualCost: positiveAmountField('Actual cost'),
  notes: z.string().max(FORM_LIMITS.textarea).optional(),
});

type FormValues = z.infer<typeof schema>;

interface CloseMaintenanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  estimatedCost?: number;
  loading?: boolean;
  onConfirm: (payload: { actualCost?: number; notes?: string }) => void;
}

export function CloseMaintenanceDialog({
  open,
  onOpenChange,
  estimatedCost,
  loading,
  onConfirm,
}: CloseMaintenanceDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    ...DEFAULT_FORM_OPTIONS,
    resolver: zodResolver(schema),
    defaultValues: {
      actualCost: estimatedCost ?? (undefined as unknown as number),
      notes: '',
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) {
          reset({
            actualCost: estimatedCost ?? (undefined as unknown as number),
            notes: '',
          });
        }
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Complete maintenance</DialogTitle>
          <DialogDescription>
            Marks the work order completed and restores the vehicle to Available (unless retired).
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          noValidate
          onSubmit={handleSubmit((values) =>
            onConfirm({
              actualCost: values.actualCost,
              notes: values.notes?.trim() || undefined,
            }),
          )}
        >
          <FormField
            label="Actual Cost"
            htmlFor="close-actual-cost"
            required
            error={errors.actualCost?.message}
          >
            <InputAffix
              id="close-actual-cost"
              prefix="₹"
              inputMode="decimal"
              placeholder={PLACEHOLDERS.cost}
              {...enhanceRegister(register('actualCost'), {
                transform: (v) => positiveDecimal(String(v)),
              })}
            />
          </FormField>
          <FormField label="Notes" htmlFor="close-notes" error={errors.notes?.message}>
            <CharacterCountTextarea
              id="close-notes"
              maxLength={FORM_LIMITS.textarea}
              placeholder={PLACEHOLDERS.notes}
              {...register('notes')}
            />
          </FormField>
          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Complete
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
