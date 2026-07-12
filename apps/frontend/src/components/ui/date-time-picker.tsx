'use client';

import * as React from 'react';
import { setHours, setMinutes, startOfDay } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePickerTrigger } from '@/components/ui/date-picker';
import {
  buildDisabledDates,
  formatDisplayDateTime,
  isTodaySelectable,
  parseDateInput,
  parseDateTimeInput,
  toDateInput,
  toDateTimeLocalInput,
  type DateConstraintOptions,
} from '@/utils/date';

export interface DateTimePickerProps extends DateConstraintOptions {
  id?: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  clearable?: boolean;
  minDateTime?: string;
  'aria-invalid'?: boolean;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

function clampToMinDateTime(next: Date, minDateTime?: string): Date {
  const min = parseDateTimeInput(minDateTime);
  if (!min || next.getTime() >= min.getTime()) return next;
  return min;
}

/** Date + time picker with calendar popover. Value is YYYY-MM-DDTHH:mm (datetime-local). */
export function DateTimePicker({
  id,
  value,
  onChange,
  placeholder = 'Pick date & time',
  disabled,
  className,
  clearable = true,
  disablePast,
  disableFuture,
  requireFuture,
  minDate,
  maxDate,
  minDateTime,
  'aria-invalid': ariaInvalid,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const selected = parseDateTimeInput(value);
  const minFromDateTime = parseDateTimeInput(minDateTime);
  const effectiveMinDate =
    minDate ?? (minFromDateTime ? toDateInput(minFromDateTime) : undefined);
  const constraints = {
    disablePast,
    disableFuture,
    requireFuture,
    minDate: effectiveMinDate,
    maxDate,
  };
  const disabledDays = buildDisabledDates(constraints);
  const showToday = isTodaySelectable(constraints);

  const hour = selected?.getHours() ?? 9;
  const minute = selected?.getMinutes() ?? 0;

  const emit = (date: Date) => {
    const clamped = clampToMinDateTime(date, minDateTime);
    onChange?.(toDateTimeLocalInput(clamped));
  };

  const updateTime = (nextHour: number, nextMinute: number) => {
    const base = selected ?? startOfDay(new Date());
    emit(setMinutes(setHours(base, nextHour), nextMinute));
  };

  const selectToday = () => {
    const now = new Date();
    emit(clampToMinDateTime(now, minDateTime));
    setOpen(false);
  };

  const minHour =
    selected && minFromDateTime && toDateInput(selected) === toDateInput(minFromDateTime)
      ? minFromDateTime.getHours()
      : 0;
  const minMinute =
    selected &&
    minFromDateTime &&
    toDateInput(selected) === toDateInput(minFromDateTime) &&
    hour === minFromDateTime.getHours()
      ? minFromDateTime.getMinutes()
      : 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <DatePickerTrigger
          id={id}
          value={value}
          displayValue={value ? formatDisplayDateTime(value) : undefined}
          placeholder={placeholder}
          disabled={disabled}
          className={className}
          ariaInvalid={ariaInvalid}
          clearable={clearable}
          onClear={() => onChange?.('')}
        />
      </PopoverTrigger>
      <PopoverContent className="z-[100] w-auto overflow-hidden p-0 shadow-lg" align="start">
        <div className="border-b border-border bg-muted/30 px-4 py-3">
          <p className="text-sm font-semibold text-foreground">Select date & time</p>
          <p className="text-xs text-muted-foreground">
            {value ? formatDisplayDateTime(value) : 'Choose when this should happen'}
          </p>
        </div>
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected ?? parseDateInput(effectiveMinDate) ?? parseDateInput(maxDate)}
          disabled={disabledDays}
          onSelect={(date) => {
            if (!date) return;
            const next = setMinutes(setHours(date, hour), minute);
            emit(next);
          }}
        />
        <div className="space-y-3 border-t border-border bg-muted/20 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Time</p>
          <div className="flex gap-2">
            <Select
              value={String(hour)}
              onValueChange={(v) => updateTime(Number(v), minute)}
              disabled={!selected}
            >
              <SelectTrigger className="h-9 flex-1" aria-label="Hour">
                <SelectValue placeholder="Hour" />
              </SelectTrigger>
              <SelectContent>
                {HOURS.filter((h) => h >= minHour).map((h) => (
                  <SelectItem key={h} value={String(h)}>
                    {String(h).padStart(2, '0')}:00
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={String(minute)}
              onValueChange={(v) => updateTime(hour, Number(v))}
              disabled={!selected}
            >
              <SelectTrigger className="h-9 flex-1" aria-label="Minute">
                <SelectValue placeholder="Min" />
              </SelectTrigger>
              <SelectContent>
                {MINUTES.filter((m) => m >= minMinute).map((m) => (
                  <SelectItem key={m} value={String(m)}>
                    :{String(m).padStart(2, '0')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-border bg-muted/20 px-3 py-2.5">
          {showToday ? (
            <Button type="button" variant="ghost" size="sm" onClick={selectToday}>
              Now
            </Button>
          ) : (
            <span />
          )}
          {clearable ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => {
                onChange?.('');
                setOpen(false);
              }}
            >
              Clear
            </Button>
          ) : null}
          <Button type="button" size="sm" onClick={() => setOpen(false)} disabled={!value}>
            Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
