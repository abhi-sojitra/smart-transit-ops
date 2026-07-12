'use client';

import type { DashboardCharts } from '@transitops/shared-types';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartCard } from '@/components/charts/chart-card';
import { EmptyState } from '@/components/feedback/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from './format';

const tooltipStyle = {
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: 8,
};

interface DashboardChartsGridProps {
  charts?: DashboardCharts;
  loading?: boolean;
  dense?: boolean;
}

function ChartSkeleton() {
  return <Skeleton className="h-64 w-full rounded-xl" />;
}

export function DashboardChartsGrid({ charts, loading, dense }: DashboardChartsGridProps) {
  if (loading) {
    return (
      <div className="grid gap-4 xl:grid-cols-2">
        <ChartSkeleton />
        <ChartSkeleton />
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    );
  }

  if (!charts) {
    return <EmptyState title="Charts unavailable" description="Could not load analytics data." />;
  }

  return (
    <div className={dense ? 'grid gap-4 xl:grid-cols-2' : 'grid gap-4 xl:grid-cols-2'}>
      <ChartCard title="Fleet Utilization" description="Current vehicle status mix">
        <div className="h-64">
          {charts.fleetUtilization.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.fleetUtilization} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis
                  type="category"
                  dataKey="label"
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                  width={80}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill="var(--primary)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="No fleet data" className="py-10" />
          )}
        </div>
      </ChartCard>

      <ChartCard title="Revenue vs Expense" description="Monthly comparison">
        <div className="h-64">
          {charts.revenueVsExpense.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.revenueVsExpense}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend />
                <Bar dataKey="value" name="Revenue" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                <Bar
                  dataKey="secondary"
                  name="Expense"
                  fill="var(--info)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="No finance trend" className="py-10" />
          )}
        </div>
      </ChartCard>

      <ChartCard title="Fuel Consumption" description="Liters by month">
        <div className="h-64">
          {charts.fuelConsumption.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.fuelConsumption}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line
                  type="monotone"
                  dataKey="value"
                  name="Liters"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="No fuel trend" className="py-10" />
          )}
        </div>
      </ChartCard>

      <ChartCard title="Trip Trend" description="Trips planned vs completed">
        <div className="h-64">
          {charts.tripTrend.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.tripTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  name="Planned"
                  stroke="var(--info)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="secondary"
                  name="Completed"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="No trip trend" className="py-10" />
          )}
        </div>
      </ChartCard>

      <ChartCard title="Maintenance Cost" description="Spend by month">
        <div className="h-64">
          {charts.maintenanceCost.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.maintenanceCost}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Bar dataKey="value" fill="var(--warning)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="No maintenance trend" className="py-10" />
          )}
        </div>
      </ChartCard>

      <ChartCard title="Trip Status" description="Current mix">
        <div className="h-64">
          {charts.tripStatus.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.tripStatus}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill="var(--success)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="No trip status data" className="py-10" />
          )}
        </div>
      </ChartCard>
    </div>
  );
}
