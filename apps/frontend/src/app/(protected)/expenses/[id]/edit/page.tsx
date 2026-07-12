'use client';

import { useRouter } from 'next/navigation';
import { use } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ExpenseForm } from '@/components/expenses/ExpenseForm';
import { useExpenseDetail, useUpdateExpense } from '@/hooks/use-expenses';
import type { ExpenseFormValues } from '@/types/fuel-expense';
import { notify } from '@/utils/notify';

export default function EditExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: expense, isLoading } = useExpenseDetail(id);
  const updateExpense = useUpdateExpense();

  const handleSubmit = async (values: ExpenseFormValues) => {
    try {
      await updateExpense.mutateAsync({
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
      notify.expenseUpdated();
      router.push(`/expenses/${id}`);
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Failed to update expense');
    }
  };

  if (isLoading) {
    return <Skeleton className="h-96 w-full max-w-3xl rounded-xl" />;
  }

  if (!expense) {
    return <p className="text-sm text-red-500">Expense not found.</p>;
  }

  return (
    <div className="space-y-6">
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

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="text-base">Expense Details</CardTitle>
        </CardHeader>
        <CardContent>
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
            onSubmit={handleSubmit}
            loading={updateExpense.isPending}
            submitLabel="Update Expense"
            showStatus
          />
        </CardContent>
      </Card>
    </div>
  );
}
