'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  Fuel,
  MapPinned,
  NotebookPen,
  Package,
  Pencil,
  Play,
  Send,
  SquareCheckBig,
  Truck,
  User,
  XCircle,
} from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
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
import { pageFade, sectionReveal } from '@/components/drivers/motion';
import {
  useCancelTrip,
  useCompleteTrip,
  useDispatchTrip,
  useStartTrip,
  useTrip,
} from '@/hooks/use-trips';
import {
  driverLabel,
  formatMiles,
  formatMoney,
  formatTripDate,
  getTripId,
  tripRoute,
  vehicleLabel,
} from '@/components/trips/trip-display';
import { TripStatus } from '@/types/trip';

export default function TripDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
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

  const id = getTripId(trip);

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
            { label: 'Trips', href: '/trips' },
            { label: trip.tripNumber },
          ]}
        />
        <PageHeader
          title={trip.tripNumber}
          description={tripRoute(trip)}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/trips">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Link>
              </Button>
              <TripStatusBadge status={trip.status} />
              {trip.status === TripStatus.DRAFT ? (
                <Button asChild variant="outline">
                  <Link href={`/trips/${id}/edit`}>
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Link>
                </Button>
              ) : null}
              {trip.status === TripStatus.DRAFT ? (
                <Button onClick={() => setDispatchOpen(true)}>
                  <Send className="h-4 w-4" />
                  Dispatch
                </Button>
              ) : null}
              {trip.status === TripStatus.DISPATCHED ? (
                <Button loading={startMutation.isPending} onClick={() => startMutation.mutate(id)}>
                  <Play className="h-4 w-4" />
                  Start
                </Button>
              ) : null}
              {trip.status === TripStatus.IN_PROGRESS ? (
                <Button onClick={() => setCompleteOpen(true)}>
                  <SquareCheckBig className="h-4 w-4" />
                  Complete
                </Button>
              ) : null}
              {trip.status !== TripStatus.COMPLETED && trip.status !== TripStatus.CANCELLED ? (
                <Button variant="danger" onClick={() => setCancelOpen(true)}>
                  <XCircle className="h-4 w-4" />
                  Cancel
                </Button>
              ) : null}
            </div>
          }
        />
      </div>

      <motion.div
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        variants={sectionReveal}
        initial={reduceMotion ? false : 'hidden'}
        animate="show"
      >
        <SummaryChip icon={Truck} label="Vehicle" value={vehicleLabel(trip.vehicleId)} />
        <SummaryChip icon={User} label="Driver" value={driverLabel(trip.driverId)} />
        <SummaryChip icon={MapPinned} label="Distance" value={formatMiles(trip.plannedDistance)} />
        <SummaryChip
          icon={Package}
          label="Revenue"
          value={formatMoney(trip.actualRevenue ?? trip.estimatedRevenue)}
        />
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Trip details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Detail label="Cargo" value={`${trip.cargoName} (${trip.cargoWeight})`} icon={Package} />
            <Detail label="Cargo type" value={trip.cargoType} icon={Package} />
            <Detail label="Planned start" value={formatTripDate(trip.plannedStartDate)} icon={Calendar} />
            <Detail label="Planned end" value={formatTripDate(trip.plannedEndDate)} icon={Calendar} />
            <Detail
              label="Actual distance"
              value={trip.actualDistance != null ? formatMiles(trip.actualDistance) : '—'}
              icon={MapPinned}
            />
            <Detail
              label="Fuel consumed"
              value={trip.fuelConsumed != null ? String(trip.fuelConsumed) : '—'}
              icon={Fuel}
            />
            <Detail label="Estimated revenue" value={formatMoney(trip.estimatedRevenue)} />
            <Detail
              label="Actual revenue"
              value={trip.actualRevenue != null ? formatMoney(trip.actualRevenue) : '—'}
            />
            <div className="sm:col-span-2">
              <Detail label="Notes" value={trip.notes || '—'} icon={NotebookPen} />
            </div>
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
          dispatchMutation.mutate(id, {
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
            { id, payload: values },
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
            { id, payload: values },
            {
              onSuccess: () => {
                setCancelOpen(false);
                refetch();
              },
            },
          )
        }
      />
    </motion.div>
  );
}

function SummaryChip({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <Card className="border-border/80">
      <CardContent className="flex items-start gap-3 p-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-0.5 truncate text-sm font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function Detail({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div>
      <p className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
        {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
        {label}
      </p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}
