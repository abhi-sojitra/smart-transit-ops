'use client';

import { Badge } from '@/components/ui/badge';
import { TripStatus } from '@/types/trip';

const LABELS: Record<string, string> = {
  [TripStatus.DRAFT]: 'Draft',
  [TripStatus.DISPATCHED]: 'Dispatched',
  [TripStatus.IN_PROGRESS]: 'In Progress',
  [TripStatus.COMPLETED]: 'Completed',
  [TripStatus.CANCELLED]: 'Cancelled',
};

export function TripStatusBadge({ status }: { status: string }) {
  return <Badge status={status}>{LABELS[status] ?? status.replaceAll('_', ' ')}</Badge>;
}
