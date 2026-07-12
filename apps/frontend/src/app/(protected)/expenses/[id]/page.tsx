'use client';

import Link from 'next/link';
import { use, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { AxiosError } from 'axios';
import { motion, useReducedMotion } from 'framer-motion';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExpenseStatusBadge } from '@/components/expenses';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DeleteExpenseDialog } from '@/components/expenses';
import { pageFade, staggerContainer, staggerItem } from '@/components/drivers/motion';
import { useDeleteExpense, useExpenseDetail } from '@/hooks/use-expenses';
import { formatDisplayDate } from '@/utils/date';

export default function ExpenseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { data: expense, isLoading, isError } = useExpenseDetail(id);
  const deleteMutation = useDeleteExpense();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-80 w-full max-w-2xl rounded-xl" />
      </div>
    );
  }

  if (isError || !expense) {
    return <p className="text-sm text-red-500">Expense not found.</p>;
  }

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Expense deleted');
      router.push('/expenses');
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
            { label: 'Expenses', href: '/expenses' },
            { label: expense.title },
          ]}
        />
        <PageHeader
          title={expense.title}
          description={`${expense.vehicleId} · ${formatDisplayDate(expense.expenseDate)}`}
          actions={
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link href={`/expenses/${id}/edit`}>
                  <Pencil className="h-4 w-4" />
                  Edit
                </Link>
              </Button>
              <Button variant="danger" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          }
        />
      </div>

      <motion.div
        className="grid gap-4 md:grid-cols-2"
        variants={staggerContainer}
        initial={reduceMotion ? false : 'hidden'}
        animate="show"
      >
        <motion.div variants={staggerItem}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Assignment</CardTitle>
              <ExpenseStatusBadge status={expense.status} />
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Detail label="Vehicle" value={expense.vehicleId} />
              <Detail label="Trip" value={expense.tripId ?? '—'} />
              <Detail label="Driver" value={expense.driverId ?? '—'} />
              <Detail label="Date" value={formatDisplayDate(expense.expenseDate)} />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Expense</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Detail label="Type" value={expense.expenseType.replaceAll('_', ' ')} />
              <Detail label="Amount" value={`$${expense.amount.toFixed(2)}`} />
              {expense.description ? (
                <Detail label="Description" value={expense.description} className="sm:col-span-2" />
              ) : null}
              {expense.notes ? (
                <Detail label="Notes" value={expense.notes} className="sm:col-span-2" />
              ) : null}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <DeleteExpenseDialog
        expense={expense}
        open={deleteOpen}
        loading={deleteMutation.isPending}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
      />
    </motion.div>
  );
}

function Detail({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}
