'use client';

import { useParams, useRouter } from 'next/navigation';
import { AxiosError } from 'axios';
import { motion } from 'framer-motion';
import { useSafeReducedMotion } from '@/hooks/use-safe-reduced-motion';
import { PageHeader } from '@/components/layout/page-header';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/feedback/empty-state';
import { VehicleForm } from '@/components/fleet/vehicle-form';
import { pageFade } from '@/components/fleet/motion';
import { useUpdateVehicleMutation, useVehicleQuery } from '@/hooks/use-fleet';

function toDateInput(value?: string) {
  if (!value) return '';
  return value.slice(0, 10);
}

export default function EditVehiclePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;
  const reduceMotion = useSafeReducedMotion();

  const { data: vehicle, isLoading, error } = useVehicleQuery(id);
  const updateMutation = useUpdateVehicleMutation(id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !vehicle) {
    const message =
      error instanceof AxiosError
        ? ((error.response?.data as { message?: string })?.message ?? error.message)
        : 'Vehicle not found';
    return <EmptyState title="Unable to edit vehicle" description={message} />;
  }

  return (
    <motion.div
      className="space-y-6"
      variants={pageFade}
      initial={reduceMotion ? false : 'hidden'}
      animate="show"
    >
      <div>
        <Breadcrumb
          items={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Fleet', href: '/fleet' },
            { label: vehicle.vehicleId, href: `/fleet/${vehicle.id}` },
            { label: 'Edit' },
          ]}
        />
        <PageHeader
          title={`Edit ${vehicle.make} ${vehicle.model}`}
          description="Update vehicle specifications, compliance dates, and depot assignment."
        />
      </div>

      <VehicleForm
        submitting={updateMutation.isPending}
        submitLabel="Save Changes"
        onCancel={() => router.push(`/fleet/${vehicle.id}`)}
        defaultValues={{
          vehicleId: vehicle.vehicleId,
          registrationNumber: vehicle.registrationNumber,
          vin: vehicle.vin ?? '',
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          vehicleType: vehicle.vehicleType,
          fuelType: vehicle.fuelType,
          color: vehicle.color ?? '',
          seatingCapacity: vehicle.seatingCapacity,
          maxCapacity: vehicle.maxCapacity,
          mileage: vehicle.mileage,
          purchaseDate: toDateInput(vehicle.purchaseDate),
          registrationExpiryDate: toDateInput(vehicle.registrationExpiryDate),
          insuranceExpiryDate: toDateInput(vehicle.insuranceExpiryDate),
          fitnessCertificateExpiryDate: toDateInput(vehicle.fitnessCertificateExpiryDate),
          lastServiceDate: toDateInput(vehicle.lastServiceDate),
          nextServiceDueDate: toDateInput(vehicle.nextServiceDueDate),
          depotCity: vehicle.depotCity ?? '',
          depotState: vehicle.depotState ?? '',
          country: vehicle.country ?? 'India',
          photo: vehicle.photo ?? '',
          remarks: vehicle.remarks ?? '',
          status: vehicle.status,
        }}
        onSubmit={async (values) => {
          await updateMutation.mutateAsync(values);
          router.push(`/fleet/${vehicle.id}`);
        }}
      />
    </motion.div>
  );
}
