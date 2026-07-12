'use client';

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ExpenseStatus, ExpenseType } from '@transitops/shared-types';
import type { ExpenseFilterValues } from '@/types/fuel-expense';

interface ExpenseFiltersProps {
  values: ExpenseFilterValues;
  onChange: (values: ExpenseFilterValues) => void;
  onReset: () => void;
}

export function ExpenseFilters({ values, onChange, onReset }: ExpenseFiltersProps) {
  return (
    <div className="grid gap-3 rounded-xl border border-border bg-muted/20 p-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
      <Input
        placeholder="Search..."
        value={values.search ?? ''}
        onChange={(e) => onChange({ ...values, search: e.target.value })}
      />
      <Input
        placeholder="Vehicle ID"
        value={values.vehicleId ?? ''}
        onChange={(e) => onChange({ ...values, vehicleId: e.target.value })}
      />
      <Select
        value={values.expenseType ?? 'all'}
        onValueChange={(v) => onChange({ ...values, expenseType: v === 'all' ? undefined : v })}
      >
        <SelectTrigger>
          <SelectValue placeholder="Expense type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All types</SelectItem>
          {Object.values(ExpenseType).map((t) => (
            <SelectItem key={t} value={t}>
              {t.replaceAll('_', ' ')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={values.status ?? 'all'}
        onValueChange={(v) => onChange({ ...values, status: v === 'all' ? undefined : v })}
      >
        <SelectTrigger>
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {Object.values(ExpenseStatus).map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="date"
        value={values.dateFrom ?? ''}
        onChange={(e) => onChange({ ...values, dateFrom: e.target.value })}
      />
      <Input
        type="date"
        value={values.dateTo ?? ''}
        onChange={(e) => onChange({ ...values, dateTo: e.target.value })}
      />
      <Button variant="outline" onClick={onReset} className="sm:col-span-2 lg:col-span-1">
        Reset
      </Button>
    </div>
  );
}
