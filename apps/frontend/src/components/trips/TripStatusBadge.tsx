'use client';

import {
  Ban,
  CheckCircle2,
  CircleDashed,
  Loader2,
  Send,
  type LucideIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { TripStatus } from '@/types/trip';
import { TRIP_STATUS_LABEL } from '@/components/trips/trip-display';
import { cn } from '@/utils/cn';

const ICONS: Record<string, LucideIcon> = {
  [TripStatus.DRAFT]: CircleDashed,
  [TripStatus.DISPATCHED]: Send,
  [TripStatus.IN_PROGRESS]: Loader2,
  [TripStatus.COMPLETED]: CheckCircle2,
  [TripStatus.CANCELLED]: Ban,
};

export function TripStatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const Icon = ICONS[status];
  return (
    <Badge status={status} className={cn('gap-1', className)}>
      {Icon ? (
        <Icon
          className={cn('h-3 w-3', status === TripStatus.IN_PROGRESS && 'animate-spin')}
          aria-hidden
        />
      ) : null}
      <span>{TRIP_STATUS_LABEL[status] ?? status.replaceAll('_', ' ')}</span>
    </Badge>
  );
}
