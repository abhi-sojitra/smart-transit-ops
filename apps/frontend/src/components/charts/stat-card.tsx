'use client';

import { type LucideIcon, TrendingDown, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/utils/cn';

export type StatCardTone = 'neutral' | 'success' | 'info' | 'warning' | 'danger' | 'primary';

/** Light-mode-first: white cards, dark readable text, color only on accents. */
const toneStyles: Record<
  StatCardTone,
  { bar: string; icon: string; chip: string }
> = {
  neutral: {
    bar: 'bg-slate-300 dark:bg-slate-600',
    icon: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
    chip: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  },
  primary: {
    bar: 'bg-primary',
    icon: 'bg-primary/15 text-primary ring-1 ring-primary/20',
    chip: 'bg-primary/15 text-primary',
  },
  success: {
    bar: 'bg-emerald-500',
    icon: 'bg-emerald-500 text-white',
    chip: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-800',
  },
  info: {
    bar: 'bg-sky-500',
    icon: 'bg-sky-500 text-white',
    chip: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:ring-sky-800',
  },
  warning: {
    bar: 'bg-amber-500',
    icon: 'bg-amber-500 text-white',
    chip: 'bg-amber-50 text-amber-800 ring-1 ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-800',
  },
  danger: {
    bar: 'bg-red-500',
    icon: 'bg-red-500 text-white',
    chip: 'bg-red-50 text-red-700 ring-1 ring-red-200 dark:bg-red-950 dark:text-red-300 dark:ring-red-800',
  },
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  growth?: number;
  loading?: boolean;
  size?: 'default' | 'dense' | 'compact';
  className?: string;
  tone?: StatCardTone;
  hint?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  growth,
  loading,
  size = 'default',
  className,
  tone = 'neutral',
  hint,
}: StatCardProps) {
  const styles = toneStyles[tone];
  const compact = size === 'compact';
  const dense = size === 'dense';
  const small = compact || dense;
  const valueText = String(value);

  const contentPadding = compact ? 'p-2.5' : dense ? 'p-4' : 'p-5';
  const headerMargin = compact ? 'mb-1.5' : dense ? 'mb-3' : 'mb-4';
  const iconSize = compact ? 'h-7 w-7' : dense ? 'h-9 w-9' : 'h-10 w-10';
  const iconGlyph = compact ? 'h-3.5 w-3.5' : dense ? 'h-4 w-4' : 'h-5 w-5';
  const titleClass = compact
    ? 'text-xs text-muted-foreground'
    : dense
      ? 'text-sm'
      : 'text-sm';
  const titleMinHeight = compact ? 'min-h-[1.75rem]' : dense ? 'min-h-[2.25rem]' : 'min-h-[2.5rem]';
  const valueClass = compact ? 'text-base' : dense ? 'text-2xl' : 'text-3xl';
  const topBarClass = compact ? 'h-0.5' : dense ? 'h-1' : 'h-1.5';
  const iconRadius = compact ? 'rounded-lg' : 'rounded-xl';
  const chipClass = compact
    ? 'shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold leading-none'
    : 'shrink-0 rounded-md px-2 py-1 text-[11px] font-semibold leading-none';
  const headerGap = compact ? 'gap-2' : 'gap-3';

  if (loading) {
    return (
      <Card className={cn('flex h-full min-w-0 flex-col overflow-hidden bg-card', className)}>
        <CardContent className={cn('flex flex-1 flex-col', compact ? 'space-y-1.5 p-2.5' : dense ? 'space-y-2.5 p-4' : 'space-y-3 p-5')}>
          <Skeleton className={cn('rounded-lg', iconSize)} />
          <Skeleton className={cn(compact ? 'h-3 w-16' : dense ? 'h-3.5 w-24' : 'h-4 w-28')} />
          <Skeleton className={cn(compact ? 'h-5 w-12' : dense ? 'h-7 w-16' : 'h-8 w-16')} />
        </CardContent>
      </Card>
    );
  }

  const positive = growth !== undefined && growth >= 0;

  return (
    <motion.div
      className="h-full min-w-0"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      whileHover={small ? undefined : { y: -2 }}
    >
      <Card
        className={cn(
          'flex h-full min-w-0 flex-col overflow-hidden border border-border bg-card shadow-sm transition-shadow',
          !small && 'hover:shadow-md',
          className,
        )}
      >
        <div className={cn(topBarClass, 'w-full shrink-0', styles.bar)} />
        <CardContent className={cn('flex flex-1 flex-col', contentPadding)}>
          <div
            className={cn(
              'flex items-center justify-between',
              headerGap,
              headerMargin,
            )}
          >
            <div
              className={cn(
                'flex shrink-0 items-center justify-center shadow-sm',
                iconRadius,
                iconSize,
                styles.icon,
              )}
            >
              <Icon className={cn(iconGlyph)} strokeWidth={2.25} />
            </div>
            {hint ? (
              <span className={cn(chipClass, styles.chip)}>
                {hint}
              </span>
            ) : null}
          </div>

          <p
            className={cn(
              titleMinHeight,
              'font-semibold leading-snug text-foreground',
              titleClass,
            )}
          >
            {title}
          </p>
          <div className="mt-auto flex min-w-0 items-end justify-between gap-2 pt-1">
            <p
              className={cn(
                'min-w-0 truncate font-bold tracking-tight text-foreground tabular-nums',
                valueClass,
              )}
              title={valueText}
            >
              {value}
            </p>
            {growth !== undefined ? (
              <span
                className={cn(
                  'inline-flex shrink-0 items-center gap-1 text-xs font-semibold',
                  compact ? 'font-medium' : 'mb-1',
                  positive
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400',
                )}
              >
                {positive ? (
                  <TrendingUp className="h-3.5 w-3.5" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5" />
                )}
                {Math.abs(growth)}%
              </span>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
