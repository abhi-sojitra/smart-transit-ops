'use client';

import { CheckCircle2, Circle, XCircle } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { TripStatus, type TripRecord } from '@/types/trip';
import { formatTripDate } from '@/components/trips/trip-display';
import { cn } from '@/utils/cn';

const STEPS = [
  { key: TripStatus.DRAFT, label: 'Draft' },
  { key: TripStatus.DISPATCHED, label: 'Dispatched' },
  { key: TripStatus.IN_PROGRESS, label: 'Started' },
  { key: TripStatus.COMPLETED, label: 'Completed' },
];

export function TripTimeline({ trip }: { trip: TripRecord }) {
  const reduceMotion = useReducedMotion();
  const cancelled = trip.status === TripStatus.CANCELLED;
  const order = [
    TripStatus.DRAFT,
    TripStatus.DISPATCHED,
    TripStatus.IN_PROGRESS,
    TripStatus.COMPLETED,
  ];
  const currentIndex = order.indexOf(trip.status as TripStatus);

  return (
    <ol className="space-y-4" aria-label="Trip status timeline">
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
          <motion.li
            key={step.key}
            className="flex gap-3"
            initial={reduceMotion ? false : { opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <div className="flex flex-col items-center">
              {reached ? (
                <CheckCircle2
                  className={cn('h-5 w-5', isCurrent ? 'text-primary' : 'text-emerald-500')}
                  aria-hidden
                />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground" aria-hidden />
              )}
              {index < STEPS.length - 1 ? <div className="mt-1 h-8 w-px bg-border" /> : null}
            </div>
            <div>
              <p className={cn('text-sm font-medium', reached ? 'text-foreground' : 'text-muted-foreground')}>
                {step.label}
                {isCurrent ? <span className="sr-only"> (current)</span> : null}
              </p>
              <p className="text-xs text-muted-foreground">
                {timestamp ? formatTripDate(timestamp) : 'Pending'}
              </p>
            </div>
          </motion.li>
        );
      })}
      {cancelled ? (
        <li className="flex gap-3">
          <XCircle className="h-5 w-5 text-red-500" aria-hidden />
          <div>
            <p className="text-sm font-medium text-red-500">Cancelled</p>
            <p className="text-xs text-muted-foreground">{formatTripDate(trip.updatedAt)}</p>
          </div>
        </li>
      ) : null}
    </ol>
  );
}
