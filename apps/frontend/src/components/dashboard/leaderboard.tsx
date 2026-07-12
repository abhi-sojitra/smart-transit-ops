'use client';

import type { TopDriverItem, TopVehicleItem } from '@transitops/shared-types';
import { Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/feedback/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatNumber } from './format';

interface LeaderboardProps {
  drivers?: TopDriverItem[];
  vehicles?: TopVehicleItem[];
  loading?: boolean;
}

export function Leaderboard({ drivers, vehicles, loading }: LeaderboardProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="h-4 w-4 text-primary" />
            Top Drivers
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))
          ) : !drivers?.length ? (
            <EmptyState title="No driver rankings yet" />
          ) : (
            drivers.map((driver, index) => (
              <div
                key={driver.driverId}
                className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{driver.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {driver.employeeCode} · {driver.completedTrips} trips
                    </p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold tabular-nums">
                    {formatCurrency(driver.revenue, true)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Safety {formatNumber(driver.safetyScore, 0)}
                  </p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="h-4 w-4 text-primary" />
            Top Vehicles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))
          ) : !vehicles?.length ? (
            <EmptyState title="No vehicle rankings yet" />
          ) : (
            vehicles.map((vehicle, index) => (
              <div
                key={vehicle.vehicleId}
                className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{vehicle.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {vehicle.completedTrips} trips · Cost{' '}
                      {formatCurrency(vehicle.operationalCost, true)}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold tabular-nums">{vehicle.roi}% ROI</p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatCurrency(vehicle.revenue, true)}
                  </p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
