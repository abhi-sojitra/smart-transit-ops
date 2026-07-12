'use client';

import Link from 'next/link';
import {
  AlertTriangle,
  Eye,
  Fuel,
  Gauge,
  Pencil,
  Shield,
  Trash2,
  Truck,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VehicleStatusBadge } from '@/components/fleet/vehicle-status-badge';
import { staggerItem } from '@/components/fleet/motion';
import { useSafeReducedMotion } from '@/hooks/use-safe-reduced-motion';
import { cn } from '@/utils/cn';
import type { Vehicle } from '@/types/fleet';
import { ComplianceStatus, ServiceDueStatus } from '@transitops/shared-types';

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

function compliancePoints(status?: ComplianceStatus) {
  if (status === ComplianceStatus.EXPIRED) return 0;
  if (status === ComplianceStatus.EXPIRING) return 55;
  return 100;
}

function servicePoints(status?: ServiceDueStatus) {
  if (status === ServiceDueStatus.OVERDUE) return 0;
  if (status === ServiceDueStatus.DUE_SOON) return 55;
  return 100;
}

function vehicleComplianceScore(vehicle: Vehicle) {
  const scores = [
    compliancePoints(vehicle.registrationStatus),
    compliancePoints(vehicle.insuranceStatus),
    compliancePoints(vehicle.fitnessStatus),
    servicePoints(vehicle.serviceDueStatus),
  ];
  return Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length);
}

function complianceTone(score: number) {
  if (score >= 85) return 'text-emerald-500';
  if (score >= 70) return 'text-amber-500';
  return 'text-red-500';
}

function complianceBarColor(score: number) {
  if (score >= 85) return 'bg-emerald-500';
  if (score >= 70) return 'bg-amber-500';
  return 'bg-red-500';
}

export function VehicleCard({ vehicle, onDelete }: VehicleCardProps) {
  const reduceMotion = useSafeReducedMotion();
  const insuranceWarning =
    vehicle.insuranceStatus === ComplianceStatus.EXPIRED ||
    vehicle.insuranceStatus === ComplianceStatus.EXPIRING;
  const complianceScore = vehicleComplianceScore(vehicle);

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
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary ring-1 ring-primary/20">
              <Truck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <CardTitle className="truncate text-base">
                {vehicle.make} {vehicle.model}
              </CardTitle>
              <p className="mt-0.5 font-mono text-xs text-muted-foreground">{vehicle.vehicleId}</p>
            </div>
          </div>
          <VehicleStatusBadge status={vehicle.status} />
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Fuel className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate text-foreground">{vehicle.fuelType}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Gauge className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate tabular-nums text-foreground">
                {vehicle.mileage.toLocaleString()} km
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <div>
              <p className="font-mono text-foreground/90">{vehicle.registrationNumber}</p>
              <p
                className={cn(
                  'mt-0.5 text-xs',
                  vehicle.insuranceStatus === ComplianceStatus.EXPIRED && 'font-medium text-red-500',
                  vehicle.insuranceStatus === ComplianceStatus.EXPIRING && 'font-medium text-amber-500',
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
            </div>
          </div>

          <div className="rounded-lg bg-muted/40 px-3 py-2">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Compliance health</span>
              <span className={cn('font-semibold tabular-nums', complianceTone(complianceScore))}>
                {complianceScore}/100
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <motion.div
                className={cn('h-full rounded-full', complianceBarColor(complianceScore))}
                initial={reduceMotion ? false : { width: 0 }}
                animate={{ width: `${Math.max(0, Math.min(complianceScore, 100))}%` }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <Link href={`/fleet/${vehicle.id}`}>
                <Eye className="h-3.5 w-3.5" />
                View
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <Link href={`/fleet/${vehicle.id}/edit`}>
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Link>
            </Button>
            {onDelete ? (
              <Button variant="ghost" size="sm" onClick={() => onDelete(vehicle)}>
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
