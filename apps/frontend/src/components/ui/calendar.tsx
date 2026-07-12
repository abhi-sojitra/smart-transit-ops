'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker, type DayPickerProps } from 'react-day-picker';
import { cn } from '@/utils/cn';

export type CalendarProps = DayPickerProps;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        months: 'flex flex-col gap-4 sm:flex-row sm:gap-6',
        month: 'space-y-4',
        month_caption: 'relative flex items-center justify-center pt-1',
        caption_label: 'text-sm font-semibold text-foreground',
        nav: 'flex items-center gap-1',
        button_previous: cn(
          'absolute left-0 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground',
        ),
        button_next: cn(
          'absolute right-0 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground',
        ),
        month_grid: 'w-full border-collapse',
        weekdays: 'flex',
        weekday:
          'w-10 rounded-md text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground',
        week: 'mt-2 flex w-full',
        day: 'relative h-10 w-10 p-0 text-center text-sm focus-within:relative focus-within:z-20',
        day_button: cn(
          'inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg p-0 font-medium transition-all',
          'hover:bg-primary/10 hover:text-primary aria-selected:opacity-100',
        ),
        range_start:
          'rounded-l-lg bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
        range_end:
          'rounded-r-lg bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
        selected:
          'rounded-lg bg-primary text-primary-foreground shadow-sm hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
        today: 'rounded-lg bg-accent font-semibold text-accent-foreground ring-1 ring-primary/30',
        outside: 'text-muted-foreground/40 aria-selected:text-muted-foreground/40',
        disabled: 'cursor-not-allowed text-muted-foreground/30 opacity-40',
        range_middle:
          'rounded-none bg-primary/12 text-foreground aria-selected:bg-primary/12 aria-selected:text-foreground',
        hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === 'left' ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          ),
      }}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };
