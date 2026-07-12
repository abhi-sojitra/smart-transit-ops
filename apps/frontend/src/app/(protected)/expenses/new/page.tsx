'use client';

import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { PageHeader } from '@/components/layout/page-header';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { ExpenseForm } from '@/components/expenses';
import { pageFade } from '@/components/drivers/motion';
import { useCreateExpense } from '@/hooks/use-expenses';
import type { ExpenseFormValues } from '@/types/fuel-expense';
import { toast } from 'sonner';
import { AxiosError } from 'axios';

export default function NewExpensePage() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const createMutation = useCreateExpense();

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
            { label: 'Add Expense' },
          ]}
        />
        <PageHeader title="Add Expense" description="Record a new operating expense." />
      </div>

      <ExpenseForm
        submitting={createMutation.isPending}
        submitLabel="Create Expense"
        onCancel={() => router.push('/expenses')}
        onSubmit={async (values: ExpenseFormValues) => {
          try {
            const expense = await createMutation.mutateAsync({
              vehicleId: values.vehicleId,
              expenseType: values.expenseType,
              title: values.title,
              amount: values.amount,
              expenseDate: values.expenseDate,
              tripId: values.tripId || undefined,
              driverId: values.driverId || undefined,
              description: values.description || undefined,
              receiptImage: values.receiptImage || undefined,
              notes: values.notes || undefined,
            });
            toast.success('Expense added');
            router.push(`/expenses/${expense.id}`);
          } catch (error) {
            const message =
              error instanceof AxiosError
                ? ((error.response?.data as { message?: string })?.message ?? error.message)
                : 'Failed to add expense';
            toast.error(message);
          }
        }}
      />
    </motion.div>
  );
}
