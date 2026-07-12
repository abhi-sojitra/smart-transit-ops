'use client';

import Link from 'next/link';
import { use } from 'react';
import { Pencil } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useExpenseDetail } from '@/hooks/use-expenses';

export default function ExpenseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: expense, isLoading, isError } = useExpenseDetail(id);

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

  return (
    <div className="space-y-6">
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
          description={`${expense.vehicleId} · ${expense.expenseDate}`}
          actions={
            <Button asChild variant="outline">
              <Link href={`/expenses/${id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
          }
        />
      </div>

      <Card className="max-w-2xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Expense Details</CardTitle>
          <Badge status={expense.status}>{expense.status}</Badge>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Detail label="Vehicle" value={expense.vehicleId} />
          <Detail label="Trip" value={expense.tripId ?? '—'} />
          <Detail label="Driver" value={expense.driverId ?? '—'} />
          <Detail label="Type" value={expense.expenseType.replaceAll('_', ' ')} />
          <Detail label="Amount" value={`$${expense.amount.toFixed(2)}`} />
          <Detail label="Date" value={expense.expenseDate} />
          <Detail label="Description" value={expense.description ?? '—'} className="sm:col-span-2" />
          <Detail label="Notes" value={expense.notes ?? '—'} className="sm:col-span-2" />
        </CardContent>
      </Card>
    </div>
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
