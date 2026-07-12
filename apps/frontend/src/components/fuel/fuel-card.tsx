'use client';

import Link from 'next/link';
import { Droplets, Eye, Fuel, Pencil, Trash2 } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import type { FuelLog } from '@transitops/shared-types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FuelTypeBadge } from '@/components/fuel/fuel-type-badge';
import { staggerItem } from '@/components/drivers/motion';
import { formatDisplayDate } from '@/utils/date';
import { costBarPercent, formatFuelCost, getFuelInitials } from '@/components/fuel/fuel-display';

interface FuelCardProps {
  log: FuelLog;
  onDelete?: (log: FuelLog) => void;
}

export function FuelCard({ log, onDelete }: FuelCardProps) {
  const reduceMotion = useReducedMotion();
  const barWidth = `${costBarPercent(log.totalCost)}%`;

  return (
    <motion.div
      variants={staggerItem}
      initial={reduceMotion ? false : 'hidden'}
      animate="show"
      whileHover={reduceMotion ? undefined : { y: -2 }}
      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
    >
      <Card className="overflow-hidden border-border/80 transition-colors hover:border-primary/30">
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary ring-1 ring-primary/20">
              {getFuelInitials(log.fuelStation)}
            </div>
            <div className="min-w-0">
              <CardTitle className="truncate text-base">{log.fuelStation}</CardTitle>
              <p className="mt-0.5 font-mono text-xs text-muted-foreground">{log.vehicleId}</p>
            </div>
          </div>
          <FuelTypeBadge type={log.fuelType} />
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Fuel className="h-3.5 w-3.5 shrink-0" />
            <span>{log.tripId ? `Trip ${log.tripId}` : 'No trip linked'}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Droplets className="h-3.5 w-3.5 shrink-0" />
            <span className="tabular-nums">{log.quantity.toFixed(1)} L</span>
            <span className="text-xs">·</span>
            <span className="tabular-nums">{formatDisplayDate(log.filledAt)}</span>
          </div>

          <div className="rounded-lg bg-muted/40 px-3 py-2">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Total cost</span>
              <span className="font-semibold tabular-nums text-primary">
                {formatFuelCost(log.totalCost)}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={reduceMotion ? false : { width: 0 }}
                animate={{ width: barWidth }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <Link href={`/fuel/${log.id}`}>
                <Eye className="h-3.5 w-3.5" />
                View
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <Link href={`/fuel/${log.id}/edit`}>
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Link>
            </Button>
            {onDelete ? (
              <Button variant="ghost" size="sm" onClick={() => onDelete(log)}>
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
