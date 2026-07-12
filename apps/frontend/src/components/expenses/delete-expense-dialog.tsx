'use client';

import type { ExpenseRecord } from '@transitops/shared-types';
import { ConfirmationDialog } from '@/components/feedback/confirmation-dialog';

interface DeleteExpenseDialogProps {
  expense: ExpenseRecord | null;
  open: boolean;
  loading?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function DeleteExpenseDialog({
  expense,
  open,
  loading,
  onOpenChange,
  onConfirm,
}: DeleteExpenseDialogProps) {
  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete expense?"
      description={
        expense
          ? `Soft-delete "${expense.title}" (${expense.vehicleId}). It will no longer appear in expense lists.`
          : 'This expense will be soft-deleted.'
      }
      confirmLabel="Delete"
      variant="danger"
      loading={loading}
      onConfirm={onConfirm}
    />
  );
}
