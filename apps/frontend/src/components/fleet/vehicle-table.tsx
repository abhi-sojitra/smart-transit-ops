'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Gauge,
  Pencil,
  Trash2,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/feedback/empty-state';
import { VehicleStatusBadge } from '@/components/fleet/vehicle-status-badge';
import { sectionReveal, staggerContainer, tableRowReveal } from '@/components/fleet/motion';
import { cn } from '@/utils/cn';
import type { Vehicle, VehicleFiltersState, PaginationMeta } from '@/types/fleet';

type SortField = VehicleFiltersState['sortBy'];

interface VehicleTableProps {
  vehicles: Vehicle[];
  meta?: PaginationMeta;
  loading?: boolean;
  error?: string | null;
  sortBy: SortField;
  sortOrder: 'asc' | 'desc';
  onSortChange: (sortBy: SortField, sortOrder: 'asc' | 'desc') => void;
  onPageChange: (page: number) => void;
  onDelete: (vehicle: Vehicle) => void;
}

function SortableHeader({
  label,
  field,
  sortBy,
  sortOrder,
  onSort,
  className,
}: {
  label: string;
  field: SortField;
  sortBy: SortField;
  sortOrder: 'asc' | 'desc';
  onSort: (field: SortField) => void;
  className?: string;
}) {
  const active = sortBy === field;
  const Icon = !active ? ArrowUpDown : sortOrder === 'asc' ? ArrowUp : ArrowDown;

  return (
    <th className={cn('px-4 py-3.5 font-semibold', className)}>
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

function formatDate(value?: string) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function VehicleLoadingSkeleton() {
  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}

export function VehicleTable({
  vehicles,
  meta,
  loading,
  error,
  sortBy,
  sortOrder,
  onSortChange,
  onPageChange,
  onDelete,
}: VehicleTableProps) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      onSortChange(field, sortOrder === 'asc' ? 'desc' : 'asc');
      return;
    }
    onSortChange(field, field === 'vehicleId' ? 'asc' : 'desc');
  };

  if (loading) return <VehicleLoadingSkeleton />;
  if (error) return <EmptyState title="Unable to load vehicles" description={error} />;
  if (!vehicles.length) {
    return (
      <EmptyState
        title="No vehicles found"
        description="Try adjusting search or filters, or add a new vehicle."
        actionLabel="Add Vehicle"
        onAction={() => router.push('/fleet/new')}
      />
    );
  }

  const from = meta ? (meta.page - 1) * meta.limit + 1 : 1;
  const to = meta ? Math.min(meta.page * meta.limit, meta.total) : vehicles.length;

  return (
    <motion.div
      className="space-y-4"
      variants={sectionReveal}
      initial={reduceMotion ? false : 'hidden'}
      animate="show"
    >
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[960px] w-full text-sm">
            <thead className="sticky top-0 z-10 border-b border-border bg-muted/70 backdrop-blur">
              <tr className="text-left text-[11px] uppercase tracking-wider">
                <SortableHeader
                  label="Vehicle"
                  field="vehicleId"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                />
                <th className="px-4 py-3.5 font-semibold text-muted-foreground">Registration</th>
                <SortableHeader
                  label="Mileage"
                  field="mileage"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                />
                <th className="px-4 py-3.5 font-semibold text-muted-foreground">Insurance</th>
                <th className="px-4 py-3.5 font-semibold text-muted-foreground">Status</th>
                <th className="px-4 py-3.5 text-right font-semibold text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <motion.tbody
              className="divide-y divide-border/70"
              variants={staggerContainer}
              initial={reduceMotion ? false : 'hidden'}
              animate="show"
              key={vehicles.map((v) => v.id).join('-')}
            >
              <AnimatePresence initial={false}>
                {vehicles.map((vehicle) => {
                  const insuranceWarning =
                    vehicle.insuranceStatus === 'EXPIRED' ||
                    vehicle.insuranceStatus === 'EXPIRING';
                  return (
                    <motion.tr
                      key={vehicle.id}
                      variants={tableRowReveal}
                      layout={!reduceMotion}
                      className="group cursor-pointer transition-colors hover:bg-muted/35"
                      onClick={() => router.push(`/fleet/${vehicle.id}`)}
                    >
                      <td className="px-4 py-3.5">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground group-hover:text-primary">
                            {vehicle.make} {vehicle.model}
                          </p>
                          <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                            {vehicle.vehicleId}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs">{vehicle.registrationNumber}</td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1 tabular-nums">
                          <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
                          {vehicle.mileage.toLocaleString()} km
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <p
                          className={cn(
                            'text-sm tabular-nums',
                            insuranceWarning && 'font-medium text-amber-500',
                            vehicle.insuranceStatus === 'EXPIRED' && 'text-red-500',
                          )}
                        >
                          {formatDate(vehicle.insuranceExpiryDate)}
                        </p>
                        {insuranceWarning ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-amber-500">
                            <AlertTriangle className="h-3 w-3" />
                            {vehicle.insuranceStatus}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3.5">
                        <VehicleStatusBadge status={vehicle.status} />
                      </td>
                      <td className="px-4 py-3.5">
                        <div
                          className="flex justify-end gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/fleet/${vehicle.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/fleet/${vehicle.id}/edit`}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(vehicle)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
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
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card/50 px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Showing {from}–{to} of {meta.total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page <= 1}
              onClick={() => onPageChange(meta.page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Button>
            <span className="text-sm tabular-nums text-muted-foreground">
              Page {meta.page} / {Math.max(meta.totalPages, 1)}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page >= meta.totalPages}
              onClick={() => onPageChange(meta.page + 1)}
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
