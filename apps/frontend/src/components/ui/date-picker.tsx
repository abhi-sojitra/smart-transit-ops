'use client';

import * as React from 'react';
import { CalendarIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/utils/cn';
import {
  buildDisabledDates,
  formatDisplayDate,
  isTodaySelectable,
  parseDateInput,
  toDateInput,
  type DateConstraintOptions,
} from '@/utils/date';

export interface DatePickerProps extends DateConstraintOptions {
  id?: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  clearable?: boolean;
  'aria-invalid'?: boolean;
}

type DatePickerTriggerProps = Omit<React.ComponentProps<'button'>, 'children' | 'value'> & {
  value?: string;
  displayValue?: string;
  placeholder: string;
  ariaInvalid?: boolean;
  onClear?: () => void;
  clearable?: boolean;
};

/** Must forward ref — required for Radix PopoverTrigger asChild. */
export const DatePickerTrigger = React.forwardRef<HTMLButtonElement, DatePickerTriggerProps>(
  (
    {
      id,
      value,
      displayValue,
      placeholder,
      disabled,
      className,
      ariaInvalid,
      onClear,
      clearable,
      type = 'button',
      ...props
    },
    ref,
  ) => {
    const label = displayValue ?? (value ? formatDisplayDate(value) : placeholder);
    const hasValue = Boolean(displayValue ?? value);

    return (
      <button
        ref={ref}
        id={id}
        type={type}
        disabled={disabled}
        aria-invalid={ariaInvalid}
        {...props}
        className={cn(
          'flex h-10 w-full cursor-pointer items-center gap-2.5 rounded-lg border border-input bg-card px-3 py-2 text-left text-sm shadow-sm transition-colors',
          'hover:border-primary/40 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'disabled:cursor-not-allowed disabled:opacity-50',
          !hasValue && 'text-muted-foreground',
          ariaInvalid && 'border-destructive ring-1 ring-destructive/20',
          className,
        )}
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary ring-1 ring-primary/20">
          <CalendarIcon className="h-3.5 w-3.5" strokeWidth={2.25} />
        </span>
        <span className="min-w-0 flex-1 truncate font-medium">{label}</span>
        {clearable && hasValue ? (
          <span
            role="presentation"
            className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            onPointerDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onClear?.();
            }}
          >
            <X className="h-3.5 w-3.5" />
          </span>
        ) : null}
      </button>
    );
  },
);
DatePickerTrigger.displayName = 'DatePickerTrigger';

/** Single-date picker with calendar popover. Value is YYYY-MM-DD. */
export function DatePicker({
  id,
  value,
  onChange,
  placeholder = 'Pick a date',
  disabled,
  className,
  clearable = true,
  disablePast,
  disableFuture,
  requireFuture,
  minDate,
  maxDate,
  'aria-invalid': ariaInvalid,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const selected = parseDateInput(value);
  const constraints = { disablePast, disableFuture, requireFuture, minDate, maxDate };
  const disabledDays = buildDisabledDates(constraints);
  const showToday = isTodaySelectable(constraints);

  const selectToday = () => {
    onChange?.(toDateInput(new Date()));
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <DatePickerTrigger
          id={id}
          value={value}
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
          <p className="text-sm font-semibold text-foreground">Select date</p>
          <p className="text-xs text-muted-foreground">
            {value ? formatDisplayDate(value) : 'Choose a date from the calendar'}
          </p>
        </div>
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected ?? parseDateInput(minDate) ?? parseDateInput(maxDate)}
          disabled={disabledDays}
          onSelect={(date) => {
            onChange?.(date ? toDateInput(date) : '');
            setOpen(false);
          }}
        />
        <div className="flex items-center justify-between gap-2 border-t border-border bg-muted/20 px-3 py-2.5">
          {showToday ? (
            <Button type="button" variant="ghost" size="sm" onClick={selectToday}>
              Today
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
        </div>
      </PopoverContent>
    </Popover>
  );
}
