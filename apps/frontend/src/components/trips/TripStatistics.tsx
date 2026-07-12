'use client';

import { Activity, CheckCircle2, DollarSign, MapPinned, Clock3 } from 'lucide-react';
import { StatCard } from '@/components/charts/stat-card';
import type { TripStatistics } from '@transitops/shared-types';

export function TripStatisticsCards({
  stats,
  loading,
}: {
  stats?: TripStatistics;
  loading?: boolean;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <StatCard title="Active Trips" value={stats?.activeTrips ?? 0} icon={Activity} loading={loading} />
      <StatCard title="Pending Trips" value={stats?.pendingTrips ?? 0} icon={Clock3} loading={loading} />
      <StatCard
        title="Completed Trips"
        value={stats?.completedTrips ?? 0}
        icon={CheckCircle2}
        loading={loading}
      />
      <StatCard
        title="Revenue"
        value={stats ? `$${Math.round(stats.revenue).toLocaleString()}` : '$0'}
        icon={DollarSign}
        loading={loading}
      />
      <StatCard
        title="Distance Travelled"
        value={stats ? `${Math.round(stats.distanceTravelled).toLocaleString()} mi` : '0 mi'}
        icon={MapPinned}
        loading={loading}
      />
    </div>
  );
}
