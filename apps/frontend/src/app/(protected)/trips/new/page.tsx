'use client';

import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { TripForm } from '@/components/trips/TripForm';
import { useCreateTrip } from '@/hooks/use-trips';

export default function NewTripPage() {
  const router = useRouter();
  const createTrip = useCreateTrip();

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb
          items={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Trips', href: '/trips' },
            { label: 'New' },
          ]}
        />
        <PageHeader title="Create Trip" description="Draft a new trip with vehicle and driver assignment." />
      </div>
      <TripForm
        submitLabel="Create trip"
        loading={createTrip.isPending}
        onSubmit={(values) => {
          createTrip.mutate(values, {
            onSuccess: (trip) => router.push(`/trips/${trip._id}`),
          });
        }}
      />
    </div>
  );
}
