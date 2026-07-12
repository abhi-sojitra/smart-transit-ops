'use client';

import { Search } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { FuelType } from '@transitops/shared-types';
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
import type { FuelFiltersState } from '@/types/fuel-expense';

interface FuelFiltersProps {
  filters: FuelFiltersState;
  onChange: (next: Partial<FuelFiltersState>) => void;
  onReset: () => void;
}

export function FuelFilters({ filters, onChange, onReset }: FuelFiltersProps) {
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
            placeholder="Search station, vehicle, trip..."
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
        <Input
          placeholder="Trip ID"
          value={filters.tripId ?? ''}
          onChange={(e) => onChange({ tripId: e.target.value, page: 1 })}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Select
          value={filters.fuelType ?? 'ALL'}
          onValueChange={(value) =>
            onChange({ fuelType: value === 'ALL' ? undefined : value, page: 1 })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Fuel type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All types</SelectItem>
            {Object.values(FuelType).map((type) => (
              <SelectItem key={type} value={type}>
                {type}
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
              onChange({ sortBy: value as FuelFiltersState['sortBy'] })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="filledAt">Fill date</SelectItem>
              <SelectItem value="totalCost">Total cost</SelectItem>
              <SelectItem value="quantity">Quantity</SelectItem>
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
