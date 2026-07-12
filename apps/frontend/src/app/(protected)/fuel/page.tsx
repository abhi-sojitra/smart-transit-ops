'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { Button } from '@/components/ui/button';
import { FuelTable } from '@/components/fuel/FuelTable';
import { FuelStatisticsCards } from '@/components/charts/CostCards';
import { FuelCharts } from '@/components/charts/FuelExpenseCharts';
import { FuelFilters } from '@/components/filters/FuelFilters';
import { useDeleteFuel, useFuelList, useFuelStatistics, useVehicleFuelComparison } from '@/hooks/use-fuel';
import type { FuelFilterValues } from '@/types/fuel-expense';
import { notify } from '@/utils/notify';
import { ConfirmationDialog } from '@/components/feedback/confirmation-dialog';

const defaultFilters: FuelFilterValues = {};

export default function FuelListPage() {
  const [filters, setFilters] = useState<FuelFilterValues>(defaultFilters);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useFuelList({
    page: 1,
    limit: 50,
    ...filters,
  });
  const { data: stats, isLoading: statsLoading } = useFuelStatistics(
    filters.dateFrom,
    filters.dateTo,
  );
  const { data: comparison, isLoading: comparisonLoading } = useVehicleFuelComparison();
  const deleteFuel = useDeleteFuel();

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteFuel.mutateAsync(deleteId);
      notify.fuelDeleted();
      setDeleteId(null);
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Failed to delete fuel log');
    }
  };

  return (
    <div className="space-y-6">
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
                <Plus className="mr-2 h-4 w-4" />
                Add Fuel Log
              </Link>
            </Button>
          }
        />
      </div>

      <FuelStatisticsCards stats={stats} loading={statsLoading} />
      <FuelFilters
        values={filters}
        onChange={setFilters}
        onReset={() => setFilters(defaultFilters)}
      />

      {isError ? (
        <p className="text-sm text-red-500">
          {error instanceof Error ? error.message : 'Failed to load fuel logs'}
        </p>
      ) : (
        <FuelTable
          data={data?.data ?? []}
          loading={isLoading}
          onDelete={setDeleteId}
          deletingId={deleteFuel.isPending ? (deleteId ?? undefined) : undefined}
        />
      )}

      <FuelCharts
        stats={stats}
        vehicleComparison={comparison}
        loading={statsLoading || comparisonLoading}
      />

      <ConfirmationDialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete fuel log?"
        description="This action will soft-delete the fuel log. It can be restored from the database if needed."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={deleteFuel.isPending}
      />
    </div>
  );
}
