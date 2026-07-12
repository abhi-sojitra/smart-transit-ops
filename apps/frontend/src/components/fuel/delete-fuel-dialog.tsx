'use client';

import type { FuelLog } from '@transitops/shared-types';
import { ConfirmationDialog } from '@/components/feedback/confirmation-dialog';

interface DeleteFuelDialogProps {
  fuel: FuelLog | null;
  open: boolean;
  loading?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function DeleteFuelDialog({
  fuel,
  open,
  loading,
  onOpenChange,
  onConfirm,
}: DeleteFuelDialogProps) {
  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete fuel log?"
      description={
        fuel
          ? `Soft-delete fuel log for ${fuel.vehicleId} at ${fuel.fuelStation}. It will no longer appear in fuel lists.`
          : 'This fuel log will be soft-deleted.'
      }
      confirmLabel="Delete"
      variant="danger"
      loading={loading}
      onConfirm={onConfirm}
    />
  );
}
