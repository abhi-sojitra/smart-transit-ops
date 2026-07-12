'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ChevronDown,
  LineChart as LineIcon,
  Route,
  ShieldCheck,
  Truck,
  Users,
  Wallet,
  Wrench,
  Fuel,
  Gauge,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { StatCard } from '@/components/charts/stat-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/feedback/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { ActivityTimeline } from '@/components/dashboard/activity-timeline';
import { AlertsPanel } from '@/components/dashboard/alerts-panel';
import { DashboardChartsGrid } from '@/components/dashboard/charts-grid';
import { Leaderboard } from '@/components/dashboard/leaderboard';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { SnapshotPanel } from '@/components/dashboard/snapshot-panel';
import { formatCurrency, formatDateTime, formatNumber } from '@/components/dashboard/format';
import { cn } from '@/utils/cn';
import {
  useDashboardActivity,
  useDashboardAlerts,
  useDashboardCharts,
  useDashboardOverview,
  useRecentTrips,
  useTopDrivers,
  useTopVehicles,
  useUpcomingMaintenance,
} from '@/hooks/use-dashboard';

export default function DashboardPage() {
  const [showDetails, setShowDetails] = useState(false);

  const overviewQuery = useDashboardOverview();
  const activityQuery = useDashboardActivity(8);
  const alertsQuery = useDashboardAlerts();
  const chartsQuery = useDashboardCharts();
  const topDriversQuery = useTopDrivers({ limit: 5 });
  const topVehiclesQuery = useTopVehicles({ limit: 5 });
  const upcomingQuery = useUpcomingMaintenance({ limit: 5 });
  const recentTripsQuery = useRecentTrips({ limit: 5 });

  const overview = overviewQuery.data;
  const loading = overviewQuery.isLoading;
  const criticalAlerts = useMemo(
    () => (alertsQuery.data ?? []).filter((a) => a.severity === 'CRITICAL').length,
    [alertsQuery.data],
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Breadcrumb items={[{ label: 'Home', href: '/dashboard' }, { label: 'Dashboard' }]} />
          <PageHeader
            title="Operations Dashboard"
            description="What needs attention right now — skim the top, open details only when you need them."
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/analytics">Analytics</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/reports">Reports</Link>
          </Button>
        </div>
      </div>

      {overviewQuery.isError ? (
        <EmptyState
          title="Dashboard unavailable"
          description="Could not load overview aggregations. Check the API and try again."
          actionLabel="Retry"
          onAction={() => void overviewQuery.refetch()}
        />
      ) : null}

      <QuickActions />

      {/* Hero KPIs — only 4, equal scan weight intentionally */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          At a glance
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Active Trips"
            value={overview ? formatNumber(overview.trips.active) : '—'}
            icon={Route}
            loading={loading}
            tone="success"
            hint={
              overview
                ? `${formatNumber(overview.trips.completedToday)} done today`
                : undefined
            }
          />
          <StatCard
            title="Revenue"
            value={overview ? formatCurrency(overview.finance.revenue, true) : '—'}
            icon={LineIcon}
            loading={loading}
            tone="primary"
            hint={
              overview
                ? `Profit ${formatCurrency(overview.finance.profit, true)}`
                : undefined
            }
          />
          <StatCard
            title="Fleet Utilization"
            value={overview ? `${formatNumber(overview.fleet.utilizationRate, 1)}%` : '—'}
            icon={Truck}
            loading={loading}
            tone="info"
            hint={
              overview
                ? `${overview.fleet.onTrip} on trip · ${overview.fleet.available} free`
                : undefined
            }
          />
          <StatCard
            title="Needs Attention"
            value={
              alertsQuery.isLoading
                ? '—'
                : formatNumber(criticalAlerts || (alertsQuery.data?.length ?? 0))
            }
            icon={AlertTriangle}
            loading={alertsQuery.isLoading}
            tone={criticalAlerts > 0 ? 'danger' : 'warning'}
            hint={criticalAlerts > 0 ? 'Critical alerts' : 'Open alerts'}
          />
        </div>
      </section>

      {/* Grouped domain snapshots — scan by section, not 14 cards */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          By area
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SnapshotPanel
            title="Fleet"
            icon={Truck}
            href="/fleet"
            loading={loading}
            metrics={[
              {
                label: 'Total vehicles',
                value: overview ? formatNumber(overview.fleet.totalVehicles) : '—',
                emphasize: true,
              },
              {
                label: 'Available',
                value: overview ? formatNumber(overview.fleet.available) : '—',
                tone: 'success',
              },
              {
                label: 'In shop',
                value: overview ? formatNumber(overview.fleet.inShop) : '—',
                tone: overview && overview.fleet.inShop > 0 ? 'warning' : 'default',
              },
              {
                label: 'Retired',
                value: overview ? formatNumber(overview.fleet.retired) : '—',
              },
            ]}
          />
          <SnapshotPanel
            title="Drivers"
            icon={Users}
            href="/drivers"
            loading={loading}
            metrics={[
              {
                label: 'Available',
                value: overview ? formatNumber(overview.drivers.available) : '—',
                emphasize: true,
                tone: 'success',
              },
              {
                label: 'On trip',
                value: overview ? formatNumber(overview.drivers.onTrip) : '—',
              },
              {
                label: 'Suspended',
                value: overview ? formatNumber(overview.drivers.suspended) : '—',
                tone: overview && overview.drivers.suspended > 0 ? 'danger' : 'default',
              },
              {
                label: 'Licenses expiring',
                value: overview ? formatNumber(overview.drivers.licenseExpiring) : '—',
                tone: overview && overview.drivers.licenseExpiring > 0 ? 'warning' : 'default',
              },
            ]}
          />
          <SnapshotPanel
            title="Trips & maintenance"
            icon={Wrench}
            href="/trips"
            loading={loading}
            metrics={[
              {
                label: 'Active trips',
                value: overview ? formatNumber(overview.trips.active) : '—',
                emphasize: true,
              },
              {
                label: 'Cancelled',
                value: overview ? formatNumber(overview.trips.cancelled) : '—',
              },
              {
                label: 'Maintenance open',
                value: overview ? formatNumber(overview.maintenance.active) : '—',
                tone: 'warning',
              },
              {
                label: 'Overdue',
                value: overview ? formatNumber(overview.maintenance.overdue) : '—',
                tone: overview && overview.maintenance.overdue > 0 ? 'danger' : 'default',
              },
            ]}
          />
          <SnapshotPanel
            title="Costs this month"
            icon={Wallet}
            href="/fuel-expenses"
            loading={loading}
            metrics={[
              {
                label: 'Fuel',
                value: overview ? formatCurrency(overview.fuel.monthlyCost, true) : '—',
                emphasize: true,
              },
              {
                label: 'Expenses',
                value: overview ? formatCurrency(overview.expense.monthlyExpense, true) : '—',
              },
              {
                label: 'Ops cost',
                value: overview
                  ? formatCurrency(overview.finance.operationalCost, true)
                  : '—',
              },
              {
                label: 'Efficiency',
                value: overview
                  ? `${formatNumber(overview.fuel.fuelEfficiency, 1)} km/L`
                  : '—',
                tone: 'success',
              },
            ]}
          />
        </div>
      </section>

      {/* Alerts first — actionable; activity secondary */}
      <section className="grid gap-4 xl:grid-cols-[1fr_1.1fr]">
        <AlertsPanel
          alerts={alertsQuery.data}
          loading={alertsQuery.isLoading}
          error={alertsQuery.isError}
        />
        <div className="grid gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recent trips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentTripsQuery.isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-11 w-full rounded-lg" />
                ))
              ) : !recentTripsQuery.data?.length ? (
                <EmptyState title="No recent trips" className="py-8" />
              ) : (
                recentTripsQuery.data.map((trip) => (
                  <Link
                    key={trip.id}
                    href={`/trips/${trip.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5 transition-colors hover:bg-muted/40"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {trip.tripNumber} · {trip.source} → {trip.destination}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {trip.driverName ?? 'Driver'} · {trip.status.replaceAll('_', ' ')}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold tabular-nums">
                      {formatCurrency(trip.revenue, true)}
                    </p>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Progressive disclosure for deeper data */}
      <section className="space-y-4">
        <button
          type="button"
          onClick={() => setShowDetails((v) => !v)}
          className="flex w-full items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-muted/30"
        >
          <div>
            <p className="text-sm font-semibold">Charts, rankings & activity</p>
            <p className="text-xs text-muted-foreground">
              Open when you need trends, leaderboards, or the full timeline
            </p>
          </div>
          <ChevronDown
            className={cn(
              'h-5 w-5 shrink-0 text-muted-foreground transition-transform',
              showDetails && 'rotate-180',
            )}
          />
        </button>

        {showDetails ? (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MiniStat
                icon={ShieldCheck}
                label="Safety score"
                value={
                  overview
                    ? formatNumber(overview.drivers.averageSafetyScore, 0)
                    : '—'
                }
                loading={loading}
              />
              <MiniStat
                icon={Fuel}
                label="Monthly fuel"
                value={overview ? formatCurrency(overview.fuel.monthlyCost, true) : '—'}
                loading={loading}
              />
              <MiniStat
                icon={Gauge}
                label="Fuel efficiency"
                value={
                  overview
                    ? `${formatNumber(overview.fuel.fuelEfficiency, 1)} km/L`
                    : '—'
                }
                loading={loading}
              />
              <MiniStat
                icon={Wallet}
                label="Ops cost"
                value={
                  overview
                    ? formatCurrency(overview.finance.operationalCost, true)
                    : '—'
                }
                loading={loading}
              />
            </div>

            <DashboardChartsGrid charts={chartsQuery.data} loading={chartsQuery.isLoading} />

            <Leaderboard
              drivers={topDriversQuery.data}
              vehicles={topVehiclesQuery.data}
              loading={topDriversQuery.isLoading || topVehiclesQuery.isLoading}
            />

            <div className="grid gap-4 xl:grid-cols-2">
              <ActivityTimeline
                items={activityQuery.data}
                loading={activityQuery.isLoading}
                error={activityQuery.isError}
              />
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Upcoming maintenance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {upcomingQuery.isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full rounded-lg" />
                    ))
                  ) : !upcomingQuery.data?.length ? (
                    <EmptyState title="No upcoming maintenance" className="py-8" />
                  ) : (
                    upcomingQuery.data.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {item.vehicleLabel} · {item.serviceType}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(item.date)}
                          </p>
                        </div>
                        <p className="text-sm font-semibold tabular-nums">
                          {formatCurrency(item.cost)}
                        </p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  loading,
}: {
  icon: typeof ShieldCheck;
  label: string;
  value: string;
  loading?: boolean;
}) {
  if (loading) {
    return <Skeleton className="h-16 w-full rounded-xl" />;
  }
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-bold tabular-nums">{value}</p>
      </div>
    </div>
  );
}
