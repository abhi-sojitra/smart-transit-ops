'use client';

import { useRouter } from 'next/navigation';
import { use } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FuelForm } from '@/components/fuel/FuelForm';
import { useFuelDetail, useUpdateFuel } from '@/hooks/use-fuel';
import type { FuelFormValues } from '@/types/fuel-expense';
import { notify } from '@/utils/notify';

export default function EditFuelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: fuel, isLoading } = useFuelDetail(id);
  const updateFuel = useUpdateFuel();

  const handleSubmit = async (values: FuelFormValues) => {
    try {
      await updateFuel.mutateAsync({
        id,
        payload: {
          ...values,
          tripId: values.tripId || undefined,
          driverId: values.driverId || undefined,
          receiptImage: values.receiptImage || undefined,
          notes: values.notes || undefined,
        },
      });
      notify.fuelUpdated();
      router.push(`/fuel/${id}`);
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Failed to update fuel log');
    }
  };

  if (isLoading) {
    return <Skeleton className="h-96 w-full max-w-3xl rounded-xl" />;
  }

  if (!fuel) {
    return <p className="text-sm text-red-500">Fuel log not found.</p>;
  }

  return (
    <div className="space-y-6">
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

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="text-base">Fuel Details</CardTitle>
        </CardHeader>
        <CardContent>
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
            onSubmit={handleSubmit}
            loading={updateFuel.isPending}
            submitLabel="Update Fuel Log"
          />
        </CardContent>
      </Card>
    </div>
  );
}
