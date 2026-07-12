'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/cn';
import type { MaintenanceStatus } from '@transitops/shared-types';

const labels: Record<string, string> = {
  SCHEDULED: 'Scheduled',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

interface MaintenanceStatusBadgeProps {
  status: MaintenanceStatus | string;
  className?: string;
}

export function MaintenanceStatusBadge({ status, className }: MaintenanceStatusBadgeProps) {
  return (
    <Badge status={status} className={cn(className)}>
      {labels[status] ?? (status ? status.replaceAll('_', ' ') : 'Unknown')}
    </Badge>
  );
}
