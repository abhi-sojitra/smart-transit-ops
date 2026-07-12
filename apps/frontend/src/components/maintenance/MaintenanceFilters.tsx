'use client';

import { useMemo } from 'react';
import { X } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  MAINTENANCE_PRIORITY_OPTIONS,
  MAINTENANCE_STATUS_OPTIONS,
  MAINTENANCE_TYPE_OPTIONS,
  type MaintenanceListParams,
} from '@/types/maintenance';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { VehicleSelect } from '@/components/fleet/vehicle-select';
import { SearchInput } from '@/components/ui/search-input';
import { Button } from '@/components/ui/button';
import { sectionReveal } from '@/components/drivers/motion';
import { formatDisplayDate } from '@/utils/date';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MaintenanceFiltersProps {
  value: MaintenanceListParams;
  onChange: (next: MaintenanceListParams) => void;
}

export function MaintenanceFilters({ value, onChange }: MaintenanceFiltersProps) {
  const reduceMotion = useReducedMotion();
  const set = (patch: Partial<MaintenanceListParams>) =>
    onChange({ ...value, page: 1, ...patch });

  const chips = useMemo(() => {
    const items: Array<{ key: string; label: string; clear: () => void }> = [];
    if (value.search?.trim()) {
      items.push({
        key: 'search',
        label: `Search: ${value.search}`,
        clear: () => set({ search: '' }),
      });
    }
    if (value.status) {
      const label =
        MAINTENANCE_STATUS_OPTIONS.find((opt) => opt.value === value.status)?.label ?? value.status;
      items.push({ key: 'status', label: `Status: ${label}`, clear: () => set({ status: '' }) });
    }
    if (value.priority) {
      const label =
        MAINTENANCE_PRIORITY_OPTIONS.find((opt) => opt.value === value.priority)?.label ??
        value.priority;
      items.push({ key: 'priority', label: `Priority: ${label}`, clear: () => set({ priority: '' }) });
    }
    if (value.maintenanceType) {
      const label =
        MAINTENANCE_TYPE_OPTIONS.find((opt) => opt.value === value.maintenanceType)?.label ??
        value.maintenanceType;
      items.push({
        key: 'type',
        label: `Type: ${label}`,
        clear: () => set({ maintenanceType: '' }),
      });
    }
    if (value.vehicleId) {
      items.push({
        key: 'vehicle',
        label: 'Vehicle filtered',
        clear: () => set({ vehicleId: undefined }),
      });
    }
    if (value.startDateFrom) {
      items.push({
        key: 'from',
        label: `From: ${formatDisplayDate(value.startDateFrom)}`,
        clear: () => set({ startDateFrom: undefined }),
      });
    }
    if (value.startDateTo) {
      items.push({
        key: 'to',
        label: `To: ${formatDisplayDate(value.startDateTo)}`,
        clear: () => set({ startDateTo: undefined }),
      });
    }
    return items;
  }, [value]);

  return (
    <motion.div
      className="space-y-3 rounded-xl border border-border bg-card/60 p-4"
      variants={sectionReveal}
      initial={reduceMotion ? false : 'hidden'}
      animate="show"
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SearchInput
          placeholder="Search number, vehicle, vendor..."
          value={value.search ?? ''}
          onChange={(search) => set({ search })}
        />
        <Select
          value={value.status || 'all'}
          onValueChange={(v) => set({ status: v === 'all' ? '' : (v as MaintenanceListParams['status']) })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {MAINTENANCE_STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={value.priority || 'all'}
          onValueChange={(v) =>
            set({ priority: v === 'all' ? '' : (v as MaintenanceListParams['priority']) })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            {MAINTENANCE_PRIORITY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={value.maintenanceType || 'all'}
          onValueChange={(v) =>
            set({
              maintenanceType: v === 'all' ? '' : (v as MaintenanceListParams['maintenanceType']),
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {MAINTENANCE_TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <VehicleSelect
          allowAll
          allLabel="All vehicles"
          valueKey="id"
          value={value.vehicleId ?? ''}
          onChange={(vehicleId) => set({ vehicleId: vehicleId || undefined })}
          placeholder="All vehicles"
        />
        <DateRangePicker
          className="md:col-span-2"
          value={{ from: value.startDateFrom, to: value.startDateTo }}
          onChange={({ from, to }) => set({ startDateFrom: from, startDateTo: to })}
          placeholder="Filter by start date"
          numberOfMonths={1}
        />
        <Select
          value={`${value.sortBy ?? 'createdAt'}:${value.sortOrder ?? 'desc'}`}
          onValueChange={(v) => {
            const [sortBy, sortOrder] = v.split(':') as [string, 'asc' | 'desc'];
            set({ sortBy, sortOrder });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt:desc">Created (newest)</SelectItem>
            <SelectItem value="createdAt:asc">Created (oldest)</SelectItem>
            <SelectItem value="startDate:desc">Start date</SelectItem>
            <SelectItem value="expectedCompletionDate:asc">Expected completion</SelectItem>
            <SelectItem value="estimatedCost:desc">Estimated cost</SelectItem>
            <SelectItem value="actualCost:desc">Actual cost</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={chip.clear}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs text-foreground transition hover:bg-muted"
            >
              {chip.label}
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            onChange({
              page: 1,
              limit: value.limit ?? 10,
              sortBy: 'createdAt',
              sortOrder: 'desc',
            })
          }
        >
          Reset filters
        </Button>
      </div>
    </motion.div>
  );
}
