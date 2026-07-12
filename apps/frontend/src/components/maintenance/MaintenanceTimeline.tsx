'use client';

import { CheckCircle2, Circle, CircleDot } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { MaintenanceTimelineEvent } from '@/types/maintenance';

interface MaintenanceTimelineProps {
  events: MaintenanceTimelineEvent[];
  className?: string;
}

function formatTs(value?: string) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

export function MaintenanceTimeline({ events, className }: MaintenanceTimelineProps) {
  return (
    <ol className={cn('space-y-0', className)}>
      {events.map((event, index) => {
        const isLast = index === events.length - 1;
        const Icon = event.completed
          ? CheckCircle2
          : index === events.findIndex((e) => !e.completed)
            ? CircleDot
            : Circle;

        return (
          <li key={event.status} className="relative flex gap-3 pb-6 last:pb-0">
            {!isLast ? (
              <span
                className={cn(
                  'absolute left-[11px] top-6 h-[calc(100%-12px)] w-px',
                  event.completed ? 'bg-primary/60' : 'bg-border',
                )}
              />
            ) : null}
            <Icon
              className={cn(
                'relative z-10 mt-0.5 h-6 w-6 shrink-0',
                event.completed ? 'text-primary' : 'text-muted-foreground',
              )}
            />
            <div>
              <p className="text-sm font-medium">{event.label}</p>
              <p className="text-xs text-muted-foreground">{formatTs(event.timestamp)}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
