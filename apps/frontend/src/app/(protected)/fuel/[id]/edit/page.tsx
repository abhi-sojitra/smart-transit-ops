'use client';

import { useRouter } from 'next/navigation';
import { use } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { PageHeader } from '@/components/layout/page-header';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { FuelForm } from '@/components/fuel';
import { pageFade } from '@/components/drivers/motion';
import { useFuelDetail, useUpdateFuel } from '@/hooks/use-fuel';
import type { FuelFormValues } from '@/types/fuel-expense';
import { toast } from 'sonner';
import { AxiosError } from 'axios';

export default function EditFuelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const { data: fuel, isLoading } = useFuelDetail(id);
  const updateMutation = useUpdateFuel();

  if (isLoading) {
    return <Skeleton className="h-96 w-full rounded-xl" />;
  }

  if (!fuel) {
    return <p className="text-sm text-red-500">Fuel log not found.</p>;
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
            { label: 'Fuel Logs', href: '/fuel' },
            { label: fuel.fuelStation, href: `/fuel/${id}` },
            { label: 'Edit' },
          ]}
        />
        <PageHeader title="Edit Fuel Log" description={`Updating ${fuel.fuelStation}`} />
      </div>

      <FuelForm
        defaultValues={{
          vehicleId: fuel.vehicleId,
          tripId: fuel.tripId,
          driverId: fuel.driverId,
          fuelStation: fuel.fuelStation,
          fuelType: fuel.fuelType,
          quantity: fuel.quantity,
          pricePerLiter: fuel.pricePerLiter,
          odometerReading: fuel.odometerReading,
          filledAt: fuel.filledAt,
          receiptImage: fuel.receiptImage,
          notes: fuel.notes,
        }}
        submitting={updateMutation.isPending}
        submitLabel="Update Fuel Log"
        onCancel={() => router.push(`/fuel/${id}`)}
        onSubmit={async (values: FuelFormValues) => {
          try {
            await updateMutation.mutateAsync({
              id,
              payload: {
                ...values,
                tripId: values.tripId || undefined,
                driverId: values.driverId || undefined,
                receiptImage: values.receiptImage || undefined,
                notes: values.notes || undefined,
              },
            });
            toast.success('Fuel log updated');
            router.push(`/fuel/${id}`);
          } catch (error) {
            const message =
              error instanceof AxiosError
                ? ((error.response?.data as { message?: string })?.message ?? error.message)
                : 'Failed to update fuel log';
            toast.error(message);
          }
        }}
      />
    </motion.div>
  );
}
