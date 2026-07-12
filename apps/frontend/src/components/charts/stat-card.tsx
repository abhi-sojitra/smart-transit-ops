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
  className,
  tone = 'neutral',
  hint,
}: StatCardProps) {
  const styles = toneStyles[tone];

  if (loading) {
    return (
      <Card className={cn('overflow-hidden bg-card', className)}>
        <CardContent className="space-y-3 p-5">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-8 w-16" />
        </CardContent>
      </Card>
    );
  }

  const positive = growth !== undefined && growth >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      whileHover={{ y: -2 }}
    >
      <Card
        className={cn(
          'overflow-hidden border border-border bg-card shadow-sm transition-shadow hover:shadow-md',
          className,
        )}
      >
        <div className={cn('h-1.5 w-full', styles.bar)} />
        <CardContent className="p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-xl shadow-sm',
                styles.icon,
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={2.25} />
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

          <p className="text-sm font-semibold text-foreground">{title}</p>
          <div className="mt-1 flex items-end justify-between gap-2">
            <p className="text-3xl font-bold tracking-tight text-foreground tabular-nums">
              {value}
            </p>
            {growth !== undefined ? (
              <span
                className={cn(
                  'mb-1 inline-flex items-center gap-1 text-xs font-semibold',
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
