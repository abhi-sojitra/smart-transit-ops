'use client';

import {
  AlertTriangle,
  Clock3,
  DollarSign,
  Timer,
  Wrench,
} from 'lucide-react';
import { StatCard } from '@/components/charts/stat-card';
import type { MaintenanceStatistics } from '@/types/maintenance';

interface MaintenanceStatisticsProps {
  stats?: MaintenanceStatistics;
  loading?: boolean;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export function MaintenanceStatisticsCards({ stats, loading }: MaintenanceStatisticsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <StatCard title="Active Maintenance" value={stats?.active ?? 0} icon={Wrench} loading={loading} />
      <StatCard
        title="Vehicles in Shop"
        value={stats?.vehiclesInShop ?? 0}
        icon={AlertTriangle}
        loading={loading}
      />
      <StatCard title="Overdue" value={stats?.overdue ?? 0} icon={Clock3} loading={loading} />
      <StatCard
        title="Monthly Cost"
        value={formatCurrency(stats?.costThisMonth ?? 0)}
        icon={DollarSign}
        loading={loading}
      />
      <StatCard
        title="Avg Repair Time"
        value={`${stats?.averageRepairTimeDays ?? 0}d`}
        icon={Timer}
        loading={loading}
      />
    </div>
  );
}
