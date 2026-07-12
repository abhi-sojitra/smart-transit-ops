'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Trash2,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { ExpenseRecord, PaginationMeta } from '@transitops/shared-types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/feedback/empty-state';
import { ExpenseStatusBadge } from '@/components/expenses/expense-status-badge';
import { costBarPercent, formatExpenseAmount, getExpenseInitials } from '@/components/fuel/fuel-display';
import { sectionReveal, staggerContainer, tableRowReveal } from '@/components/drivers/motion';
import { cn } from '@/utils/cn';
import { formatDisplayDate } from '@/utils/date';
import type { ExpenseFiltersState } from '@/types/fuel-expense';

type SortField = ExpenseFiltersState['sortBy'];

interface ExpenseTableProps {
  expenses: ExpenseRecord[];
  meta?: PaginationMeta;
  loading?: boolean;
  error?: string | null;
  sortBy: SortField;
  sortOrder: 'asc' | 'desc';
  onSortChange: (sortBy: SortField, sortOrder: 'asc' | 'desc') => void;
  onPageChange: (page: number) => void;
  onDelete: (expense: ExpenseRecord) => void;
}

function SortableHeader({
  label,
  field,
  sortBy,
  sortOrder,
  onSort,
}: {
  label: string;
  field: SortField;
  sortBy: SortField;
  sortOrder: 'asc' | 'desc';
  onSort: (field: SortField) => void;
}) {
  const active = sortBy === field;
  const Icon = !active ? ArrowUpDown : sortOrder === 'asc' ? ArrowUp : ArrowDown;

  return (
    <th className="px-4 py-3.5 font-semibold">
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

function formatCurrency(value: number) {
  return formatExpenseAmount(value);
}

function AmountMeter({ amount, status }: { amount: number; status: string }) {
  const reduceMotion = useReducedMotion();
  const tone =
    status === 'REJECTED'
      ? 'text-red-500'
      : status === 'PENDING'
        ? 'text-amber-500'
        : 'text-emerald-500';
  const barTone =
    status === 'REJECTED'
      ? 'bg-red-500'
      : status === 'PENDING'
        ? 'bg-amber-500'
        : 'bg-emerald-500';
  const width = `${costBarPercent(amount)}%`;

  return (
    <div className="min-w-[110px]">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className={cn('text-sm font-semibold tabular-nums', tone)}>
          {formatCurrency(amount)}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <motion.div
          className={cn('h-full rounded-full', barTone)}
          initial={reduceMotion ? false : { width: 0 }}
          animate={{ width }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}

export function ExpenseTable({
  expenses,
  meta,
  loading,
  error,
  sortBy,
  sortOrder,
  onSortChange,
  onPageChange,
  onDelete,
}: ExpenseTableProps) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      onSortChange(field, sortOrder === 'asc' ? 'desc' : 'asc');
      return;
    }
    onSortChange(field, 'desc');
  };

  if (loading) return <ExpenseLoadingSkeleton />;

  if (error) {
    return <EmptyState title="Unable to load expenses" description={error} />;
  }

  if (!expenses.length) {
    return (
      <EmptyState
        title="No expenses found"
        description="Try adjusting search or filters, or add a new expense."
        actionLabel="Add Expense"
        onAction={() => router.push('/expenses/new')}
      />
    );
  }

  const from = meta ? (meta.page - 1) * meta.limit + 1 : 1;
  const to = meta ? Math.min(meta.page * meta.limit, meta.total) : expenses.length;

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
                  label="Title"
                  field="expenseDate"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                />
                <th className="px-4 py-3.5 font-semibold text-muted-foreground">Vehicle</th>
                <th className="px-4 py-3.5 font-semibold text-muted-foreground">Type</th>
                <SortableHeader
                  label="Amount"
                  field="amount"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                />
                <th className="px-4 py-3.5 font-semibold text-muted-foreground">Status</th>
                <SortableHeader
                  label="Date"
                  field="expenseDate"
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
              key={expenses.map((e) => e.id).join('-')}
            >
              <AnimatePresence initial={false}>
                {expenses.map((expense) => (
                  <motion.tr
                    key={expense.id}
                    variants={tableRowReveal}
                    layout={!reduceMotion}
                    className="group cursor-pointer transition-colors hover:bg-muted/35"
                    onClick={() => router.push(`/expenses/${expense.id}`)}
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary ring-1 ring-primary/20">
                          {getExpenseInitials(expense.title)}
                        </div>
                        <p className="truncate font-medium text-foreground group-hover:text-primary">
                          {expense.title}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-sm">{expense.vehicleId}</td>
                    <td className="px-4 py-3.5 text-sm">
                      {expense.expenseType.replaceAll('_', ' ')}
                    </td>
                    <td className="px-4 py-3.5">
                      <AmountMeter amount={expense.amount} status={expense.status} />
                    </td>
                    <td className="px-4 py-3.5">
                      <ExpenseStatusBadge status={expense.status} />
                    </td>
                    <td className="px-4 py-3.5 tabular-nums text-muted-foreground">
                      {formatDisplayDate(expense.expenseDate)}
                    </td>
                    <td className="px-4 py-3.5">
                      <div
                        className="flex items-center justify-end gap-1 opacity-80 transition-opacity group-hover:opacity-100"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                          <Link href={`/expenses/${expense.id}`} aria-label="View expense">
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                          <Link href={`/expenses/${expense.id}/edit`} aria-label="Edit expense">
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label="Delete expense"
                          onClick={() => onDelete(expense)}
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
            of <span className="font-medium text-foreground">{meta.total}</span> expenses
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

export function ExpenseLoadingSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="border-b border-border bg-muted/40 px-4 py-3.5">
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <div className="space-y-0 divide-y divide-border/70">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="hidden h-4 w-20 sm:block" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
