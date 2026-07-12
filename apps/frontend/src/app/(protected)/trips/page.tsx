'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus, Route } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/feedback/empty-state';
import { TripStatisticsCards } from '@/components/trips/TripStatistics';
import { TripFilters, type TripFilterState } from '@/components/trips/TripFilters';
import { TripTable } from '@/components/trips/TripTable';
import { DispatchDialog } from '@/components/trips/DispatchDialog';
import { CompleteTripDialog } from '@/components/trips/CompleteTripDialog';
import { CancelTripDialog } from '@/components/trips/CancelTripDialog';
import {
  useCancelTrip,
  useCompleteTrip,
  useDispatchTrip,
  useStartTrip,
  useTripStatistics,
  useTrips,
} from '@/hooks/use-trips';
import type { TripRecord } from '@/types/trip';
import { TripStatus } from '@/types/trip';

export default function TripsPage() {
  const [filters, setFilters] = useState<TripFilterState>({
    search: '',
    status: '',
    startDate: '',
    endDate: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<TripRecord | null>(null);
  const [dispatchOpen, setDispatchOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const queryParams = useMemo(
    () => ({
      page,
      limit: 10,
      search: filters.search || undefined,
      status: (filters.status || undefined) as TripStatus | undefined,
      startDate: filters.startDate ? new Date(filters.startDate).toISOString() : undefined,
      endDate: filters.endDate ? new Date(`${filters.endDate}T23:59:59`).toISOString() : undefined,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
    }),
    [filters, page],
  );

  const { data, isLoading, isError, refetch } = useTrips(queryParams);
  const { data: stats, isLoading: statsLoading } = useTripStatistics();
  const dispatchMutation = useDispatchTrip();
  const startMutation = useStartTrip();
  const completeMutation = useCompleteTrip();
  const cancelMutation = useCancelTrip();

  const trips = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb items={[{ label: 'Home', href: '/dashboard' }, { label: 'Trips & Dispatch' }]} />
        <PageHeader
          title="Trip Dispatcher"
          description="Create, assign, dispatch, and track fleet trips with live status."
          actions={
            <Button asChild>
              <Link href="/trips/new">
                <Plus className="h-4 w-4" />
                New Trip
              </Link>
            </Button>
          }
        />
      </div>

      <TripStatisticsCards stats={stats} loading={statsLoading} />

      <Card>
        <CardContent className="space-y-4 p-6">
          <TripFilters
            value={filters}
            onChange={(next) => {
              setPage(1);
              setFilters(next);
            }}
          />

          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : null}

          {isError ? (
            <EmptyState
              icon={Route}
              title="Unable to load trips"
              description="Check API connectivity and try again."
              actionLabel="Retry"
              onAction={() => refetch()}
            />
          ) : null}

          {!isLoading && !isError && trips.length === 0 ? (
            <EmptyState
              icon={Route}
              title="No trips yet"
              description="Create your first trip to start dispatching."
              actionLabel="Create trip"
              onAction={() => {
                window.location.href = '/trips/new';
              }}
            />
          ) : null}

          {!isLoading && !isError && trips.length > 0 ? (
            <>
              <TripTable
                data={trips}
                onDispatch={(trip) => {
                  setSelected(trip);
                  setDispatchOpen(true);
                }}
                onStart={(trip) => startMutation.mutate(trip._id)}
                onComplete={(trip) => {
                  setSelected(trip);
                  setCompleteOpen(true);
                }}
                onCancel={(trip) => {
                  setSelected(trip);
                  setCancelOpen(true);
                }}
              />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  Page {meta?.page ?? 1} of {meta?.totalPages ?? 1} · {meta?.total ?? 0} trips
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={(meta?.page ?? 1) <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={(meta?.page ?? 1) >= (meta?.totalPages ?? 1)}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>

      <DispatchDialog
        open={dispatchOpen}
        trip={selected}
        loading={dispatchMutation.isPending}
        onOpenChange={setDispatchOpen}
        onConfirm={() => {
          if (!selected) return;
          dispatchMutation.mutate(selected._id, {
            onSuccess: () => setDispatchOpen(false),
          });
        }}
      />

      <CompleteTripDialog
        open={completeOpen}
        trip={selected}
        loading={completeMutation.isPending}
        onOpenChange={setCompleteOpen}
        onConfirm={(values) => {
          if (!selected) return;
          completeMutation.mutate(
            { id: selected._id, payload: values },
            { onSuccess: () => setCompleteOpen(false) },
          );
        }}
      />

      <CancelTripDialog
        open={cancelOpen}
        trip={selected}
        loading={cancelMutation.isPending}
        onOpenChange={setCancelOpen}
        onConfirm={(values) => {
          if (!selected) return;
          cancelMutation.mutate(
            { id: selected._id, payload: values },
            { onSuccess: () => setCancelOpen(false) },
          );
        }}
      />
    </div>
  );
}
