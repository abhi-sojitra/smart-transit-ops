'use client';

import * as React from 'react';
import { subDays, startOfMonth } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { DatePickerTrigger } from '@/components/ui/date-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/utils/cn';
import {
  buildDisabledDates,
  formatDateRangeLabel,
  parseDateInput,
  toDateInput,
  type DateConstraintOptions,
} from '@/utils/date';

export interface DateRangeValue {
  from?: string;
  to?: string;
}

export interface DateRangePickerProps extends DateConstraintOptions {
  id?: string;
  value?: DateRangeValue;
  onChange?: (value: DateRangeValue) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  numberOfMonths?: 1 | 2;
}

function toRange(value?: DateRangeValue): DateRange | undefined {
  if (!value?.from && !value?.to) return undefined;
  return {
    from: parseDateInput(value?.from),
    to: parseDateInput(value?.to),
  };
}

const PRESETS = [
  { label: 'Last 7 days', getRange: () => ({ from: subDays(new Date(), 6), to: new Date() }) },
  { label: 'Last 30 days', getRange: () => ({ from: subDays(new Date(), 29), to: new Date() }) },
  { label: 'This month', getRange: () => ({ from: startOfMonth(new Date()), to: new Date() }) },
] as const;

/** Range date picker for filters. Emits YYYY-MM-DD strings. */
export function DateRangePicker({
  id,
  value,
  onChange,
  placeholder = 'Date range',
  disabled,
  className,
  numberOfMonths = 2,
  disablePast,
  disableFuture,
  requireFuture,
  minDate,
  maxDate,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  const selected = toRange(value);
  const hasValue = Boolean(value?.from || value?.to);
  const disabledDays = buildDisabledDates({
    disablePast,
    disableFuture,
    requireFuture,
    minDate,
    maxDate,
  });

  const applyPreset = (range: DateRange) => {
    onChange?.({
      from: range.from ? toDateInput(range.from) : undefined,
      to: range.to ? toDateInput(range.to) : undefined,
    });
    if (range.from && range.to) setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <DatePickerTrigger
          id={id}
          displayValue={
            hasValue ? formatDateRangeLabel(value?.from, value?.to, placeholder) : undefined
          }
          placeholder={placeholder}
          disabled={disabled}
          className={className}
          clearable
          onClear={() => onChange?.({})}
        />
      </PopoverTrigger>
      <PopoverContent className="z-[100] w-auto overflow-hidden p-0 shadow-lg" align="start">
        <div className="border-b border-border bg-muted/30 px-4 py-3">
          <p className="text-sm font-semibold text-foreground">Select date range</p>
          <p className="text-xs text-muted-foreground">
            {formatDateRangeLabel(value?.from, value?.to, 'Pick a start and end date')}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row">
          <div className="flex flex-wrap gap-1.5 border-b border-border bg-card p-3 sm:w-36 sm:flex-col sm:border-b-0 sm:border-r">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                className={cn(
                  'rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-muted-foreground transition-colors',
                  'hover:bg-primary/10 hover:text-primary',
                )}
                onClick={() => applyPreset(preset.getRange())}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <Calendar
            mode="range"
            numberOfMonths={numberOfMonths}
            selected={selected}
            defaultMonth={selected?.from ?? selected?.to}
            disabled={disabledDays}
            onSelect={(range) => {
              onChange?.({
                from: range?.from ? toDateInput(range.from) : undefined,
                to: range?.to ? toDateInput(range.to) : undefined,
              });
              if (range?.from && range?.to) setOpen(false);
            }}
          />
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border bg-muted/20 px-3 py-2.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => {
              onChange?.({});
              setOpen(false);
            }}
          >
            Clear
          </Button>
          <Button type="button" size="sm" onClick={() => setOpen(false)}>
            Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
