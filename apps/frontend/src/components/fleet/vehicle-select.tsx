'use client';

import * as React from 'react';
import { Check, ChevronDown, Loader2, Search, Truck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useFleetInfiniteQuery } from '@/hooks/use-fleet';
import { useAvailableVehicles } from '@/hooks/use-trips';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { cn } from '@/utils/cn';
import type { Vehicle } from '@/types/fleet';

export type VehicleSelectValueKey = 'vehicleId' | 'id';
export type VehicleSelectSource = 'fleet' | 'available';

export interface VehicleSelectOption {
  id: string;
  vehicleId: string;
  make?: string;
  model?: string;
  mileage?: number;
  maxCapacity?: number;
  status?: string;
}

export interface VehicleSelectProps {
  id?: string;
  value?: string;
  onChange: (value: string) => void;
  onVehicleSelect?: (vehicle: VehicleSelectOption | null) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  allowAll?: boolean;
  allLabel?: string;
  /** Which field to use as the select value. Default: business vehicleId (VH-1001). */
  valueKey?: VehicleSelectValueKey;
  /** Fleet list (paginated) or trip dispatch available vehicles. */
  source?: VehicleSelectSource;
  'aria-invalid'?: boolean;
}

function vehicleLabel(vehicle: VehicleSelectOption, showCapacity = false) {
  const name = [vehicle.make, vehicle.model].filter(Boolean).join(' ').trim();
  const base = name ? `${vehicle.vehicleId} · ${name}` : vehicle.vehicleId;
  if (showCapacity && vehicle.maxCapacity != null) {
    return `${base} · cap ${vehicle.maxCapacity}`;
  }
  return base;
}

function getOptionValue(vehicle: VehicleSelectOption, valueKey: VehicleSelectValueKey) {
  return valueKey === 'id' ? vehicle.id : vehicle.vehicleId;
}

function toFleetOption(vehicle: Vehicle): VehicleSelectOption {
  return {
    id: vehicle.id,
    vehicleId: vehicle.vehicleId,
    make: vehicle.make,
    model: vehicle.model,
    mileage: vehicle.mileage,
    status: vehicle.status,
  };
}

