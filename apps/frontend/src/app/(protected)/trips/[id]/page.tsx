'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/feedback/empty-state';
import { TripStatusBadge } from '@/components/trips/TripStatusBadge';
import { TripTimeline } from '@/components/trips/TripTimeline';
import { DispatchDialog } from '@/components/trips/DispatchDialog';
import { CompleteTripDialog } from '@/components/trips/CompleteTripDialog';
import { CancelTripDialog } from '@/components/trips/CancelTripDialog';
import {
  useCancelTrip,
  useCompleteTrip,
  useDispatchTrip,
  useStartTrip,
  useTrip,
} from '@/hooks/use-trips';
import { TripStatus } from '@/types/trip';
import { useState } from 'react';

export default function TripDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: trip, isLoading, isError, refetch } = useTrip(params.id);
  const [dispatchOpen, setDispatchOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const dispatchMutation = useDispatchTrip();
  const startMutation = useStartTrip();
  const completeMutation = useCompleteTrip();
  const cancelMutation = useCancelTrip();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !trip) {
    return (
      <EmptyState
        title="Trip not found"
        description="The trip may have been deleted or you do not have access."
        actionLabel="Back to trips"
        onAction={() => router.push('/trips')}
      />
    );
  }

  const vehicle =
    typeof trip.vehicleId === 'object'
      ? trip.vehicleId.vehicleId ?? trip.vehicleId.model ?? trip.vehicleId._id
      : trip.vehicleId;
  const driver =
    typeof trip.driverId === 'object'
      ? trip.driverId.name ??
        (`${trip.driverId.firstName ?? ''} ${trip.driverId.lastName ?? ''}`.trim() ||
          trip.driverId.employeeId ||
          trip.driverId._id)
      : trip.driverId;

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb
          items={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Trips', href: '/trips' },
            { label: trip.tripNumber },
          ]}
        />
        <PageHeader
          title={trip.tripNumber}
          description={`${trip.source} → ${trip.destination}`}
          actions={
            <div className="flex flex-wrap gap-2">
              <TripStatusBadge status={trip.status} />
              {trip.status === TripStatus.DRAFT ? (
                <Button asChild variant="outline">
                  <Link href={`/trips/${trip._id}/edit`}>Edit</Link>
                </Button>
              ) : null}
              {trip.status === TripStatus.DRAFT ? (
                <Button onClick={() => setDispatchOpen(true)}>Dispatch</Button>
              ) : null}
              {trip.status === TripStatus.DISPATCHED ? (
                <Button loading={startMutation.isPending} onClick={() => startMutation.mutate(trip._id)}>
                  Start
                </Button>
              ) : null}
              {trip.status === TripStatus.IN_PROGRESS ? (
                <Button onClick={() => setCompleteOpen(true)}>Complete</Button>
              ) : null}
              {trip.status !== TripStatus.COMPLETED && trip.status !== TripStatus.CANCELLED ? (
                <Button variant="danger" onClick={() => setCancelOpen(true)}>
                  Cancel
                </Button>
              ) : null}
            </div>
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Trip details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Detail label="Vehicle" value={String(vehicle)} />
            <Detail label="Driver" value={String(driver)} />
            <Detail label="Cargo" value={`${trip.cargoName} (${trip.cargoWeight})`} />
            <Detail label="Cargo type" value={trip.cargoType} />
            <Detail label="Planned distance" value={`${trip.plannedDistance} mi`} />
            <Detail
              label="Actual distance"
              value={trip.actualDistance !== undefined ? `${trip.actualDistance} mi` : '—'}
            />
            <Detail label="Estimated revenue" value={`$${trip.estimatedRevenue.toLocaleString()}`} />
            <Detail
              label="Actual revenue"
              value={trip.actualRevenue !== undefined ? `$${trip.actualRevenue.toLocaleString()}` : '—'}
            />
            <Detail label="Fuel consumed" value={trip.fuelConsumed?.toString() ?? '—'} />
            <Detail label="Notes" value={trip.notes || '—'} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <TripTimeline trip={trip} />
          </CardContent>
        </Card>
      </div>

      <DispatchDialog
        open={dispatchOpen}
        trip={trip}
        loading={dispatchMutation.isPending}
        onOpenChange={setDispatchOpen}
        onConfirm={() =>
          dispatchMutation.mutate(trip._id, {
            onSuccess: () => {
              setDispatchOpen(false);
              refetch();
            },
          })
        }
      />
      <CompleteTripDialog
        open={completeOpen}
        trip={trip}
        loading={completeMutation.isPending}
        onOpenChange={setCompleteOpen}
        onConfirm={(values) =>
          completeMutation.mutate(
            { id: trip._id, payload: values },
            {
              onSuccess: () => {
                setCompleteOpen(false);
                refetch();
              },
            },
          )
        }
      />
      <CancelTripDialog
        open={cancelOpen}
        trip={trip}
        loading={cancelMutation.isPending}
        onOpenChange={setCancelOpen}
        onConfirm={(values) =>
          cancelMutation.mutate(
            { id: trip._id, payload: values },
            {
              onSuccess: () => {
                setCancelOpen(false);
                refetch();
              },
            },
          )
        }
      />
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}
