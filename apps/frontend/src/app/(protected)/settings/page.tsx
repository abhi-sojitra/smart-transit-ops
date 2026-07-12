'use client';

import Link from 'next/link';
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
import { SettingsStat } from '@/components/settings/settings-stat';
import { SettingsCard } from '@/components/settings/settings-card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/feedback/empty-state';
import { useAdminStatistics } from '@/hooks/use-admin';
import { formatNumber } from '@/components/dashboard/format';

export default function SettingsHomePage() {
  const statsQuery = useAdminStatistics();
  const stats = statsQuery.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Breadcrumb items={[{ label: 'Home', href: '/dashboard' }, { label: 'Settings' }]} />
          <PageHeader
            title="Administration"
            description="Users, roles, permissions, security, and audit."
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/settings/users">Manage users</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/settings/roles">Manage roles</Link>
          </Button>
        </div>
      </div>

      {statsQuery.isError ? (
        <EmptyState
          title="Stats unavailable"
          description="Could not load administration statistics."
          actionLabel="Retry"
          onAction={() => void statsQuery.refetch()}
        />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SettingsStat
          label="Total users"
          value={stats ? formatNumber(stats.totalUsers) : '—'}
          hint={stats ? `${stats.activeUsers} active` : undefined}
          loading={statsQuery.isLoading}
        />
        <SettingsStat
          label="Roles"
          value={stats ? formatNumber(stats.totalRoles) : '—'}
          loading={statsQuery.isLoading}
        />
        <SettingsStat
          label="Permissions"
          value={stats ? formatNumber(stats.totalPermissions) : '—'}
          loading={statsQuery.isLoading}
        />
        <SettingsStat
          label="Failed logins today"
          value={stats ? formatNumber(stats.failedLoginsToday) : '—'}
          loading={statsQuery.isLoading}
        />
        <SettingsStat
          label="Audit events today"
          value={stats ? formatNumber(stats.auditEventsToday) : '—'}
          loading={statsQuery.isLoading}
        />
        <SettingsStat
          label="Inactive users"
          value={stats ? formatNumber(stats.inactiveUsers) : '—'}
          loading={statsQuery.isLoading}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SettingsCard title="Users by role" description="Distribution across RBAC roles">
          <div className="h-64">
            {stats?.usersByRole?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.usersByRole}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="role" stroke="var(--muted-foreground)" fontSize={11} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                    }}
                  />
                  <Bar dataKey="count" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="No role distribution yet" className="py-10" />
            )}
          </div>
        </SettingsCard>

        <SettingsCard title="Login activity" description="Last 7 days">
          <div className="h-64">
            {stats?.loginActivity?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.loginActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={11} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                    }}
                  />
                  <Bar dataKey="value" fill="var(--info)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="No login activity yet" className="py-10" />
            )}
          </div>
        </SettingsCard>
      </div>
    </div>
  );
}
