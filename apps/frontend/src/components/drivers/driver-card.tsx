'use client';

import Link from 'next/link';
import { AlertTriangle, Eye, Pencil, Phone, Shield, Trash2 } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DriverStatusBadge } from '@/components/drivers/driver-status-badge';
import { staggerItem } from '@/components/drivers/motion';
import { cn } from '@/utils/cn';
import type { Driver } from '@/types/driver';
import { getDriverDisplayName, getInitials } from '@/components/drivers/driver-display';

interface DriverCardProps {
  driver: Driver;
  onDelete?: (driver: Driver) => void;
}

function formatDate(value?: string) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function DriverCard({ driver, onDelete }: DriverCardProps) {
  const reduceMotion = useReducedMotion();
  const isExpired = driver.licenseStatus === 'EXPIRED';
  const isExpiring = driver.licenseStatus === 'EXPIRING';
  const scoreTone =
    driver.safetyScore >= 85
      ? 'text-emerald-500'
      : driver.safetyScore >= 70
        ? 'text-amber-500'
        : 'text-red-500';

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
              {getInitials(getDriverDisplayName(driver))}
            </div>
            <div className="min-w-0">
              <CardTitle className="truncate text-base">{getDriverDisplayName(driver)}</CardTitle>
              <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                {driver.employeeCode || '—'}
              </p>
            </div>
          </div>
          <DriverStatusBadge status={driver.status} />
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-3.5 w-3.5 shrink-0" />
            <span className="tabular-nums">{driver.phone || '—'}</span>
          </div>

          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <div>
              <p className="font-mono text-foreground/90">{driver.licenseNumber}</p>
              <p
                className={cn(
                  'mt-0.5 text-xs',
                  isExpired && 'font-medium text-red-500',
                  isExpiring && 'font-medium text-amber-500',
                )}
              >
                {isExpired || isExpiring ? (
                  <span className="inline-flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Expires {formatDate(driver.licenseExpiryDate)}
                  </span>
                ) : (
                  <>Expires {formatDate(driver.licenseExpiryDate)}</>
                )}
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-muted/40 px-3 py-2">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Safety score</span>
              <span className={cn('font-semibold tabular-nums', scoreTone)}>
                {driver.safetyScore}/100
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <motion.div
                className={cn(
                  'h-full rounded-full',
                  driver.safetyScore >= 85
                    ? 'bg-emerald-500'
                    : driver.safetyScore >= 70
                      ? 'bg-amber-500'
                      : 'bg-red-500',
                )}
                initial={reduceMotion ? false : { width: 0 }}
                animate={{ width: `${Math.max(0, Math.min(driver.safetyScore, 100))}%` }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <Link href={`/drivers/${driver.id}`}>
                <Eye className="h-3.5 w-3.5" />
                View
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <Link href={`/drivers/${driver.id}/edit`}>
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Link>
            </Button>
            {onDelete ? (
              <Button variant="ghost" size="sm" onClick={() => onDelete(driver)}>
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
