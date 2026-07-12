'use client';

import { useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SearchInput } from '@/components/ui/search-input';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/feedback/empty-state';
import { cn } from '@/utils/cn';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchPlaceholder?: string;
  searchKey?: keyof TData & string;
  className?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder = 'Search...',
  searchKey,
  className,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: (row, _columnId, filterValue) => {
      if (!searchKey) {
        return Object.values(row.original as Record<string, unknown>)
          .join(' ')
          .toLowerCase()
          .includes(String(filterValue).toLowerCase());
      }
      const value = row.getValue(searchKey);
      return String(value ?? '')
        .toLowerCase()
        .includes(String(filterValue).toLowerCase());
    },
  });

  const rows = table.getRowModel().rows;
  const pageCount = table.getPageCount();

  return (
    <div className={cn('space-y-4', className)}>
      <SearchInput
        placeholder={searchPlaceholder}
        value={globalFilter}
        onChange={(value) => setGlobalFilter(value)}
        containerClassName="max-w-sm"
      />
      <div className="overflow-hidden rounded-xl border border-border">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-muted/50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-border">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="h-11 px-4 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground"
                    >
                      {header.isPlaceholder ? null : (
                        <button
                          type="button"
                          className={cn(
                            'inline-flex items-center gap-1',
                            header.column.getCanSort() && 'cursor-pointer hover:text-foreground',
                          )}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </button>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {rows.length ? (
                rows.map((row) => (
                  <tr key={row.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3 align-middle">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="p-0">
                    <EmptyState title="No results" description="Try adjusting your search or filters." />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of {Math.max(pageCount, 1)}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
