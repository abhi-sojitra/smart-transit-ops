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
    icon: 'bg-primary text-primary-foreground',
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
  size?: 'default' | 'compact';
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
  const valueText = String(value);

  if (loading) {
    return (
      <Card className={cn('min-w-0 overflow-hidden bg-card', className)}>
        <CardContent className={cn(compact ? 'space-y-2 p-3' : 'space-y-3 p-5')}>
          <Skeleton className={cn('rounded-xl', compact ? 'h-8 w-8' : 'h-10 w-10')} />
          <Skeleton className={cn(compact ? 'h-3 w-20' : 'h-4 w-28')} />
          <Skeleton className={cn(compact ? 'h-6 w-14' : 'h-8 w-16')} />
        </CardContent>
      </Card>
    );
  }

  const positive = growth !== undefined && growth >= 0;

  return (
    <motion.div
      className="min-w-0"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      whileHover={compact ? undefined : { y: -2 }}
    >
      <Card
        className={cn(
          'min-w-0 overflow-hidden border border-border bg-card shadow-sm transition-shadow',
          !compact && 'hover:shadow-md',
          className,
        )}
      >
        {!compact ? <div className={cn('h-1.5 w-full', styles.bar)} /> : null}
        <CardContent className={cn(compact ? 'p-3' : 'p-5')}>
          <div
            className={cn(
              'flex items-center justify-between gap-3',
              compact ? 'mb-2' : 'mb-4',
            )}
          >
            <div
              className={cn(
                'flex shrink-0 items-center justify-center rounded-xl shadow-sm',
                compact ? 'h-8 w-8' : 'h-10 w-10',
                styles.icon,
              )}
            >
              <Icon className={cn(compact ? 'h-4 w-4' : 'h-5 w-5')} strokeWidth={2.25} />
            </div>
            {hint ? (
              <span
                className={cn(
                  'rounded-md px-2 py-1 text-[11px] font-semibold leading-none',
                  styles.chip,
                )}
              >
                {hint}
              </span>
            ) : null}
          </div>

          <p
            className={cn(
              'font-semibold text-foreground',
              compact ? 'text-xs text-muted-foreground' : 'text-sm',
            )}
          >
            {title}
          </p>
          <div className="mt-1 flex min-w-0 items-end justify-between gap-2">
            <p
              className={cn(
                'min-w-0 truncate font-bold tracking-tight text-foreground tabular-nums',
                compact ? 'text-lg' : 'text-3xl',
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
