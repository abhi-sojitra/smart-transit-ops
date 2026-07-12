'use client';

import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Gauge, LineChart as LineIcon, Route, TrendingUp } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { StatCard } from '@/components/charts/stat-card';
import { ChartCard } from '@/components/charts/chart-card';
import { DashboardChartsGrid } from '@/components/dashboard/charts-grid';
import { formatCurrency, formatNumber } from '@/components/dashboard/format';
import { EmptyState } from '@/components/feedback/empty-state';
import { Button } from '@/components/ui/button';
import { useAnalyticsCharts, useDashboardOverview } from '@/hooks/use-dashboard';

const MONTH_OPTIONS = [3, 6, 12] as const;

export default function AnalyticsPage() {
  const [months, setMonths] = useState<(typeof MONTH_OPTIONS)[number]>(6);
  const chartsQuery = useAnalyticsCharts(months);
  const overviewQuery = useDashboardOverview();
  const charts = chartsQuery.data;
  const overview = overviewQuery.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Breadcrumb items={[{ label: 'Home', href: '/dashboard' }, { label: 'Analytics' }]} />
          <PageHeader
            title="Analytics"
            description="Trends across utilization, revenue, fuel, maintenance, and ROI."
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {MONTH_OPTIONS.map((option) => (
            <Button
              key={option}
              size="sm"
              variant={months === option ? 'default' : 'outline'}
              onClick={() => setMonths(option)}
            >
              {option} mo
            </Button>
          ))}
        </div>
      </div>

      {chartsQuery.isError ? (
        <EmptyState
          title="Analytics unavailable"
          description="Could not load chart aggregations."
          actionLabel="Retry"
          onAction={() => void chartsQuery.refetch()}
        />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Fuel Efficiency"
          value={
            overview
              ? `${formatNumber(overview.fuel.fuelEfficiency, 1)} km/L`
              : '—'
          }
          icon={Gauge}
          loading={overviewQuery.isLoading}
          tone="info"
        />
        <StatCard
          title="Total Revenue"
          value={overview ? formatCurrency(overview.finance.revenue, true) : '—'}
          icon={LineIcon}
          loading={overviewQuery.isLoading}
          tone="success"
        />
        <StatCard
          title="Trip Volume"
          value={overview ? formatNumber(overview.trips.total) : '—'}
          icon={Route}
          loading={overviewQuery.isLoading}
          tone="primary"
        />
        <StatCard
          title="ROI"
          value={overview ? `${formatNumber(overview.finance.roi, 1)}%` : '—'}
          icon={TrendingUp}
          loading={overviewQuery.isLoading}
          tone="warning"
        />
      </div>

      <DashboardChartsGrid charts={charts} loading={chartsQuery.isLoading} />

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Driver Performance" description="Revenue by top drivers">
          <div className="h-72">
            {chartsQuery.isLoading ? null : charts?.driverPerformance.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.driverPerformance} layout="vertical" margin={{ left: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" stroke="var(--muted-foreground)" fontSize={12} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={100}
                    stroke="var(--muted-foreground)"
                    fontSize={11}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Bar dataKey="value" fill="var(--primary)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="No driver performance data" className="py-12" />
            )}
          </div>
        </ChartCard>

        <ChartCard title="Vehicle ROI" description="Return on operational spend">
          <div className="h-72">
            {chartsQuery.isLoading ? null : charts?.vehicleRoi.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.vehicleRoi}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                    }}
                    formatter={(value: number) => `${value}%`}
                  />
                  <Bar dataKey="value" fill="var(--info)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="No vehicle ROI data" className="py-12" />
            )}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
