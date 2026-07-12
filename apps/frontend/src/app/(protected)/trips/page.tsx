'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus, Route } from 'lucide-react';
import { AxiosError } from 'axios';
import { motion, useReducedMotion } from 'framer-motion';
import { PageHeader } from '@/components/layout/page-header';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/feedback/empty-state';
import { TripStatisticsCards } from '@/components/trips/TripStatistics';
import { TripFilters, type TripFilterState } from '@/components/trips/TripFilters';
import { TripLoadingSkeleton, TripTable } from '@/components/trips/TripTable';
import { TripCard } from '@/components/trips/TripCard';
import { DispatchDialog } from '@/components/trips/DispatchDialog';
import { CompleteTripDialog } from '@/components/trips/CompleteTripDialog';
import { CancelTripDialog } from '@/components/trips/CancelTripDialog';
import { pageFade, staggerContainer } from '@/components/drivers/motion';
import {
  useCancelTrip,
  useCompleteTrip,
  useDispatchTrip,
  useStartTrip,
  useTripStatistics,
  useTrips,
} from '@/hooks/use-trips';
import { getTripId } from '@/components/trips/trip-display';
import type { TripRecord } from '@/types/trip';
import { TripStatus } from '@/types/trip';

const DEFAULT_FILTERS: TripFilterState = {
  search: '',
  status: '',
  startDate: '',
  endDate: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

export default function TripsPage() {
  const reduceMotion = useReducedMotion();
  const [filters, setFilters] = useState<TripFilterState>(DEFAULT_FILTERS);
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

  const listQuery = useTrips(queryParams);
  const statsQuery = useTripStatistics();
  const dispatchMutation = useDispatchTrip();
  const startMutation = useStartTrip();
  const completeMutation = useCompleteTrip();
  const cancelMutation = useCancelTrip();

  const errorMessage = useMemo(() => {
    if (!listQuery.error) return null;
    if (listQuery.error instanceof AxiosError) {
      return (
        (listQuery.error.response?.data as { message?: string })?.message ??
        listQuery.error.message
      );
    }
    return listQuery.error.message;
  }, [listQuery.error]);

  const trips = listQuery.data?.data ?? [];
  const meta = listQuery.data?.meta;

  const updateFilters = (next: TripFilterState) => {
    setPage(1);
    setFilters(next);
  };

  return (
    <motion.div
      className="space-y-6"
      variants={pageFade}
      initial={reduceMotion ? false : 'hidden'}
      animate="show"
    >
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

      <TripStatisticsCards stats={statsQuery.data} loading={statsQuery.isLoading} />

      <TripFilters
        value={filters}
        onChange={updateFilters}
        onReset={() => {
          setPage(1);
          setFilters(DEFAULT_FILTERS);
        }}
      />

      <div className="hidden md:block">
        <TripTable
          trips={trips}
          meta={meta}
          loading={listQuery.isLoading}
          error={errorMessage}
          sortBy={filters.sortBy}
          sortOrder={filters.sortOrder}
          onSortChange={(sortBy, sortOrder) => updateFilters({ ...filters, sortBy, sortOrder })}
          onPageChange={setPage}
          onRetry={() => listQuery.refetch()}
          onDispatch={(trip) => {
            setSelected(trip);
            setDispatchOpen(true);
          }}
          onStart={(trip) => startMutation.mutate(getTripId(trip))}
          onComplete={(trip) => {
            setSelected(trip);
            setCompleteOpen(true);
          }}
          onCancel={(trip) => {
            setSelected(trip);
            setCancelOpen(true);
          }}
        />
      </div>

      <motion.div
        className="grid gap-4 md:hidden"
        variants={staggerContainer}
        initial={reduceMotion ? false : 'hidden'}
        animate="show"
      >
        {listQuery.isLoading ? (
          <TripLoadingSkeleton />
        ) : errorMessage ? (
          <EmptyState
            icon={Route}
            title="Unable to load trips"
            description={errorMessage}
            actionLabel="Retry"
            onAction={() => listQuery.refetch()}
          />
        ) : trips.length === 0 ? (
          <EmptyState
            icon={Route}
            title="No trips found"
            description="Try adjusting search or filters, or create a new trip."
            actionLabel="Create trip"
            onAction={() => {
              window.location.href = '/trips/new';
            }}
          />
        ) : (
          <>
            {trips.map((trip) => (
              <TripCard
                key={getTripId(trip)}
                trip={trip}
                onDispatch={(item) => {
                  setSelected(item);
                  setDispatchOpen(true);
                }}
                onStart={(item) => startMutation.mutate(getTripId(item))}
                onComplete={(item) => {
                  setSelected(item);
                  setCompleteOpen(true);
                }}
                onCancel={(item) => {
                  setSelected(item);
                  setCancelOpen(true);
                }}
              />
            ))}
            {meta ? (
              <div className="flex items-center justify-between rounded-xl border border-border bg-card/50 px-3 py-2.5">
                <p className="text-xs text-muted-foreground">
                  Page {meta.page} / {Math.max(meta.totalPages, 1)}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={meta.page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={meta.page >= meta.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </motion.div>

      <DispatchDialog
        open={dispatchOpen}
        trip={selected}
        loading={dispatchMutation.isPending}
        onOpenChange={setDispatchOpen}
        onConfirm={() => {
          if (!selected) return;
          dispatchMutation.mutate(getTripId(selected), {
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
            { id: getTripId(selected), payload: values },
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
            { id: getTripId(selected), payload: values },
            { onSuccess: () => setCancelOpen(false) },
          );
        }}
      />
    </motion.div>
  );
}
