'use client';

import type { BiInsight, BiLeaderboardRow } from '@transitops/shared-types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/utils/cn';

export function InsightCard({ insights }: { insights: BiInsight[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Business Insights</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight) => (
          <div
            key={insight.id}
            className={cn(
              'rounded-lg border px-3 py-2',
              insight.severity === 'critical' && 'border-destructive/40 bg-destructive/5',
              insight.severity === 'warning' && 'border-amber-500/40 bg-amber-500/5',
              insight.severity === 'positive' && 'border-emerald-500/40 bg-emerald-500/5',
              insight.severity === 'info' && 'border-border bg-muted/30',
            )}
          >
            <p className="text-sm font-medium">{insight.title}</p>
            <p className="text-xs text-muted-foreground">{insight.detail}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function LeaderboardCard({
  title,
  rows,
}: {
  title: string;
  rows?: BiLeaderboardRow[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {(rows ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No ranking data.</p>
        ) : (
          rows?.map((row, index) => (
            <div
              key={row.id}
              className="flex items-center justify-between gap-3 rounded-md border border-border/60 px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium">
                  {index + 1}. {row.label}
                </p>
                {row.subtitle ? (
                  <p className="text-xs text-muted-foreground">{row.subtitle}</p>
                ) : null}
              </div>
              <p className="text-sm font-semibold tabular-nums">
                {Number(row.value).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
