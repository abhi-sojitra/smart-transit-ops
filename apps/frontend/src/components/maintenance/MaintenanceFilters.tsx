'use client';

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
  const set = (patch: Partial<MaintenanceListParams>) =>
    onChange({ ...value, page: 1, ...patch });

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card/40 p-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SearchInput
          placeholder="Search number, vehicle, vendor..."
          value={value.search ?? ''}
          onChange={(value) => set({ search: value })}
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
      <div className="flex justify-end">
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
    </div>
  );
}
