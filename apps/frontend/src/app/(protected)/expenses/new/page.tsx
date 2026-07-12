'use client';

import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExpenseForm } from '@/components/expenses/ExpenseForm';
import { useCreateExpense } from '@/hooks/use-expenses';
import type { ExpenseFormValues } from '@/types/fuel-expense';
import { notify } from '@/utils/notify';

export default function NewExpensePage() {
  const router = useRouter();
  const createExpense = useCreateExpense();

  const handleSubmit = async (values: ExpenseFormValues) => {
    try {
      await createExpense.mutateAsync({
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
      notify.expenseAdded();
      router.push('/expenses');
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Failed to add expense');
    }
  };

  return (
    <div className="space-y-6">
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

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="text-base">Expense Details</CardTitle>
        </CardHeader>
        <CardContent>
          <ExpenseForm onSubmit={handleSubmit} loading={createExpense.isPending} />
        </CardContent>
      </Card>
    </div>
  );
}
