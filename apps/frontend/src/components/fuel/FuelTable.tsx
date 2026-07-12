'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { FuelLog } from '@transitops/shared-types';
import Link from 'next/link';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { DataTable } from '@/components/data-table/data-table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/feedback/empty-state';
import { Fuel } from 'lucide-react';

interface FuelTableProps {
  data: FuelLog[];
  loading?: boolean;
  onDelete?: (id: string) => void;
  deletingId?: string;
}

export function FuelTable({ data, loading, onDelete, deletingId }: FuelTableProps) {
  const columns: ColumnDef<FuelLog>[] = [
    { accessorKey: 'vehicleId', header: 'Vehicle' },
    {
      accessorKey: 'tripId',
      header: 'Trip',
      cell: ({ row }) => row.original.tripId ?? '—',
    },
    {
      accessorKey: 'quantity',
      header: 'Quantity',
      cell: ({ row }) => `${row.original.quantity.toFixed(1)} L`,
    },
    {
      accessorKey: 'pricePerLiter',
      header: 'Price',
      cell: ({ row }) => `$${row.original.pricePerLiter.toFixed(2)}/L`,
    },
    {
      accessorKey: 'totalCost',
      header: 'Total',
      cell: ({ row }) => `$${row.original.totalCost.toFixed(2)}`,
    },
    { accessorKey: 'filledAt', header: 'Date' },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/fuel/${row.original.id}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/fuel/${row.original.id}/edit`}>
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
        icon={Fuel}
        title="No fuel logs yet"
        description="Add your first fuel log to start tracking consumption."
      />
    );
  }

  return <DataTable columns={columns} data={data} searchPlaceholder="Search fuel logs..." />;
}
