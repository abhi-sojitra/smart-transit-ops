'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { Button } from '@/components/ui/button';
import { ExpenseTable } from '@/components/expenses/ExpenseTable';
import { ExpenseStatisticsCards } from '@/components/charts/CostCards';
import { ExpenseCharts } from '@/components/charts/FuelExpenseCharts';
import { ExpenseFilters } from '@/components/filters/ExpenseFilters';
import { useDeleteExpense, useExpenseList, useExpenseStatistics } from '@/hooks/use-expenses';
import type { ExpenseFilterValues } from '@/types/fuel-expense';
import { notify } from '@/utils/notify';
import { ConfirmationDialog } from '@/components/feedback/confirmation-dialog';

const defaultFilters: ExpenseFilterValues = {};

export default function ExpensesListPage() {
  const [filters, setFilters] = useState<ExpenseFilterValues>(defaultFilters);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useExpenseList({
    page: 1,
    limit: 50,
    ...filters,
  });
  const { data: stats, isLoading: statsLoading } = useExpenseStatistics(
    filters.dateFrom,
    filters.dateTo,
  );
  const deleteExpense = useDeleteExpense();

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteExpense.mutateAsync(deleteId);
      notify.expenseDeleted();
      setDeleteId(null);
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Failed to delete expense');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb
          items={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Fuel & Expense', href: '/fuel-expenses' },
            { label: 'Expenses' },
          ]}
        />
        <PageHeader
          title="Expenses"
          description="Track operating expenses across your fleet."
          actions={
            <Button asChild>
              <Link href="/expenses/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Expense
              </Link>
            </Button>
          }
        />
      </div>

      <ExpenseStatisticsCards stats={stats} loading={statsLoading} />
      <ExpenseFilters
        values={filters}
        onChange={setFilters}
        onReset={() => setFilters(defaultFilters)}
      />

      {isError ? (
        <p className="text-sm text-red-500">
          {error instanceof Error ? error.message : 'Failed to load expenses'}
        </p>
      ) : (
        <ExpenseTable
          data={data?.data ?? []}
          loading={isLoading}
          onDelete={setDeleteId}
          deletingId={deleteExpense.isPending ? (deleteId ?? undefined) : undefined}
        />
      )}

      <ExpenseCharts stats={stats} loading={statsLoading} />

      <ConfirmationDialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete expense?"
        description="This action will soft-delete the expense record."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={deleteExpense.isPending}
      />
    </div>
  );
}
