'use client';

import { useRouter } from 'next/navigation';
import { use } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { PageHeader } from '@/components/layout/page-header';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { ExpenseForm } from '@/components/expenses';
import { pageFade } from '@/components/drivers/motion';
import { useExpenseDetail, useUpdateExpense } from '@/hooks/use-expenses';
import type { ExpenseFormValues } from '@/types/fuel-expense';
import { toast } from 'sonner';
import { AxiosError } from 'axios';

export default function EditExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const { data: expense, isLoading } = useExpenseDetail(id);
  const updateMutation = useUpdateExpense();

  if (isLoading) {
    return <Skeleton className="h-96 w-full rounded-xl" />;
  }

  if (!expense) {
    return <p className="text-sm text-red-500">Expense not found.</p>;
  }

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
            { label: expense.title, href: `/expenses/${id}` },
            { label: 'Edit' },
          ]}
        />
        <PageHeader title="Edit Expense" description={`Updating ${expense.title}`} />
      </div>

      <ExpenseForm
        defaultValues={{
          vehicleId: expense.vehicleId,
          tripId: expense.tripId,
          driverId: expense.driverId,
          expenseType: expense.expenseType,
          title: expense.title,
          description: expense.description,
          amount: expense.amount,
          expenseDate: expense.expenseDate,
          receiptImage: expense.receiptImage,
          status: expense.status,
          notes: expense.notes,
        }}
        submitting={updateMutation.isPending}
        submitLabel="Update Expense"
        showStatus
        onCancel={() => router.push(`/expenses/${id}`)}
        onSubmit={async (values: ExpenseFormValues) => {
          try {
            await updateMutation.mutateAsync({
              id,
              payload: {
                ...values,
                tripId: values.tripId || undefined,
                driverId: values.driverId || undefined,
                description: values.description || undefined,
                receiptImage: values.receiptImage || undefined,
                notes: values.notes || undefined,
              },
            });
            toast.success('Expense updated');
            router.push(`/expenses/${id}`);
          } catch (error) {
            const message =
              error instanceof AxiosError
                ? ((error.response?.data as { message?: string })?.message ?? error.message)
                : 'Failed to update expense';
            toast.error(message);
          }
        }}
      />
    </motion.div>
  );
}
