'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Download, Plus } from 'lucide-react';
import { AxiosError } from 'axios';
import { motion, useReducedMotion } from 'framer-motion';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/page-header';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { Button } from '@/components/ui/button';
import { DriverStatisticsCards } from '@/components/drivers/driver-statistics';
import { DriverFilters } from '@/components/drivers/driver-filters';
import { DriverLoadingSkeleton, DriverTable } from '@/components/drivers/driver-table';
import { DriverCard } from '@/components/drivers/driver-card';
import { DeleteDriverDialog } from '@/components/drivers/delete-driver-dialog';
import { EmptyState } from '@/components/feedback/empty-state';
import { downloadDriversCsv } from '@/components/drivers/export-drivers';
import { pageFade, staggerContainer } from '@/components/drivers/motion';
import { driversApi } from '@/services/drivers';
import {
  useDeleteDriverMutation,
  useDriverStatisticsQuery,
  useDriversQuery,
} from '@/hooks/use-drivers';
import type { Driver, DriverFiltersState } from '@/types/driver';

const DEFAULT_FILTERS: DriverFiltersState = {
  search: '',
  status: 'ALL',
  licenseCategory: 'ALL',
  city: '',
  state: '',
  experienceMin: '',
  experienceMax: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
  page: 1,
  limit: 10,
};

export default function DriversPage() {
  const reduceMotion = useReducedMotion();
  const [filters, setFilters] = useState<DriverFiltersState>(DEFAULT_FILTERS);
  const [deleteTarget, setDeleteTarget] = useState<Driver | null>(null);
  const [exporting, setExporting] = useState(false);

  const listQuery = useDriversQuery(filters);
  const statsQuery = useDriverStatisticsQuery();
  const deleteMutation = useDeleteDriverMutation();

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

  const drivers = listQuery.data?.items ?? [];
  const meta = listQuery.data?.meta;

  const handleExport = async () => {
    setExporting(true);
    try {
      const result = await driversApi.list({
        ...filters,
        page: 1,
        limit: 100,
      });
      if (!result.items.length) {
        toast.error('No drivers to export for the current filters');
        return;
      }
      downloadDriversCsv(result.items);
      toast.success(`Exported ${result.items.length} driver${result.items.length === 1 ? '' : 's'}`);
    } catch (error) {
      const message =
        error instanceof AxiosError
          ? ((error.response?.data as { message?: string })?.message ?? error.message)
          : 'Failed to export drivers';
      toast.error(message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <motion.div
      className="space-y-6"
      variants={pageFade}
      initial={reduceMotion ? false : 'hidden'}
      animate="show"
    >
      <div>
        <Breadcrumb items={[{ label: 'Home', href: '/dashboard' }, { label: 'Drivers' }]} />
        <PageHeader
          title="Drivers & Safety Profiles"
          description="Monitor driver availability, licenses, and safety scores."
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={handleExport}
                loading={exporting}
                disabled={listQuery.isLoading || exporting}
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
              <Button asChild>
                <Link href="/drivers/new">
                  <Plus className="h-4 w-4" />
                  Add Driver
                </Link>
              </Button>
            </div>
          }
        />
      </div>

      <DriverStatisticsCards
        statistics={statsQuery.data}
        loading={statsQuery.isLoading}
      />

      <DriverFilters
        filters={filters}
        onChange={(next) => setFilters((prev) => ({ ...prev, ...next }))}
        onReset={() => setFilters(DEFAULT_FILTERS)}
      />

      <div className="hidden md:block">
        <DriverTable
          drivers={drivers}
          meta={meta}
          loading={listQuery.isLoading}
          error={errorMessage}
          sortBy={filters.sortBy}
          sortOrder={filters.sortOrder}
          onSortChange={(sortBy, sortOrder) =>
            setFilters((prev) => ({ ...prev, sortBy, sortOrder, page: 1 }))
          }
          onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
          onDelete={setDeleteTarget}
        />
      </div>

      <motion.div
        className="grid gap-4 md:hidden"
        variants={staggerContainer}
        initial={reduceMotion ? false : 'hidden'}
        animate="show"
      >
        {listQuery.isLoading ? (
          <DriverLoadingSkeleton />
        ) : errorMessage ? (
          <EmptyState title="Unable to load drivers" description={errorMessage} />
        ) : drivers.length === 0 ? (
          <EmptyState
            title="No drivers found"
            description="Try adjusting search or filters, or add a new driver."
            actionLabel="Add Driver"
            onAction={() => {
              window.location.href = '/drivers/new';
            }}
          />
        ) : (
          <>
            {drivers.map((driver) => (
              <DriverCard key={driver.id} driver={driver} onDelete={setDeleteTarget} />
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
                    onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
                  >
                    Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={meta.page >= meta.totalPages}
                    onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </motion.div>

      <DeleteDriverDialog
        driver={deleteTarget}
        open={Boolean(deleteTarget)}
        loading={deleteMutation.isPending}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteMutation.mutate(deleteTarget.id, {
            onSuccess: () => setDeleteTarget(null),
          });
        }}
      />
    </motion.div>
  );
}
