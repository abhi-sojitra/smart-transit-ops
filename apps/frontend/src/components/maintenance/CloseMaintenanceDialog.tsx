'use client';

import { useEffect, useState } from 'react';
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
  const [actualCost, setActualCost] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open) {
      setActualCost(estimatedCost != null ? String(estimatedCost) : '');
      setNotes('');
    }
  }, [open, estimatedCost]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Complete maintenance</DialogTitle>
          <DialogDescription>
            Marks the work order completed and restores the vehicle to Available (unless retired).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <FormField label="Actual cost" htmlFor="close-actual-cost">
            <Input
              id="close-actual-cost"
              type="number"
              min={0.01}
              step="0.01"
              value={actualCost}
              onChange={(e) => setActualCost(e.target.value)}
            />
          </FormField>
          <FormField label="Notes" htmlFor="close-notes" description={`${notes.length}/500`}>
            <Textarea
              id="close-notes"
              maxLength={500}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional completion notes"
            />
          </FormField>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            loading={loading}
            onClick={() =>
              onConfirm({
                actualCost: actualCost ? Number(actualCost) : undefined,
                notes: notes || undefined,
              })
            }
          >
            Complete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
