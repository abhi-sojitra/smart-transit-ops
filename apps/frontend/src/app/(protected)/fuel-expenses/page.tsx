'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { DollarSign, Fuel, Wallet } from 'lucide-react';
import type { FuelExpense } from '@transitops/shared-types';
import { PageHeader } from '@/components/layout/page-header';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { StatCard } from '@/components/charts/stat-card';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/data-table/data-table';
import { mockExpenses } from '@/constants/mock-data';

const columns: ColumnDef<FuelExpense>[] = [
  { accessorKey: 'date', header: 'Date' },
  { accessorKey: 'vehicleId', header: 'Vehicle' },
  { accessorKey: 'type', header: 'Type' },
  {
    accessorKey: 'amount',
    header: 'Amount',
    cell: ({ row }) => `$${row.original.amount.toFixed(2)}`,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <Badge status={row.original.status}>{row.original.status}</Badge>,
  },
];

export default function FuelExpensesPage() {
  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb items={[{ label: 'Home', href: '/dashboard' }, { label: 'Fuel & Expense' }]} />
        <PageHeader
          title="Fuel & Expense Management"
          description="Track fuel logs and operating expenses across the fleet."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Total Fuel Cost" value="$12,480" icon={Fuel} growth={3} />
        <StatCard title="Avg Fuel Price" value="$1.74/L" icon={DollarSign} growth={-1} />
        <StatCard title="Total Expenses" value="$18,920" icon={Wallet} growth={5} />
      </div>

      <DataTable columns={columns} data={mockExpenses} searchPlaceholder="Search expenses..." />
    </div>
  );
}
