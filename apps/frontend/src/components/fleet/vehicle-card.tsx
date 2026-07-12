'use client';

import Link from 'next/link';
import { AlertTriangle, Eye, Gauge, Pencil, Trash2 } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VehicleStatusBadge } from '@/components/fleet/vehicle-status-badge';
import { staggerItem } from '@/components/fleet/motion';
import { cn } from '@/utils/cn';
import type { Vehicle } from '@/types/fleet';

interface VehicleCardProps {
  vehicle: Vehicle;
  onDelete?: (vehicle: Vehicle) => void;
}

function formatDate(value?: string) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function VehicleCard({ vehicle, onDelete }: VehicleCardProps) {
  const reduceMotion = useReducedMotion();
  const insuranceWarning =
    vehicle.insuranceStatus === 'EXPIRED' || vehicle.insuranceStatus === 'EXPIRING';

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
              {vehicle.make} {vehicle.model}
            </CardTitle>
            <p className="mt-0.5 font-mono text-xs text-muted-foreground">{vehicle.vehicleId}</p>
          </div>
          <VehicleStatusBadge status={vehicle.status} />
        </CardHeader>

        <CardContent className="space-y-3">
          <p className="font-mono text-sm text-muted-foreground">{vehicle.registrationNumber}</p>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Gauge className="h-3.5 w-3.5 shrink-0" />
            <span className="tabular-nums">{vehicle.mileage.toLocaleString()} km</span>
          </div>

          <p
            className={cn(
              'text-xs',
              insuranceWarning && 'font-medium text-amber-500',
              vehicle.insuranceStatus === 'EXPIRED' && 'text-red-500',
            )}
          >
            {insuranceWarning ? (
              <span className="inline-flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Insurance expires {formatDate(vehicle.insuranceExpiryDate)}
              </span>
            ) : (
              <>Insurance valid until {formatDate(vehicle.insuranceExpiryDate)}</>
            )}
          </p>

          <div className="flex gap-2 pt-1">
            <Button variant="outline" size="sm" asChild className="flex-1">
              <Link href={`/fleet/${vehicle.id}`}>
                <Eye className="h-4 w-4" />
                View
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/fleet/${vehicle.id}/edit`}>
                <Pencil className="h-4 w-4" />
              </Link>
            </Button>
            {onDelete ? (
              <Button variant="ghost" size="sm" onClick={() => onDelete(vehicle)}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
