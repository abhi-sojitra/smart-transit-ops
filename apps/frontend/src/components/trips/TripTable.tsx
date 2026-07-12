'use client';

import Link from 'next/link';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  MoreHorizontal,
  Pencil,
  Play,
  Route,
  Send,
  SquareCheckBig,
  XCircle,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/feedback/empty-state';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TripStatusBadge } from '@/components/trips/TripStatusBadge';
import { sectionReveal, staggerContainer, tableRowReveal } from '@/components/drivers/motion';
import {
  driverLabel,
  formatMiles,
  formatMoney,
  getTripId,
  vehicleLabel,
} from '@/components/trips/trip-display';
import { TripStatus, type TripRecord } from '@/types/trip';
import { cn } from '@/utils/cn';

interface TripTableProps {
  trips: TripRecord[];
  meta?: { page: number; limit: number; total: number; totalPages: number };
  loading?: boolean;
  error?: string | null;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  onPageChange: (page: number) => void;
  onDispatch: (trip: TripRecord) => void;
  onStart: (trip: TripRecord) => void;
  onComplete: (trip: TripRecord) => void;
  onCancel: (trip: TripRecord) => void;
  onRetry?: () => void;
}

function SortableHeader({
  label,
  field,
  sortBy,
  sortOrder,
  onSort,
}: {
  label: string;
  field: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (field: string) => void;
}) {
  const active = sortBy === field;
  const Icon = !active ? ArrowUpDown : sortOrder === 'asc' ? ArrowUp : ArrowDown;
  return (
    <th className="sticky top-0 z-10 bg-muted/95 px-4 py-3.5 text-left font-semibold backdrop-blur">
      <button
        type="button"
        onClick={() => onSort(field)}
        className={cn(
          'inline-flex cursor-pointer items-center gap-1.5 rounded-md transition-colors hover:text-foreground',
          active ? 'text-foreground' : 'text-muted-foreground',
        )}
      >
        <span>{label}</span>
        <Icon className={cn('h-3.5 w-3.5', active ? 'text-primary' : 'opacity-60')} />
      </button>
    </th>
  );
}

