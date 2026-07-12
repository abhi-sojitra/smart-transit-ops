'use client';

import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/feedback/empty-state';
import { TripForm } from '@/components/trips/TripForm';
import { useTrip, useUpdateTrip } from '@/hooks/use-trips';
import { TripStatus } from '@/types/trip';

export default function EditTripPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: trip, isLoading, isError } = useTrip(params.id);
  const updateTrip = useUpdateTrip(params.id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (isError || !trip) {
    return (
      <EmptyState
        title="Trip not found"
        actionLabel="Back to trips"
        onAction={() => router.push('/trips')}
      />
    );
  }

  if (trip.status !== TripStatus.DRAFT) {
    return (
      <EmptyState
        title="Only draft trips can be edited"
        description={`Current status: ${trip.status}`}
        actionLabel="View trip"
        onAction={() => router.push(`/trips/${trip._id}`)}
      />
    );
  }

    const vehicleId = typeof trip.vehicleId === 'string' ? trip.vehicleId : trip.vehicleId._id;
    const driverId =
      typeof trip.driverId === 'string'
        ? trip.driverId
        : (trip.driverId as { _id?: string; id?: string })._id ??
          (trip.driverId as { id?: string }).id ??
          '';

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb
          items={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Trips', href: '/trips' },
            { label: trip.tripNumber, href: `/trips/${trip._id}` },
            { label: 'Edit' },
          ]}
        />
        <PageHeader title={`Edit ${trip.tripNumber}`} description="Update draft trip details before dispatch." />
      </div>
      <TripForm
        submitLabel="Save changes"
        loading={updateTrip.isPending}
        defaultValues={{
          source: trip.source,
          destination: trip.destination,
          vehicleId,
          driverId,
          cargoName: trip.cargoName,
          cargoWeight: trip.cargoWeight,
          cargoType: trip.cargoType,
          plannedDistance: trip.plannedDistance,
          plannedStartDate: trip.plannedStartDate,
          plannedEndDate: trip.plannedEndDate,
          estimatedRevenue: trip.estimatedRevenue,
          notes: trip.notes,
        }}
        onSubmit={(values) => {
          updateTrip.mutate(values, {
            onSuccess: () => router.push(`/trips/${trip._id}`),
          });
        }}
      />
    </div>
  );
}
