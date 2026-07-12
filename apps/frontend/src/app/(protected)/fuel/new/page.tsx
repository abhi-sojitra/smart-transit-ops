'use client';

import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FuelForm } from '@/components/fuel/FuelForm';
import { useCreateFuel } from '@/hooks/use-fuel';
import type { FuelFormValues } from '@/types/fuel-expense';
import { notify } from '@/utils/notify';

export default function NewFuelPage() {
  const router = useRouter();
  const createFuel = useCreateFuel();

  const handleSubmit = async (values: FuelFormValues) => {
    try {
      await createFuel.mutateAsync({
        ...values,
        tripId: values.tripId || undefined,
        driverId: values.driverId || undefined,
        receiptImage: values.receiptImage || undefined,
        notes: values.notes || undefined,
      });
      notify.fuelAdded();
      router.push('/fuel');
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Failed to add fuel log');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb
          items={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Fuel Logs', href: '/fuel' },
            { label: 'Add Fuel' },
          ]}
        />
        <PageHeader title="Add Fuel Log" description="Record a new fuel purchase for a vehicle." />
      </div>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="text-base">Fuel Details</CardTitle>
        </CardHeader>
        <CardContent>
          <FuelForm onSubmit={handleSubmit} loading={createFuel.isPending} />
        </CardContent>
      </Card>
    </div>
  );
}
