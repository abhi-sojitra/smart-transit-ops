'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { sectionReveal } from '@/components/drivers/motion';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { TripStatus } from '@/types/trip';
import { TRIP_STATUS_LABEL } from '@/components/trips/trip-display';

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
  onReset: () => void;
}

export function TripFilters({ value, onChange, onReset }: TripFiltersProps) {
  const reduceMotion = useReducedMotion();
  const searchRef = useRef<HTMLInputElement>(null);
  const [searchDraft, setSearchDraft] = useState(value.search);
  const debouncedSearch = useDebouncedValue(searchDraft, 300);

  useEffect(() => {
    setSearchDraft(value.search);
  }, [value.search]);

  useEffect(() => {
    if (debouncedSearch !== value.search) {
      onChange({ ...value, search: debouncedSearch });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only sync debounced search
  }, [debouncedSearch]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const chips = useMemo(() => {
    const items: Array<{ key: string; label: string; clear: () => void }> = [];
    if (value.search.trim()) {
      items.push({
        key: 'search',
        label: `Search: ${value.search}`,
        clear: () => {
          setSearchDraft('');
          onChange({ ...value, search: '' });
        },
      });
    }
    if (value.status) {
      items.push({
        key: 'status',
        label: `Status: ${TRIP_STATUS_LABEL[value.status] ?? value.status}`,
        clear: () => onChange({ ...value, status: '' }),
      });
    }
    if (value.startDate) {
      items.push({
        key: 'start',
        label: `From: ${value.startDate}`,
        clear: () => onChange({ ...value, startDate: '' }),
      });
    }
    if (value.endDate) {
      items.push({
        key: 'end',
        label: `To: ${value.endDate}`,
        clear: () => onChange({ ...value, endDate: '' }),
      });
    }
    return items;
  }, [onChange, value]);

  return (
    <motion.div
      className="space-y-3 rounded-xl border border-border bg-card/60 p-4"
      variants={sectionReveal}
      initial={reduceMotion ? false : 'hidden'}
      animate="show"
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <div className="relative md:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={searchRef}
            className="pl-9 pr-20"
            placeholder="Search trip, source, destination… (Ctrl+K)"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            aria-label="Search trips"
          />
          {searchDraft ? (
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={() => {
                setSearchDraft('');
                onChange({ ...value, search: '' });
              }}
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline">
              ⌘K
            </kbd>
          )}
        </div>

        <Select
          value={value.status || 'ALL'}
          onValueChange={(status) => onChange({ ...value, status: status === 'ALL' ? '' : status })}
        >
          <SelectTrigger aria-label="Filter by status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {Object.values(TripStatus).map((status) => (
              <SelectItem key={status} value={status}>
                {TRIP_STATUS_LABEL[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="date"
          value={value.startDate}
          onChange={(e) => onChange({ ...value, startDate: e.target.value })}
          aria-label="Start date from"
        />
        <Input
          type="date"
          value={value.endDate}
          onChange={(e) => onChange({ ...value, endDate: e.target.value })}
          aria-label="End date to"
        />

        <Select
          value={`${value.sortBy}:${value.sortOrder}`}
          onValueChange={(raw) => {
            const [sortBy, sortOrder] = raw.split(':') as [string, 'asc' | 'desc'];
            onChange({ ...value, sortBy, sortOrder });
          }}
        >
          <SelectTrigger aria-label="Sort trips">
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
        <Button variant="outline" size="sm" onClick={onReset}>
          Reset filters
        </Button>
      </div>
    </motion.div>
  );
}
