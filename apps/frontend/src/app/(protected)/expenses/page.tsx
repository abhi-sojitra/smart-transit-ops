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
import { ExpenseStatisticsCards } from '@/components/expenses';
import { ExpenseCharts } from '@/components/charts/FuelExpenseCharts';
import {
  DeleteExpenseDialog,
  ExpenseCard,
  ExpenseFilters,
  ExpenseLoadingSkeleton,
  ExpenseTable,
} from '@/components/expenses';
import { EmptyState } from '@/components/feedback/empty-state';
import { pageFade, staggerContainer } from '@/components/drivers/motion';
import { useDeleteExpense, useExpenseList, useExpenseStatistics } from '@/hooks/use-expenses';
import type { ExpenseFiltersState } from '@/types/fuel-expense';
import type { ExpenseRecord } from '@transitops/shared-types';

const DEFAULT_FILTERS: ExpenseFiltersState = {
  search: '',
  vehicleId: '',
  expenseType: undefined,
  status: undefined,
  dateFrom: undefined,
  dateTo: undefined,
  sortBy: 'expenseDate',
  sortOrder: 'desc',
  page: 1,
  limit: 10,
};

export default function ExpensesListPage() {
  const reduceMotion = useReducedMotion();
  const [filters, setFilters] = useState<ExpenseFiltersState>(DEFAULT_FILTERS);
  const [deleteTarget, setDeleteTarget] = useState<ExpenseRecord | null>(null);

  const listQuery = useExpenseList(filters);
  const statsQuery = useExpenseStatistics(filters.dateFrom, filters.dateTo);
  const deleteMutation = useDeleteExpense();

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

  const expenses = listQuery.data?.data ?? [];
  const meta = listQuery.data?.meta;

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success('Expense deleted');
      setDeleteTarget(null);
    } catch (error) {
      const message =
        error instanceof AxiosError
          ? ((error.response?.data as { message?: string })?.message ?? error.message)
          : 'Failed to delete expense';
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
            { label: 'Expenses' },
          ]}
        />
        <PageHeader
          title="Expenses"
          description="Track operating expenses across your fleet."
          actions={
            <Button asChild>
              <Link href="/expenses/new">
                <Plus className="h-4 w-4" />
                Add Expense
              </Link>
            </Button>
          }
        />
      </div>

      <ExpenseStatisticsCards stats={statsQuery.data} loading={statsQuery.isLoading} />

      <ExpenseFilters
        filters={filters}
        onChange={(next) => setFilters((prev) => ({ ...prev, ...next }))}
        onReset={() => setFilters(DEFAULT_FILTERS)}
      />

      <div className="hidden md:block">
        <ExpenseTable
          expenses={expenses}
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
          <ExpenseLoadingSkeleton />
        ) : errorMessage ? (
          <EmptyState title="Unable to load expenses" description={errorMessage} />
        ) : expenses.length === 0 ? (
          <EmptyState
            title="No expenses found"
            description="Try adjusting search or filters, or add a new expense."
            actionLabel="Add Expense"
            onAction={() => {
              window.location.href = '/expenses/new';
            }}
          />
        ) : (
          <>
            {expenses.map((expense) => (
              <ExpenseCard key={expense.id} expense={expense} onDelete={setDeleteTarget} />
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

      <ExpenseCharts stats={statsQuery.data} loading={statsQuery.isLoading} />

      <DeleteExpenseDialog
        expense={deleteTarget}
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
