'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { ExpenseRecord } from '@transitops/shared-types';
import Link from 'next/link';
import { Eye, Pencil, Trash2, Receipt } from 'lucide-react';
import { DataTable } from '@/components/data-table/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/feedback/empty-state';

interface ExpenseTableProps {
  data: ExpenseRecord[];
  loading?: boolean;
  onDelete?: (id: string) => void;
  deletingId?: string;
}

export function ExpenseTable({ data, loading, onDelete, deletingId }: ExpenseTableProps) {
  const columns: ColumnDef<ExpenseRecord>[] = [
    { accessorKey: 'vehicleId', header: 'Vehicle' },
    {
      accessorKey: 'tripId',
      header: 'Trip',
      cell: ({ row }) => row.original.tripId ?? '—',
    },
    {
      accessorKey: 'expenseType',
      header: 'Type',
      cell: ({ row }) => row.original.expenseType.replaceAll('_', ' '),
    },
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
    { accessorKey: 'expenseDate', header: 'Date' },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/expenses/${row.original.id}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/expenses/${row.original.id}/edit`}>
              <Pencil className="h-4 w-4" />
            </Link>
          </Button>
          {onDelete ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-600"
              loading={deletingId === row.original.id}
              onClick={() => onDelete(row.original.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full max-w-sm" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!data.length) {
    return (
      <EmptyState
        icon={Receipt}
        title="No expenses yet"
        description="Add your first expense to start tracking operating costs."
      />
    );
  }

  return <DataTable columns={columns} data={data} searchPlaceholder="Search expenses..." />;
}
