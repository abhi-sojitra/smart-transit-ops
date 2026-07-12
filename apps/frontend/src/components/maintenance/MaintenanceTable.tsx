'use client';

import Link from 'next/link';
import { Eye, Pencil, MoreHorizontal, CheckCircle2, XCircle, Trash2, PlayCircle } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { ColumnDef } from '@tanstack/react-table';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import type { Maintenance } from '@transitops/shared-types';
import { MaintenanceStatus } from '@transitops/shared-types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/feedback/empty-state';
import { MaintenanceStatusBadge } from './MaintenanceStatusBadge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { PaginationMeta } from '@transitops/shared-types';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { sectionReveal, staggerContainer, tableRowReveal } from '@/components/drivers/motion';

interface MaintenanceTableProps {
  data: Maintenance[];
  meta?: PaginationMeta;
  loading?: boolean;
  onPageChange?: (page: number) => void;
  onStart?: (row: Maintenance) => void;
  onComplete?: (row: Maintenance) => void;
  onCancel?: (row: Maintenance) => void;
  onDelete?: (row: Maintenance) => void;
}

function money(value?: number) {
  if (value === undefined || value === null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

function formatDate(value?: string) {
  if (!value || value === 'undefined' || value === 'null') return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString();
}

function formatEnum(value?: string | null) {
  if (!value) return '—';
  return value.replaceAll('_', ' ');
}

export function MaintenanceTable({
  data,
  meta,
  loading,
  onPageChange,
  onStart,
  onComplete,
  onCancel,
  onDelete,
}: MaintenanceTableProps) {
  const reduceMotion = useReducedMotion();
  const columns: ColumnDef<Maintenance>[] = [
    {
      accessorKey: 'maintenanceNumber',
      header: 'Maintenance #',
      cell: ({ row }) => (
        <Link
          href={`/maintenance/${row.original.id}`}
          className="font-medium text-primary hover:underline"
        >
          {row.original.maintenanceNumber ?? '—'}
        </Link>
      ),
    },
    {
      id: 'vehicle',
      header: 'Vehicle',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.vehicleNumber ?? '—'}</p>
          <p className="text-xs text-muted-foreground">{row.original.vehicleModel}</p>
        </div>
      ),
    },
    {
      accessorKey: 'maintenanceType',
      header: 'Type',
      cell: ({ row }) => formatEnum(row.original.maintenanceType),
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ row }) =>
        row.original.priority ? (
          <Badge status={row.original.priority}>{row.original.priority}</Badge>
        ) : (
          '—'
        ),
    },
    {
      accessorKey: 'vendorName',
      header: 'Vendor',
      cell: ({ row }) => row.original.vendorName ?? '—',
    },
    {
      accessorKey: 'estimatedCost',
      header: 'Est. Cost',
      cell: ({ row }) => money(row.original.estimatedCost),
    },
    {
      accessorKey: 'actualCost',
      header: 'Actual Cost',
      cell: ({ row }) => money(row.original.actualCost),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) =>
        row.original.status ? (
          <MaintenanceStatusBadge status={row.original.status} />
        ) : (
          '—'
        ),
    },
    {
      accessorKey: 'expectedCompletionDate',
      header: 'Expected',
      cell: ({ row }) => formatDate(row.original.expectedCompletionDate),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const item = row.original;
        const active =
          item.status === MaintenanceStatus.SCHEDULED ||
          item.status === MaintenanceStatus.IN_PROGRESS;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Actions">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/maintenance/${item.id}`}>
                  <Eye className="mr-2 h-4 w-4" /> View
                </Link>
              </DropdownMenuItem>
              {item.status !== MaintenanceStatus.COMPLETED &&
              item.status !== MaintenanceStatus.CANCELLED ? (
                <DropdownMenuItem asChild>
                  <Link href={`/maintenance/${item.id}/edit`}>
                    <Pencil className="mr-2 h-4 w-4" /> Edit
                  </Link>
                </DropdownMenuItem>
              ) : null}
              {item.status === MaintenanceStatus.SCHEDULED ? (
                <DropdownMenuItem onClick={() => onStart?.(item)}>
                  <PlayCircle className="mr-2 h-4 w-4" /> Start work
                </DropdownMenuItem>
              ) : null}
              {active ? (
                <>
                  <DropdownMenuItem onClick={() => onComplete?.(item)}>
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Complete
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onCancel?.(item)}>
                    <XCircle className="mr-2 h-4 w-4" /> Cancel
                  </DropdownMenuItem>
                </>
              ) : null}
              <DropdownMenuItem onClick={() => onDelete?.(item)} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: meta?.totalPages ?? 1,
  });

  if (loading) {
    return (
      <div className="space-y-3 rounded-xl border border-border p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  const rows = table.getRowModel().rows;

  return (
    <motion.div
      className="space-y-4"
      variants={sectionReveal}
      initial={reduceMotion ? false : 'hidden'}
      animate="show"
    >
      <div className="overflow-hidden rounded-xl border border-border">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
            <thead className="bg-muted/50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-border">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="h-11 px-4 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground"
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <motion.tbody variants={staggerContainer} initial={false} animate="show">
              <AnimatePresence initial={false}>
                {rows.length ? (
                  rows.map((row) => (
                    <motion.tr
                      key={row.id}
                      variants={tableRowReveal}
                      initial={reduceMotion ? false : 'hidden'}
                      animate="show"
                      exit="exit"
                      className="border-b border-border last:border-0 hover:bg-muted/30"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-3 align-middle">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columns.length} className="p-0">
                      <EmptyState
                        title="No maintenance records"
                        description="Create a work order to get started."
                        actionLabel="New Maintenance"
                        onAction={() => {
                          window.location.href = '/maintenance/new';
                        }}
                      />
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </motion.tbody>
          </table>
        </div>
      </div>
      {meta ? (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Page {meta.page} of {meta.totalPages} · {meta.total} total
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page <= 1}
              onClick={() => onPageChange?.(meta.page - 1)}
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page >= meta.totalPages}
              onClick={() => onPageChange?.(meta.page + 1)}
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </motion.div>
  );
}
