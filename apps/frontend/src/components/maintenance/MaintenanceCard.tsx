'use client';

import Link from 'next/link';
import {
  Calendar,
  CheckCircle2,
  Eye,
  PlayCircle,
  Truck,
  Wrench,
  XCircle,
} from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { MaintenanceStatus } from '@transitops/shared-types';
import type { Maintenance } from '@transitops/shared-types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { staggerItem } from '@/components/drivers/motion';
import { MaintenanceStatusBadge } from './MaintenanceStatusBadge';

interface MaintenanceCardProps {
  item: Maintenance;
  onStart?: (item: Maintenance) => void;
  onComplete?: (item: Maintenance) => void;
  onCancel?: (item: Maintenance) => void;
}

function money(value?: number) {
  if (value == null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

function formatDate(value?: string) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
}

export function MaintenanceCard({ item, onStart, onComplete, onCancel }: MaintenanceCardProps) {
  const reduceMotion = useReducedMotion();
  const active =
    item.status === MaintenanceStatus.SCHEDULED || item.status === MaintenanceStatus.IN_PROGRESS;

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
          <div className="min-w-0">
            <CardTitle className="truncate text-base">
              <Link href={`/maintenance/${item.id}`} className="hover:text-primary">
                {item.maintenanceNumber}
              </Link>
            </CardTitle>
            <p className="mt-1 truncate text-sm text-muted-foreground">{item.title}</p>
          </div>
          <MaintenanceStatusBadge status={item.status} />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Truck className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate text-foreground">{item.vehicleNumber ?? '—'}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Wrench className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate text-foreground">
                {item.maintenanceType?.replaceAll('_', ' ') ?? '—'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate text-foreground">{formatDate(item.expectedCompletionDate)}</span>
            </div>
            <div className="truncate font-medium tabular-nums">{money(item.estimatedCost)}</div>
          </div>
          {item.priority ? (
            <Badge status={item.priority} className="w-fit">
              {item.priority}
            </Badge>
          ) : null}

          <div className="flex flex-wrap gap-2 pt-1">
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <Link href={`/maintenance/${item.id}`}>
                <Eye className="h-3.5 w-3.5" />
                View
              </Link>
            </Button>
            {item.status === MaintenanceStatus.SCHEDULED ? (
              <Button size="sm" onClick={() => onStart?.(item)}>
                <PlayCircle className="h-3.5 w-3.5" />
                Start
              </Button>
            ) : null}
            {active ? (
              <>
                <Button size="sm" variant="secondary" onClick={() => onComplete?.(item)}>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Complete
                </Button>
                <Button size="sm" variant="outline" onClick={() => onCancel?.(item)}>
                  <XCircle className="h-3.5 w-3.5" />
                  Cancel
                </Button>
              </>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
