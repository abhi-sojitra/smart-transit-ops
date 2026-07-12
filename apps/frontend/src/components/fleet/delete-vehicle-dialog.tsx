'use client';

import { ConfirmationDialog } from '@/components/feedback/confirmation-dialog';
import type { Vehicle } from '@/types/fleet';

interface DeleteVehicleDialogProps {
  vehicle: Vehicle | null;
  open: boolean;
  loading?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function DeleteVehicleDialog({
  vehicle,
  open,
  loading,
  onOpenChange,
  onConfirm,
}: DeleteVehicleDialogProps) {
  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete vehicle?"
      description={
        vehicle
          ? `Soft-delete ${vehicle.make} ${vehicle.model} (${vehicle.vehicleId}). It will no longer appear in fleet lists.`
          : 'This vehicle will be soft-deleted.'
      }
      confirmLabel="Delete"
      variant="danger"
      loading={loading}
      onConfirm={onConfirm}
    />
  );
}
