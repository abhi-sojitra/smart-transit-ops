'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { BiKpiMetric } from '@transitops/shared-types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/utils/cn';

export function MetricTile({
  metric,
  className,
}: {
  metric: BiKpiMetric;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Card className={cn('overflow-hidden', className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {metric.label}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold tracking-tight">
            {formatMetric(metric.value, metric.unit)}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function KPIWidget({ metrics }: { metrics: BiKpiMetric[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <MetricTile key={metric.key} metric={metric} />
      ))}
    </div>
  );
}

function formatMetric(value: number, unit?: string) {
  const abs = Math.abs(value);
  const formatted =
    unit === 'USD'
      ? value.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
      : unit === '%'
        ? `${value.toFixed(1)}%`
        : abs >= 1000
          ? value.toLocaleString(undefined, { maximumFractionDigits: 1 })
          : Number.isInteger(value)
            ? String(value)
            : value.toFixed(2);
  if (unit && unit !== 'USD' && unit !== '%') return `${formatted} ${unit}`;
  return formatted;
}
