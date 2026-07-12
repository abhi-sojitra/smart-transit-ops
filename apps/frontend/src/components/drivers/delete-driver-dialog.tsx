'use client';

import { ConfirmationDialog } from '@/components/feedback/confirmation-dialog';
import { getDriverDisplayName } from '@/components/drivers/driver-display';
import type { Driver } from '@/types/driver';

interface DeleteDriverDialogProps {
  driver: Driver | null;
  open: boolean;
  loading?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function DeleteDriverDialog({
  driver,
  open,
  loading,
  onOpenChange,
  onConfirm,
}: DeleteDriverDialogProps) {
  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete driver?"
      description={
        driver
          ? `Soft-delete ${getDriverDisplayName(driver)} (${driver.employeeCode || '—'}). They will no longer appear in driver lists.`
          : 'This driver will be soft-deleted.'
      }
      confirmLabel="Delete"
      variant="danger"
      loading={loading}
      onConfirm={onConfirm}
    />
  );
}
