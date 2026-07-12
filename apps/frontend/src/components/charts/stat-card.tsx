'use client';

import { type LucideIcon, TrendingDown, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/utils/cn';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  growth?: number;
  loading?: boolean;
  className?: string;
}

export function StatCard({ title, value, icon: Icon, growth, loading, className }: StatCardProps) {
  if (loading) {
    return (
      <Card className={cn('overflow-hidden', className)}>
        <CardContent className="p-5">
          <Skeleton className="mb-3 h-9 w-9 rounded-lg" />
          <Skeleton className="mb-2 h-4 w-24" />
          <Skeleton className="h-8 w-16" />
        </CardContent>
      </Card>
    );
  }

  const positive = growth !== undefined && growth >= 0;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <Card className={cn('overflow-hidden', className)}>
        <CardContent className="p-5">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Icon className="h-4 w-4" />
          </div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <div className="mt-1 flex items-end justify-between gap-2">
            <p className="text-2xl font-semibold tracking-tight">{value}</p>
            {growth !== undefined ? (
              <span
                className={cn(
                  'inline-flex items-center gap-1 text-xs font-medium',
                  positive ? 'text-emerald-500' : 'text-red-500',
                )}
              >
                {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(growth)}%
              </span>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
