'use client';

import { TripStatus } from '@/types/trip';
import { Input } from '@/components/ui/input';
import { SearchInput } from '@/components/ui/search-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface TripFilterState {
  search: string;
  status: string;
  startDate: string;
  endDate: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface TripFiltersProps {
  value: TripFilterState;
  onChange: (next: TripFilterState) => void;
}

export function TripFilters({ value, onChange }: TripFiltersProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
      <SearchInput
        placeholder="Search trip, source, destination..."
        value={value.search}
        onChange={(e) => onChange({ ...value, search: e.target.value })}
        containerClassName="xl:col-span-2"
      />
      <Select
        value={value.status || 'ALL'}
        onValueChange={(status) => onChange({ ...value, status: status === 'ALL' ? '' : status })}
      >
        <SelectTrigger>
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All statuses</SelectItem>
          {Object.values(TripStatus).map((status) => (
            <SelectItem key={status} value={status}>
              {status.replaceAll('_', ' ')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="date"
        value={value.startDate}
        onChange={(e) => onChange({ ...value, startDate: e.target.value })}
      />
      <Input
        type="date"
        value={value.endDate}
        onChange={(e) => onChange({ ...value, endDate: e.target.value })}
      />
      <Select
        value={`${value.sortBy}:${value.sortOrder}`}
        onValueChange={(raw) => {
          const [sortBy, sortOrder] = raw.split(':') as [string, 'asc' | 'desc'];
          onChange({ ...value, sortBy, sortOrder });
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="Sort" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="createdAt:desc">Newest created</SelectItem>
          <SelectItem value="plannedStartDate:asc">Start date ↑</SelectItem>
          <SelectItem value="plannedStartDate:desc">Start date ↓</SelectItem>
          <SelectItem value="plannedDistance:desc">Distance</SelectItem>
          <SelectItem value="estimatedRevenue:desc">Revenue</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
