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
import { useAvailableDrivers, useAvailableVehicles } from '@/hooks/use-trips';
import type { TripRecord } from '@/types/trip';

interface DispatchDialogProps {
  open: boolean;
  trip: TripRecord | null;
  loading?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function DispatchDialog({ open, trip, loading, onOpenChange, onConfirm }: DispatchDialogProps) {
  const { data: vehicles } = useAvailableVehicles();
  const { data: drivers } = useAvailableDrivers();
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (!open || !trip) {
      setErrors([]);
      return;
    }

    const next: string[] = [];
    const vehicleId = typeof trip.vehicleId === 'string' ? trip.vehicleId : trip.vehicleId?._id;
    const driverId = typeof trip.driverId === 'string' ? trip.driverId : trip.driverId?._id;
    const vehicle = vehicles?.find((v) => v._id === vehicleId);
    const driver = drivers?.find((d) => d._id === driverId);
    const populatedVehicle = typeof trip.vehicleId === 'object' ? trip.vehicleId : undefined;
    const populatedDriver = typeof trip.driverId === 'object' ? trip.driverId : undefined;

    const capacity = vehicle?.maxCapacity ?? populatedVehicle?.maxCapacity;
    if (capacity !== undefined && trip.cargoWeight > capacity) {
      next.push(`Cargo weight exceeds vehicle capacity (${capacity}).`);
    }
    if (!vehicle && populatedVehicle?.status && populatedVehicle.status !== 'AVAILABLE' && populatedVehicle.status !== 'ACTIVE') {
      next.push(`Vehicle is not available (status: ${populatedVehicle.status}).`);
    }
    if (!driver && populatedDriver?.status && populatedDriver.status !== 'AVAILABLE') {
      next.push(`Driver is not available (status: ${populatedDriver.status}).`);
    }
    if (populatedDriver?.licenseStatus === 'EXPIRED') {
      next.push('Driver license is expired.');
    }
    if (populatedVehicle?.status === 'MAINTENANCE') {
      next.push('Vehicle is in maintenance; dispatch is blocked.');
    }

    setErrors(next);
  }, [open, trip, vehicles, drivers]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dispatch trip {trip?.tripNumber}</DialogTitle>
          <DialogDescription>
            Validate vehicle availability, driver license, capacity, and maintenance before dispatch.
          </DialogDescription>
        </DialogHeader>

        {errors.length ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            <p className="mb-1 font-medium">Validation failed</p>
            <ul className="list-disc space-y-1 pl-4">
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-500">
            Pre-dispatch checks look good. Confirm to assign vehicle and driver as On Trip.
          </div>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button loading={loading} disabled={errors.length > 0} onClick={onConfirm}>
            Dispatch
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
