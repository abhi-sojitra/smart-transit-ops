'use client';

import type { DashboardActivityItem } from '@transitops/shared-types';
import { Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/feedback/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { formatRelativeTime } from './format';

interface ActivityTimelineProps {
  items?: DashboardActivityItem[];
  loading?: boolean;
  error?: boolean;
}

export function ActivityTimeline({ items, loading, error }: ActivityTimelineProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4 text-primary" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))
        ) : error ? (
          <EmptyState title="Activity unavailable" description="Could not load the timeline." />
        ) : !items?.length ? (
          <EmptyState title="No recent activity" description="Events will appear as ops run." />
        ) : (
          items.map((item) => (
            <div
              key={`${item.type}-${item.id}`}
              className="flex items-start justify-between gap-3 rounded-lg border border-border bg-muted/20 px-3 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{item.title}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {item.description}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {formatRelativeTime(item.occurredAt)}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <Badge className="border-border bg-background text-[10px]">{item.type}</Badge>
                {item.status ? (
                  <Badge status={item.status} className="text-[10px]">
                    {item.status.replaceAll('_', ' ')}
                  </Badge>
                ) : null}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
