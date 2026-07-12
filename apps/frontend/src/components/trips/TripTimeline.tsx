'use client';

import { CheckCircle2, Circle, XCircle } from 'lucide-react';
import { TripStatus, type TripRecord } from '@/types/trip';
import { cn } from '@/utils/cn';

const STEPS = [
  { key: TripStatus.DRAFT, label: 'Draft', dateKey: 'createdAt' as const },
  { key: TripStatus.DISPATCHED, label: 'Dispatched', dateKey: 'updatedAt' as const },
  { key: TripStatus.IN_PROGRESS, label: 'Started', dateKey: 'actualStartDate' as const },
  { key: TripStatus.COMPLETED, label: 'Completed', dateKey: 'actualEndDate' as const },
];

function formatDate(value?: string) {
  if (!value) return null;
  return new Date(value).toLocaleString();
}

export function TripTimeline({ trip }: { trip: TripRecord }) {
  const cancelled = trip.status === TripStatus.CANCELLED;
  const order = [
    TripStatus.DRAFT,
    TripStatus.DISPATCHED,
    TripStatus.IN_PROGRESS,
    TripStatus.COMPLETED,
  ];
  const currentIndex = order.indexOf(trip.status as TripStatus);

  return (
    <ol className="space-y-4">
      {STEPS.map((step, index) => {
        const reached = !cancelled && currentIndex >= index;
        const isCurrent = !cancelled && trip.status === step.key;
        const timestamp =
          step.key === TripStatus.DRAFT
            ? trip.createdAt
            : step.key === TripStatus.IN_PROGRESS
              ? trip.actualStartDate
              : step.key === TripStatus.COMPLETED
                ? trip.actualEndDate
                : reached
                  ? trip.updatedAt
                  : undefined;

        return (
          <li key={step.key} className="flex gap-3">
            <div className="flex flex-col items-center">
              {reached ? (
                <CheckCircle2 className={cn('h-5 w-5', isCurrent ? 'text-primary' : 'text-emerald-500')} />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground" />
              )}
              {index < STEPS.length - 1 ? <div className="mt-1 h-8 w-px bg-border" /> : null}
            </div>
            <div>
              <p className={cn('text-sm font-medium', reached ? 'text-foreground' : 'text-muted-foreground')}>
                {step.label}
              </p>
              <p className="text-xs text-muted-foreground">{formatDate(timestamp) ?? 'Pending'}</p>
            </div>
          </li>
        );
      })}
      {cancelled ? (
        <li className="flex gap-3">
          <XCircle className="h-5 w-5 text-red-500" />
          <div>
            <p className="text-sm font-medium text-red-500">Cancelled</p>
            <p className="text-xs text-muted-foreground">{formatDate(trip.updatedAt)}</p>
          </div>
        </li>
      ) : null}
    </ol>
  );
}
