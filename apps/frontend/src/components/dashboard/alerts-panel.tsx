'use client';

import { AlertTriangle, Info, Siren } from 'lucide-react';
import type { DashboardAlert } from '@transitops/shared-types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/feedback/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateTime } from './format';
import { cn } from '@/utils/cn';

const severityStyles = {
  CRITICAL: 'border-red-500/30 bg-red-500/5',
  WARNING: 'border-amber-500/30 bg-amber-500/5',
  INFORMATION: 'border-sky-500/30 bg-sky-500/5',
} as const;

const severityIcon = {
  CRITICAL: Siren,
  WARNING: AlertTriangle,
  INFORMATION: Info,
} as const;

interface AlertsPanelProps {
  alerts?: DashboardAlert[];
  loading?: boolean;
  error?: boolean;
}

export function AlertsPanel({ alerts, loading, error }: AlertsPanelProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Alerts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))
        ) : error ? (
          <EmptyState title="Unable to load alerts" description="Try refreshing the page." />
        ) : !alerts?.length ? (
          <EmptyState title="All clear" description="No operational alerts right now." />
        ) : (
          alerts.slice(0, 8).map((alert) => {
            const Icon = severityIcon[alert.severity];
            return (
              <div
                key={alert.id}
                className={cn(
                  'rounded-lg border px-3 py-3',
                  severityStyles[alert.severity],
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{alert.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{alert.message}</p>
                      {alert.dueDate ? (
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {formatDateTime(alert.dueDate)}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <Badge className="shrink-0 border-border bg-background text-[10px]">
                    {alert.severity}
                  </Badge>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