export function TripLoadingSkeleton() {
  return (
    <div className="space-y-3 rounded-xl border border-border p-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  );
}

export function TripTable({
  trips,
  meta,
  loading,
  error,
  sortBy,
  sortOrder,
  onSortChange,
  onPageChange,
  onDispatch,
  onStart,
  onComplete,
  onCancel,
  onRetry,
}: TripTableProps) {
  const reduceMotion = useReducedMotion();

  const handleSort = (field: string) => {
    if (sortBy === field) {
      onSortChange(field, sortOrder === 'asc' ? 'desc' : 'asc');
      return;
    }
    onSortChange(field, 'desc');
  };

  if (loading) return <TripLoadingSkeleton />;

  if (error) {
    return (
      <EmptyState
        icon={Route}
        title="Unable to load trips"
        description={error}
        actionLabel={onRetry ? 'Retry' : undefined}
        onAction={onRetry}
      />
    );
  }

  if (!trips.length) {
    return (
      <EmptyState
        icon={Route}
        title="No trips found"
        description="Try adjusting search or filters, or create a new trip."
        actionLabel="Create trip"
        onAction={() => {
          window.location.href = '/trips/new';
        }}
      />
    );
  }

  return (
    <motion.div
      className="space-y-4"
      variants={sectionReveal}
      initial={reduceMotion ? false : 'hidden'}
      animate="show"
    >
      <div className="overflow-hidden rounded-xl border border-border">
        <div className="max-h-[70vh] w-full overflow-auto">
          <table className="w-full min-w-[960px] text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide">
                <th className="sticky left-0 top-0 z-20 bg-muted/95 px-4 py-3.5 text-left font-semibold text-muted-foreground backdrop-blur">
                  Trip
                </th>
                <th className="sticky top-0 z-10 bg-muted/95 px-4 py-3.5 text-left font-semibold text-muted-foreground backdrop-blur">
                  Vehicle
                </th>
                <th className="sticky top-0 z-10 bg-muted/95 px-4 py-3.5 text-left font-semibold text-muted-foreground backdrop-blur">
                  Driver
                </th>
                <th className="sticky top-0 z-10 bg-muted/95 px-4 py-3.5 text-left font-semibold text-muted-foreground backdrop-blur">
                  Route
                </th>
                <SortableHeader
                  label="Distance"
                  field="plannedDistance"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Revenue"
                  field="estimatedRevenue"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                />
                <th className="sticky top-0 z-10 bg-muted/95 px-4 py-3.5 text-left font-semibold text-muted-foreground backdrop-blur">
                  Status
                </th>
                <th className="sticky top-0 z-10 bg-muted/95 px-4 py-3.5 text-right font-semibold text-muted-foreground backdrop-blur">
                  Actions
                </th>
              </tr>
            </thead>
            <motion.tbody variants={staggerContainer} initial={false} animate="show">
              <AnimatePresence mode="popLayout">
                {trips.map((trip) => {
                  const id = getTripId(trip);
                  return (
                    <motion.tr
                      key={id}
                      variants={tableRowReveal}
                      initial={reduceMotion ? false : 'hidden'}
                      animate="show"
                      exit="exit"
                      className="border-b border-border last:border-0 odd:bg-muted/20 hover:bg-muted/40"
                    >
                      <td className="sticky left-0 z-[1] bg-card/95 px-4 py-3 font-mono font-medium backdrop-blur">
                        <Link className="text-primary hover:underline" href={`/trips/${id}`}>
                          {trip.tripNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{vehicleLabel(trip.vehicleId)}</td>
                      <td className="px-4 py-3">{driverLabel(trip.driverId)}</td>
                      <td className="max-w-[220px] truncate px-4 py-3 text-muted-foreground">
                        <span title={`${trip.source} → ${trip.destination}`}>
                          {trip.source} → {trip.destination}
                        </span>
                      </td>
                      <td className="px-4 py-3 tabular-nums">{formatMiles(trip.plannedDistance)}</td>
                      <td className="px-4 py-3 tabular-nums">
                        {formatMoney(trip.actualRevenue ?? trip.estimatedRevenue)}
                      </td>
                      <td className="px-4 py-3">
                        <TripStatusBadge status={trip.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" aria-label={`Actions for ${trip.tripNumber}`}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/trips/${id}`}>
                                  <Eye className="mr-2 h-3.5 w-3.5" />
                                  View
                                </Link>
                              </DropdownMenuItem>
                              {trip.status === TripStatus.DRAFT ? (
                                <DropdownMenuItem asChild>
                                  <Link href={`/trips/${id}/edit`}>
                                    <Pencil className="mr-2 h-3.5 w-3.5" />
                                    Edit
                                  </Link>
                                </DropdownMenuItem>
                              ) : null}
                              {trip.status === TripStatus.DRAFT ? (
                                <DropdownMenuItem onClick={() => onDispatch(trip)}>
                                  <Send className="mr-2 h-3.5 w-3.5" />
                                  Dispatch
                                </DropdownMenuItem>
                              ) : null}
                              {trip.status === TripStatus.DISPATCHED ? (
                                <DropdownMenuItem onClick={() => onStart(trip)}>
                                  <Play className="mr-2 h-3.5 w-3.5" />
                                  Start
                                </DropdownMenuItem>
                              ) : null}
                              {trip.status === TripStatus.IN_PROGRESS ? (
                                <DropdownMenuItem onClick={() => onComplete(trip)}>
                                  <SquareCheckBig className="mr-2 h-3.5 w-3.5" />
                                  Complete
                                </DropdownMenuItem>
                              ) : null}
                              {trip.status !== TripStatus.COMPLETED &&
                              trip.status !== TripStatus.CANCELLED ? (
                                <DropdownMenuItem onClick={() => onCancel(trip)}>
                                  <XCircle className="mr-2 h-3.5 w-3.5 text-destructive" />
                                  Cancel
                                </DropdownMenuItem>
                              ) : null}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </motion.tbody>
          </table>
        </div>
      </div>

      {meta ? (
        <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
          <p>
            Page {meta.page} of {Math.max(meta.totalPages, 1)} · {meta.total} trips
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page <= 1}
              onClick={() => onPageChange(meta.page - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page >= meta.totalPages}
              onClick={() => onPageChange(meta.page + 1)}
              aria-label="Next page"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </motion.div>
  );
}
