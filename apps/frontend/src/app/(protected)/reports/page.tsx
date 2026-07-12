'use client';

import Link from 'next/link';
import { CalendarClock, FileText } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/feedback/empty-state';
import { useReportCatalog, useReportQuery, useReportSchedules } from '@/hooks/use-reports';
import { KPIWidget } from '@/components/reports/kpi-widget';
import { InsightCard } from '@/components/reports/insight-leaderboard';
import { REPORT_NAV, type BiReportCatalogItem, type BiScheduledReport } from '@/types/reports';

export default function ReportsHomePage() {
  const catalogQuery = useReportCatalog();
  const schedulesQuery = useReportSchedules();
  const executiveQuery = useReportQuery('executive', {});

  const catalog: BiReportCatalogItem[] =
    catalogQuery.data ??
    REPORT_NAV.map((item) => ({
      type: item.type,
      title: item.title,
      description: '',
      href: item.href,
    }));

  const schedules: BiScheduledReport[] = schedulesQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb items={[{ label: 'Home', href: '/dashboard' }, { label: 'Reports' }]} />
        <PageHeader
          title="Reports & Business Intelligence"
          description="Executive analytics, operational deep-dives, exports, and scheduled deliveries."
        />
      </div>

      {executiveQuery.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : executiveQuery.data ? (
        <>
          <KPIWidget metrics={executiveQuery.data.kpis.slice(0, 4)} />
          <InsightCard insights={executiveQuery.data.insights.slice(0, 4)} />
        </>
      ) : (
        <EmptyState title="Executive preview unavailable" />
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {catalog.map((item) => (
          <Card key={item.type} className="transition hover:border-primary/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4 text-primary" />
                {item.title}
              </CardTitle>
              <CardDescription>{item.description || `Open the ${item.title} workspace.`}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild size="sm">
                <Link href={item.href}>Open report</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarClock className="h-4 w-4" />
            Scheduled reports
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {schedulesQuery.isLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : !schedules.length ? (
            <p className="text-sm text-muted-foreground">
              No schedules yet. Open any report and click Schedule.
            </p>
          ) : (
            schedules.map((row) => (
              <div
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium">{row.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.type} · {row.frequency} · next {new Date(row.nextRunAt).toLocaleString()}
                  </p>
                </div>
                <span className="text-xs uppercase text-muted-foreground">{row.format}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
