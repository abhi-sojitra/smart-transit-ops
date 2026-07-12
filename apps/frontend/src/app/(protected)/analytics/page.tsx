'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Gauge, LineChart as LineIcon, Route } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { StatCard } from '@/components/charts/stat-card';
import { ChartCard } from '@/components/charts/chart-card';
import { fuelConsumptionData, tripVolumeData } from '@/constants/mock-data';

const expenseBreakdown = [
  { name: 'Fuel', value: 48 },
  { name: 'Maintenance', value: 27 },
  { name: 'Tolls', value: 15 },
  { name: 'Other', value: 10 },
];

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb items={[{ label: 'Home', href: '/dashboard' }, { label: 'Analytics' }]} />
        <PageHeader
          title="Reports & Analytics"
          description="Trends across trips, fuel, and operating spend."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Avg. Fuel Efficiency" value="7.2 km/L" icon={Gauge} growth={2} />
        <StatCard title="Total Revenue" value="$284k" icon={LineIcon} growth={8} />
        <StatCard title="Trip Volume" value="1,142" icon={Route} growth={5} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Fuel Consumption" description="Liters by month">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={fuelConsumptionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                  }}
                />
                <Line type="monotone" dataKey="liters" stroke="var(--primary)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Trip Volume" description="Dispatched trips by month">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tripVolumeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                  }}
                />
                <Bar dataKey="trips" fill="var(--info)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <ChartCard title="Expense Breakdown" description="Share of operating costs">
        <div className="space-y-3">
          {expenseBreakdown.map((item) => (
            <div key={item.name}>
              <div className="mb-1 flex justify-between text-sm">
                <span>{item.name}</span>
                <span className="text-muted-foreground">{item.value}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${item.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </ChartCard>
    </div>
  );
}
