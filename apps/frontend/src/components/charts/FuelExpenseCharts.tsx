'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from 'recharts';
import { ChartCard } from '@/components/charts/chart-card';
import { Skeleton } from '@/components/ui/skeleton';
import { chartTooltipFormatter, chartTooltipStyle } from '@/utils/chart-format';
import type { ExpenseStatistics, FuelStatistics } from '@transitops/shared-types';

const PIE_COLORS = [
  'var(--primary)',
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#ec4899',
  '#84cc16',
  '#6366f1',
];

interface FuelChartsProps {
  stats?: FuelStatistics;
  vehicleComparison?: { vehicleId: string; fuelCost: number; quantity: number }[];
  loading?: boolean;
}

export function FuelCharts({ stats, vehicleComparison, loading }: FuelChartsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartCard title="Fuel Consumption Trend" description="Daily quantity and cost (last 30 days)">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats?.fuelConsumptionTrend ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} />
              <Tooltip contentStyle={chartTooltipStyle} formatter={chartTooltipFormatter} />
              <Line type="monotone" dataKey="cost" stroke="#3b82f6" name="Cost ($)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard title="Monthly Fuel Cost" description="Fuel spend by month">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats?.monthlyFuelCost ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} />
              <Tooltip contentStyle={chartTooltipStyle} formatter={chartTooltipFormatter} />
              <Bar dataKey="cost" fill="var(--primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {vehicleComparison?.length ? (
        <ChartCard
          title="Vehicle Cost Comparison"
          description="Fuel cost by vehicle"
          className="lg:col-span-2"
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vehicleComparison} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis
                  type="category"
                  dataKey="vehicleId"
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                  width={80}
                />
                <Tooltip contentStyle={chartTooltipStyle} formatter={chartTooltipFormatter} />
                <Bar dataKey="fuelCost" fill="var(--primary)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      ) : null}
    </div>
  );
}

interface ExpenseChartsProps {
  stats?: ExpenseStatistics;
  loading?: boolean;
}

export function ExpenseCharts({ stats, loading }: ExpenseChartsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }

  const pieData =
    stats?.expenseByCategory?.map((item) => ({
      name: item.type.replaceAll('_', ' '),
      value: item.amount,
    })) ?? [];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartCard title="Expense by Category" description="Distribution by expense type">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {pieData.map((_, index) => (
                  <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={chartTooltipStyle} formatter={chartTooltipFormatter} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard title="Monthly Expenses" description="Expense totals by month">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats?.monthlyExpenses ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} />
              <Tooltip contentStyle={chartTooltipStyle} formatter={chartTooltipFormatter} />
              <Bar dataKey="amount" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );
}
