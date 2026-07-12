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
  Pencil,
  Phone,
  Trash2,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/feedback/empty-state';
import { DriverStatusBadge } from '@/components/drivers/driver-status-badge';
import { sectionReveal, staggerContainer, tableRowReveal } from '@/components/drivers/motion';
import { cn } from '@/utils/cn';
import type { Driver, DriverFiltersState, PaginationMeta } from '@/types/driver';
import { getDriverDisplayName, getInitials } from '@/components/drivers/driver-display';

type SortField = DriverFiltersState['sortBy'];

interface DriverTableProps {
  drivers: Driver[];
  meta?: PaginationMeta;
  loading?: boolean;
  error?: string | null;
  sortBy: SortField;
  sortOrder: 'asc' | 'desc';
  onSortChange: (sortBy: SortField, sortOrder: 'asc' | 'desc') => void;
  onPageChange: (page: number) => void;
  onDelete: (driver: Driver) => void;
}

function SortableHeader({
  label,
  field,
  sortBy,
  sortOrder,
  onSort,
  className,
  align = 'left',
}: {
  label: string;
  field: SortField;
  sortBy: SortField;
  sortOrder: 'asc' | 'desc';
  onSort: (field: SortField) => void;
  className?: string;
  align?: 'left' | 'right';
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
          align === 'right' && 'ml-auto',
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


function daysUntil(dateValue?: string) {
  if (!dateValue) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateValue);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function SafetyScoreMeter({ score }: { score: number }) {
  const reduceMotion = useReducedMotion();
  const tone =
    score >= 85 ? 'bg-emerald-500' : score >= 70 ? 'bg-amber-500' : 'bg-red-500';
  const textTone =
    score >= 85 ? 'text-emerald-500' : score >= 70 ? 'text-amber-500' : 'text-red-500';
  const width = `${Math.max(0, Math.min(score, 100))}%`;

  return (
    <div className="min-w-[110px]">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className={cn('text-sm font-semibold tabular-nums', textTone)}>{score}</span>
        <span className="text-[11px] text-muted-foreground">/ 100</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <motion.div
          className={cn('h-full rounded-full', tone)}
          initial={reduceMotion ? false : { width: 0 }}
          animate={{ width }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}

function LicenseExpiryCell({ driver }: { driver: Driver }) {
  const days = daysUntil(driver.licenseExpiryDate);
  const status = driver.licenseStatus;
  const isExpired = status === 'EXPIRED' || (days !== null && days <= 0);
  const isExpiring = status === 'EXPIRING' || (days !== null && days > 0 && days <= 30);

  return (
    <div className="space-y-1">
      <p
        className={cn(
          'text-sm font-medium tabular-nums',
          isExpired && 'text-red-500',
          isExpiring && !isExpired && 'text-amber-500',
        )}
      >
        {formatDate(driver.licenseExpiryDate)}
      </p>
      {isExpired ? (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-500">
          <AlertTriangle className="h-3 w-3" />
          Expired
        </span>
      ) : isExpiring ? (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-500">
          <AlertTriangle className="h-3 w-3" />
          {days} day{days === 1 ? '' : 's'} left
        </span>
      ) : (
        <span className="text-[11px] text-muted-foreground">Valid</span>
      )}
    </div>
  );
}

export function DriverTable({
  drivers,
  meta,
  loading,
  error,
  sortBy,
  sortOrder,
  onSortChange,
  onPageChange,
  onDelete,
}: DriverTableProps) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      onSortChange(field, sortOrder === 'asc' ? 'desc' : 'asc');
      return;
    }
    onSortChange(field, field === 'fullName' ? 'asc' : 'desc');
  };

  if (loading) {
    return <DriverLoadingSkeleton />;
  }

  if (error) {
    return <EmptyState title="Unable to load drivers" description={error} />;
  }

  if (!drivers.length) {
    return (
      <EmptyState
        title="No drivers found"
        description="Try adjusting search or filters, or add a new driver."
        actionLabel="Add Driver"
        onAction={() => router.push('/drivers/new')}
      />
    );
  }

  const from = meta ? (meta.page - 1) * meta.limit + 1 : 1;
  const to = meta ? Math.min(meta.page * meta.limit, meta.total) : drivers.length;

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
                  label="Driver"
                  field="fullName"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                />
                <th className="px-4 py-3.5 font-semibold text-muted-foreground">Contact</th>
                <th className="px-4 py-3.5 font-semibold text-muted-foreground">License</th>
                <th className="px-4 py-3.5 font-semibold text-muted-foreground">Expiry</th>
                <th className="px-4 py-3.5 font-semibold text-muted-foreground">Status</th>
                <SortableHeader
                  label="Safety"
                  field="safetyScore"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                />
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
              key={drivers.map((d) => d.id).join('-')}
            >
              <AnimatePresence initial={false}>
                {drivers.map((driver) => (
                  <motion.tr
                    key={driver.id}
                    variants={tableRowReveal}
                    layout={!reduceMotion}
                    className="group cursor-pointer transition-colors hover:bg-muted/35"
                    onClick={() => router.push(`/drivers/${driver.id}`)}
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary ring-1 ring-primary/20">
                          {getInitials(getDriverDisplayName(driver))}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground group-hover:text-primary">
                            {getDriverDisplayName(driver)}
                          </p>
                          <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                            {driver.employeeCode || '—'}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="space-y-1">
                        <p className="inline-flex items-center gap-1.5 text-sm">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="tabular-nums">{driver.phone || '—'}</span>
                        </p>
                        <p className="max-w-[180px] truncate text-xs text-muted-foreground">
                          {driver.email || '—'}
                        </p>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="space-y-1">
                        <p className="font-mono text-sm">{driver.licenseNumber || '—'}</p>
                        <p className="text-xs text-muted-foreground">
                          {driver.licenseCategory
                            ? String(driver.licenseCategory).replaceAll('_', ' ')
                            : '—'}
                          {driver.experienceYears != null
                            ? ` · ${driver.experienceYears} yrs`
                            : null}
                        </p>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <LicenseExpiryCell driver={driver} />
                    </td>

                    <td className="px-4 py-3.5">
                      <DriverStatusBadge status={driver.status} />
                    </td>

                    <td className="px-4 py-3.5">
                      <SafetyScoreMeter score={driver.safetyScore} />
                    </td>

                    <td className="px-4 py-3.5">
                      <div
                        className="flex items-center justify-end gap-1 opacity-80 transition-opacity group-hover:opacity-100"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                          <Link href={`/drivers/${driver.id}`} aria-label="View driver">
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                          <Link href={`/drivers/${driver.id}/edit`} aria-label="Edit driver">
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label="Delete driver"
                          onClick={() => onDelete(driver)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </motion.tbody>
          </table>
        </div>
      </div>

      {meta ? (
        <motion.div
          className="flex flex-col gap-3 rounded-xl border border-border bg-card/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.25 }}
        >
          <p className="text-sm text-muted-foreground">
            Showing{' '}
            <span className="font-medium text-foreground">
              {from}–{to}
            </span>{' '}
            of <span className="font-medium text-foreground">{meta.total}</span> drivers
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page <= 1}
              onClick={() => onPageChange(meta.page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="min-w-[4.5rem] text-center text-sm tabular-nums text-muted-foreground">
              {meta.page} / {Math.max(meta.totalPages, 1)}
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
        </motion.div>
      ) : null}
    </motion.div>
  );
}

export function DriverLoadingSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="border-b border-border bg-muted/40 px-4 py-3.5">
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <div className="space-y-0 divide-y divide-border/70">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="hidden h-4 w-28 sm:block" />
            <Skeleton className="hidden h-4 w-24 md:block" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-2 w-24 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
