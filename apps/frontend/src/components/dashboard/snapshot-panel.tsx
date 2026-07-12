'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/utils/cn';

export type SnapshotMetric = {
  label: string;
  value: string;
  emphasize?: boolean;
  tone?: 'default' | 'warning' | 'danger' | 'success';
};

interface SnapshotPanelProps {
  title: string;
  icon: LucideIcon;
  href?: string;
  metrics: SnapshotMetric[];
  loading?: boolean;
  className?: string;
}

const toneClass: Record<NonNullable<SnapshotMetric['tone']>, string> = {
  default: 'text-foreground',
  warning: 'text-amber-700 dark:text-amber-400',
  danger: 'text-red-600 dark:text-red-400',
  success: 'text-emerald-700 dark:text-emerald-400',
};

export function SnapshotPanel({
  title,
  icon: Icon,
  href,
  metrics,
  loading,
  className,
}: SnapshotPanelProps) {
  return (
    <Card className={cn('h-full', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted">
            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          </span>
          {title}
        </CardTitle>
        {href ? (
          <Link
            href={href}
            className="text-xs font-medium text-primary hover:underline"
          >
            View
          </Link>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-0 divide-y divide-border pt-0">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-2.5">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-12" />
              </div>
            ))
          : metrics.map((metric) => (
              <div
                key={metric.label}
                className="flex items-center justify-between gap-3 py-2.5"
              >
                <span className="text-xs text-muted-foreground">{metric.label}</span>
                <span
                  className={cn(
                    'tabular-nums',
                    metric.emphasize ? 'text-base font-bold' : 'text-sm font-semibold',
                    toneClass[metric.tone ?? 'default'],
                  )}
                >
                  {metric.value}
                </span>
              </div>
            ))}
      </CardContent>
    </Card>
  );
}
