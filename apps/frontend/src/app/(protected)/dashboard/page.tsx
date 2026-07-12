'use client';

import {
  Activity,
  AlertTriangle,
  Fuel,
  Route,
  ShieldCheck,
  Truck,
  Users,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PageHeader } from '@/components/layout/page-header';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { StatCard } from '@/components/charts/stat-card';
import { ChartCard } from '@/components/charts/chart-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { fleetStatusData, mockActivities } from '@/constants/mock-data';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb items={[{ label: 'Home', href: '/dashboard' }, { label: 'Dashboard' }]} />
        <PageHeader
          title="Dashboard"
          description="Operational overview across fleet, drivers, and trips."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard title="Total Vehicles" value={85} icon={Truck} growth={4} />
        <StatCard title="Active Drivers" value={42} icon={Users} growth={2} />
        <StatCard title="Ongoing Trips" value="08" icon={Route} growth={-1} />
        <StatCard title="Maintenance Alerts" value={12} icon={AlertTriangle} growth={6} />
        <StatCard title="Fuel Efficiency" value="94%" icon={Fuel} growth={1} />
        <StatCard title="Safety Score" value="91%" icon={ShieldCheck} growth={3} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockActivities.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-border bg-muted/20 px-3 py-3"
              >
                <div>
                  <p className="text-sm font-medium">{item.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.time}</p>
                </div>
                <Badge status={item.status}>{item.status.replaceAll('_', ' ')}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <ChartCard title="Fleet Status" description="Current vehicle availability mix">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fleetStatusData} layout="vertical" margin={{ left: 8, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                  width={90}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                  }}
                />
                <Bar dataKey="value" fill="var(--primary)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
