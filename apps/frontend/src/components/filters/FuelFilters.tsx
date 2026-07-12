'use client';

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { FuelType } from '@transitops/shared-types';
import type { FuelFilterValues } from '@/types/fuel-expense';

interface FuelFiltersProps {
  values: FuelFilterValues;
  onChange: (values: FuelFilterValues) => void;
  onReset: () => void;
}

export function FuelFilters({ values, onChange, onReset }: FuelFiltersProps) {
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
      <Input
        placeholder="Trip ID"
        value={values.tripId ?? ''}
        onChange={(e) => onChange({ ...values, tripId: e.target.value })}
      />
      <Select
        value={values.fuelType ?? 'all'}
        onValueChange={(v) => onChange({ ...values, fuelType: v === 'all' ? undefined : v })}
      >
        <SelectTrigger>
          <SelectValue placeholder="Fuel type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All types</SelectItem>
          {Object.values(FuelType).map((t) => (
            <SelectItem key={t} value={t}>
              {t}
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
