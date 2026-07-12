'use client';

import { Ban, CalendarClock, CheckCircle2, Loader2, type LucideIcon } from 'lucide-react';
import { MaintenanceStatus } from '@transitops/shared-types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/cn';

const labels: Record<string, string> = {
  SCHEDULED: 'Scheduled',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const ICONS: Record<string, LucideIcon> = {
  [MaintenanceStatus.SCHEDULED]: CalendarClock,
  [MaintenanceStatus.IN_PROGRESS]: Loader2,
  [MaintenanceStatus.COMPLETED]: CheckCircle2,
  [MaintenanceStatus.CANCELLED]: Ban,
};

interface MaintenanceStatusBadgeProps {
  status: MaintenanceStatus | string;
  className?: string;
}

export function MaintenanceStatusBadge({ status, className }: MaintenanceStatusBadgeProps) {
  const Icon = ICONS[status];
  return (
    <Badge status={status} className={cn('gap-1', className)}>
      {Icon ? (
        <Icon
          className={cn(
            'h-3 w-3',
            status === MaintenanceStatus.IN_PROGRESS && 'animate-spin',
          )}
          aria-hidden
        />
      ) : null}
      <span>{labels[status] ?? (status ? status.replaceAll('_', ' ') : 'Unknown')}</span>
    </Badge>
  );
}
