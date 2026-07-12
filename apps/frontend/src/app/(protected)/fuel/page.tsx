'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { AxiosError } from 'axios';
import { motion, useReducedMotion } from 'framer-motion';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/page-header';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { Button } from '@/components/ui/button';
import { FuelStatisticsCards } from '@/components/fuel';
import { FuelCharts } from '@/components/charts/FuelExpenseCharts';
import {
  DeleteFuelDialog,
  FuelCard,
  FuelFilters,
  FuelLoadingSkeleton,
  FuelTable,
} from '@/components/fuel';
import { EmptyState } from '@/components/feedback/empty-state';
import { pageFade, staggerContainer } from '@/components/drivers/motion';
import {
  useDeleteFuel,
  useFuelList,
  useFuelStatistics,
  useVehicleFuelComparison,
} from '@/hooks/use-fuel';
import type { FuelFiltersState } from '@/types/fuel-expense';
import type { FuelLog } from '@transitops/shared-types';

const DEFAULT_FILTERS: FuelFiltersState = {
  search: '',
  vehicleId: '',
  tripId: '',
  fuelType: undefined,
  dateFrom: undefined,
  dateTo: undefined,
  sortBy: 'filledAt',
  sortOrder: 'desc',
  page: 1,
  limit: 10,
};

export default function FuelListPage() {
  const reduceMotion = useReducedMotion();
  const [filters, setFilters] = useState<FuelFiltersState>(DEFAULT_FILTERS);
  const [deleteTarget, setDeleteTarget] = useState<FuelLog | null>(null);

  const listQuery = useFuelList(filters);
  const statsQuery = useFuelStatistics(filters.dateFrom, filters.dateTo);
  const comparisonQuery = useVehicleFuelComparison();
  const deleteMutation = useDeleteFuel();

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

  const logs = listQuery.data?.data ?? [];
  const meta = listQuery.data?.meta;

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success('Fuel log deleted');
      setDeleteTarget(null);
    } catch (error) {
      const message =
        error instanceof AxiosError
          ? ((error.response?.data as { message?: string })?.message ?? error.message)
          : 'Failed to delete fuel log';
      toast.error(message);
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
        <Breadcrumb
          items={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Fuel & Expense', href: '/fuel-expenses' },
            { label: 'Fuel Logs' },
          ]}
        />
        <PageHeader
          title="Fuel Logs"
          description="Track fuel consumption and costs across your fleet."
          actions={
            <Button asChild>
              <Link href="/fuel/new">
                <Plus className="h-4 w-4" />
                Add Fuel Log
              </Link>
            </Button>
          }
        />
      </div>

      <FuelStatisticsCards stats={statsQuery.data} loading={statsQuery.isLoading} />

      <FuelFilters
        filters={filters}
        onChange={(next) => setFilters((prev) => ({ ...prev, ...next }))}
        onReset={() => setFilters(DEFAULT_FILTERS)}
      />

      <div className="hidden md:block">
        <FuelTable
          logs={logs}
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
          <FuelLoadingSkeleton />
        ) : errorMessage ? (
          <EmptyState title="Unable to load fuel logs" description={errorMessage} />
        ) : logs.length === 0 ? (
          <EmptyState
            title="No fuel logs found"
            description="Try adjusting search or filters, or add a new fuel log."
            actionLabel="Add Fuel Log"
            onAction={() => {
              window.location.href = '/fuel/new';
            }}
          />
        ) : (
          <>
            {logs.map((log) => (
              <FuelCard key={log.id} log={log} onDelete={setDeleteTarget} />
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

      <FuelCharts
        stats={statsQuery.data}
        vehicleComparison={comparisonQuery.data}
        loading={statsQuery.isLoading || comparisonQuery.isLoading}
      />

      <DeleteFuelDialog
        fuel={deleteTarget}
        open={Boolean(deleteTarget)}
        loading={deleteMutation.isPending}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={handleDelete}
      />
    </motion.div>
  );
}