/** Searchable vehicle dropdown with infinite scroll (fleet) or available-only list (trips). */
export function VehicleSelect({
  id,
  value,
  onChange,
  onVehicleSelect,
  disabled,
  placeholder = 'Select vehicle',
  className,
  allowAll = false,
  allLabel = 'All vehicles',
  valueKey = 'vehicleId',
  source = 'fleet',
  'aria-invalid': ariaInvalid,
}: VehicleSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const listRef = React.useRef<HTMLDivElement>(null);
  const sentinelRef = React.useRef<HTMLDivElement>(null);
  const [selectedLabel, setSelectedLabel] = React.useState<string | null>(null);

  const fleetQuery = useFleetInfiniteQuery(debouncedSearch, open && source === 'fleet');
  const availableQuery = useAvailableVehicles();

  const fleetVehicles = React.useMemo(
    () => fleetQuery.data?.pages.flatMap((page) => page.items.map(toFleetOption)) ?? [],
    [fleetQuery.data],
  );

  const availableVehicles = React.useMemo(() => {
    const list = availableQuery.data ?? [];
    const q = debouncedSearch.trim().toLowerCase();
    const mapped = list.map((vehicle) => ({
      id: String(vehicle._id),
      vehicleId: vehicle.vehicleId,
      make: vehicle.make,
      model: vehicle.model,
      maxCapacity: vehicle.maxCapacity,
      status: vehicle.status,
    }));
    if (!q) return mapped;
    return mapped.filter(
      (vehicle) =>
        vehicle.vehicleId.toLowerCase().includes(q) ||
        vehicle.model.toLowerCase().includes(q) ||
        vehicle.make?.toLowerCase().includes(q),
    );
  }, [availableQuery.data, debouncedSearch]);

  const vehicles = source === 'available' ? availableVehicles : fleetVehicles;
  const isLoading = source === 'available' ? availableQuery.isLoading : fleetQuery.isLoading;
  const isError = source === 'available' ? availableQuery.isError : fleetQuery.isError;
  const hasNextPage = source === 'fleet' ? fleetQuery.hasNextPage : false;
  const isFetchingNextPage = source === 'fleet' ? fleetQuery.isFetchingNextPage : false;
  const fetchNextPage = fleetQuery.fetchNextPage;

  const selectedVehicle = vehicles.find((v) => getOptionValue(v, valueKey) === value);
  const displayLabel =
    allowAll && !value
      ? allLabel
      : selectedVehicle
        ? vehicleLabel(selectedVehicle, source === 'available')
        : selectedLabel ?? value;

  const handleSelect = (nextValue: string, vehicle: VehicleSelectOption | null) => {
    onChange(nextValue);
    onVehicleSelect?.(vehicle);
    setSelectedLabel(vehicle ? vehicleLabel(vehicle, source === 'available') : null);
    setOpen(false);
  };

  React.useEffect(() => {
    if (!open || source !== 'fleet') return;
    const root = listRef.current;
    const sentinel = sentinelRef.current;
    if (!root || !sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { root, rootMargin: '48px', threshold: 0.1 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [open, source, hasNextPage, isFetchingNextPage, fetchNextPage, vehicles.length]);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setSearch('');
      }}
    >
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          disabled={disabled}
          aria-invalid={ariaInvalid}
          className={cn(
            'flex h-10 w-full cursor-pointer items-center gap-2.5 rounded-lg border border-input bg-card px-3 py-2 text-left text-sm shadow-sm transition-colors',
            'hover:border-primary/40 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            'disabled:cursor-not-allowed disabled:opacity-50',
            !displayLabel && 'text-muted-foreground',
            ariaInvalid && 'border-destructive ring-1 ring-destructive/20',
            className,
          )}
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary ring-1 ring-primary/20">
            <Truck className="h-3.5 w-3.5" strokeWidth={2.25} />
          </span>
          <span className="min-w-0 flex-1 truncate font-medium">
            {displayLabel || placeholder}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>

      <PopoverContent className="z-[100] w-[var(--radix-popover-trigger-width)] overflow-hidden p-0 shadow-lg" align="start">
        <div className="border-b border-border bg-muted/30 p-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search vehicle ID, make, model..."
              className="h-9 pl-8"
            />
          </div>
        </div>

        <div ref={listRef} className="max-h-64 overflow-y-auto p-1">
          {allowAll ? (
            <button
              type="button"
              className={cn(
                'flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-muted',
                !value && 'bg-muted font-medium',
              )}
              onClick={() => handleSelect('', null)}
            >
              <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                {!value ? <Check className="h-3.5 w-3.5 text-primary" /> : null}
              </span>
              {allLabel}
            </button>
          ) : null}

          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading vehicles…
            </div>
          ) : isError ? (
            <p className="px-2 py-6 text-center text-sm text-destructive">Failed to load vehicles</p>
          ) : vehicles.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">No vehicles found</p>
          ) : (
            vehicles.map((vehicle) => {
              const optionValue = getOptionValue(vehicle, valueKey);
              const selected = optionValue === value;
              const isRetired = vehicle.status === 'RETIRED';
              return (
                <button
                  key={vehicle.id}
                  type="button"
                  disabled={isRetired}
                  className={cn(
                    'flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-muted',
                    selected && 'bg-muted font-medium',
                    isRetired && 'cursor-not-allowed opacity-50',
                  )}
                  onClick={() => handleSelect(optionValue, vehicle)}
                >
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                    {selected ? <Check className="h-3.5 w-3.5 text-primary" /> : null}
                  </span>
                  <span className="truncate">{vehicleLabel(vehicle, source === 'available')}</span>
                </button>
              );
            })
          )}

          {source === 'fleet' ? <div ref={sentinelRef} className="h-1" /> : null}

          {isFetchingNextPage ? (
            <div className="flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading more…
            </div>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
