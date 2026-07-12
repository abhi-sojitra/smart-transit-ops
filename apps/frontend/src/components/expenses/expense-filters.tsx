'use client';

import { Search } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { ExpenseStatus, ExpenseType } from '@transitops/shared-types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { VehicleSelect } from '@/components/fleet/vehicle-select';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { sectionReveal } from '@/components/drivers/motion';
import type { ExpenseFiltersState } from '@/types/fuel-expense';

interface ExpenseFiltersProps {
  filters: ExpenseFiltersState;
  onChange: (next: Partial<ExpenseFiltersState>) => void;
  onReset: () => void;
}

export function ExpenseFilters({ filters, onChange, onReset }: ExpenseFiltersProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="space-y-3 rounded-xl border border-border bg-card/60 p-4"
      variants={sectionReveal}
      initial={reduceMotion ? false : 'hidden'}
      animate="show"
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="relative md:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search title, vehicle, trip..."
            value={filters.search ?? ''}
            onChange={(e) => onChange({ search: e.target.value, page: 1 })}
          />
        </div>
        <VehicleSelect
          value={filters.vehicleId ?? ''}
          onChange={(vehicleId) => onChange({ vehicleId: vehicleId || undefined, page: 1 })}
          placeholder="All vehicles"
          allowAll
        />
        <Select
          value={filters.expenseType ?? 'ALL'}
          onValueChange={(value) =>
            onChange({ expenseType: value === 'ALL' ? undefined : value, page: 1 })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Expense type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All types</SelectItem>
            {Object.values(ExpenseType).map((type) => (
              <SelectItem key={type} value={type}>
                {type.replaceAll('_', ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Select
          value={filters.status ?? 'ALL'}
          onValueChange={(value) =>
            onChange({ status: value === 'ALL' ? undefined : value, page: 1 })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {Object.values(ExpenseStatus).map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <DateRangePicker
          className="md:col-span-2"
          value={{ from: filters.dateFrom, to: filters.dateTo }}
          onChange={({ from, to }) => onChange({ dateFrom: from, dateTo: to, page: 1 })}
          placeholder="Filter by date range"
          disableFuture
        />

        <div className="flex gap-2">
          <Select
            value={filters.sortBy}
            onValueChange={(value) =>
              onChange({ sortBy: value as ExpenseFiltersState['sortBy'] })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="expenseDate">Expense date</SelectItem>
              <SelectItem value="amount">Amount</SelectItem>
              <SelectItem value="expenseType">Type</SelectItem>
              <SelectItem value="createdAt">Created date</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.sortOrder}
            onValueChange={(value) =>
              onChange({ sortOrder: value as 'asc' | 'desc' })
            }
          >
            <SelectTrigger className="w-[110px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Asc</SelectItem>
              <SelectItem value="desc">Desc</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={onReset}>
          Reset filters
        </Button>
      </div>
    </motion.div>
  );
}
