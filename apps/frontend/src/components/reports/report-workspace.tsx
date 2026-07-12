'use client';

import { useMemo, useState } from 'react';
import type { BiReportBase, BiReportFilters, BiReportType } from '@transitops/shared-types';
import { toast } from 'sonner';
import { Download, CalendarClock } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/feedback/empty-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KPIWidget } from '@/components/reports/kpi-widget';
import { ChartCard } from '@/components/reports/chart-card';
import { InsightCard, LeaderboardCard } from '@/components/reports/insight-leaderboard';
import {
  useExportReportMutation,
  useReportQuery,
  useScheduleReportMutation,
} from '@/hooks/use-reports';
import { REPORT_NAV } from '@/types/reports';
import Link from 'next/link';

function defaultRange(): BiReportFilters {
  const end = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - 1);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

export function ReportWorkspace({
  type,
  title,
  description,
}: {
  type: BiReportType;
  title: string;
  description: string;
}) {
  const [filters, setFilters] = useState<BiReportFilters>(defaultRange);
  const [draft, setDraft] = useState<BiReportFilters>(defaultRange);
  const query = useReportQuery(type, filters);
  const exportMutation = useExportReportMutation();
  const scheduleMutation = useScheduleReportMutation();

  const report = query.data as BiReportBase | undefined;
  const chartEntries = useMemo(
    () => Object.entries(report?.charts ?? {}).slice(0, 4),
    [report?.charts],
  );
  const leaderboardEntries = useMemo(
    () => Object.entries(report?.leaderboards ?? {}).slice(0, 4),
    [report?.leaderboards],
  );

  async function onExport(format: 'csv' | 'pdf' | 'excel') {
    try {
      await exportMutation.mutateAsync({ type, format, filters });
      toast.success(`${format.toUpperCase()} downloaded`);
    } catch {
      toast.error('Export failed');
    }
  }

  async function onSchedule() {
    try {
      await scheduleMutation.mutateAsync({
        type,
        format: 'pdf',
        frequency: 'weekly',
        name: `${title} weekly`,
        filters,
      });
      toast.success('Weekly schedule created');
    } catch {
      toast.error('Could not schedule report');
    }
  }

  return (
    <div className="space-y-6 print:bg-white">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <Breadcrumb
            items={[
              { label: 'Home', href: '/dashboard' },
              { label: 'Reports', href: '/reports' },
              { label: title },
            ]}
          />
          <PageHeader title={title} description={description} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => void onExport('csv')} disabled={exportMutation.isPending}>
            <Download className="mr-1.5 h-4 w-4" />
            CSV
          </Button>
          <Button size="sm" variant="outline" onClick={() => void onExport('excel')} disabled={exportMutation.isPending}>
            Excel
          </Button>
          <Button size="sm" onClick={() => void onExport('pdf')} disabled={exportMutation.isPending}>
            PDF
          </Button>
          <Button size="sm" variant="secondary" onClick={() => void onSchedule()} disabled={scheduleMutation.isPending}>
            <CalendarClock className="mr-1.5 h-4 w-4" />
            Schedule
          </Button>
        </div>
      </div>

      <div className="sticky top-0 z-20 -mx-1 border-b border-border/70 bg-background/95 px-1 py-3 backdrop-blur">
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Start</label>
            <Input
              type="date"
              value={draft.startDate ?? ''}
              onChange={(e) => setDraft((prev) => ({ ...prev, startDate: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">End</label>
            <Input
              type="date"
              value={draft.endDate ?? ''}
              onChange={(e) => setDraft((prev) => ({ ...prev, endDate: e.target.value }))}
            />
          </div>
          <div className="min-w-[180px] flex-1">
            <label className="mb-1 block text-xs text-muted-foreground">Search</label>
            <Input
              placeholder="Search routes, trips…"
              value={draft.search ?? ''}
              onChange={(e) => setDraft((prev) => ({ ...prev, search: e.target.value }))}
            />
          </div>
          <Button
            size="sm"
            onClick={() => setFilters(draft)}
          >
            Apply filters
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {REPORT_NAV.map((item) => (
            <Button key={item.href} asChild size="sm" variant={item.type === type ? 'default' : 'outline'}>
              <Link href={item.href}>{item.title}</Link>
            </Button>
          ))}
        </div>
      </div>

      {query.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : query.isError || !report ? (
        <EmptyState title="Report unavailable" description="Could not load this report." />
      ) : (
        <>
          <KPIWidget metrics={report.kpis} />
          <div className="grid gap-4 xl:grid-cols-2">
            {chartEntries.map(([key, data]) => (
              <ChartCard
                key={key}
                title={key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())}
                data={data}
                variant={key.toLowerCase().includes('trend') ? 'line' : 'bar'}
              />
            ))}
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <InsightCard insights={report.insights} />
            <div className="grid gap-4">
              {leaderboardEntries.map(([key, rows]) => (
                <LeaderboardCard
                  key={key}
                  title={key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())}
                  rows={rows}
                />
              ))}
            </div>
          </div>
          {report.table?.rows?.length ? (
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle className="text-base">Detail table</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse text-sm">
                  <thead className="sticky top-0 bg-card">
                    <tr className="border-b text-left text-muted-foreground">
                      {report.table.columns.map((col) => (
                        <th key={col.key} className="px-3 py-2 font-medium">
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {report.table.rows.map((row, index) => (
                      <tr key={index} className="border-b border-border/60">
                        {report.table!.columns.map((col) => (
                          <td key={col.key} className="px-3 py-2 tabular-nums">
                            {String(row[col.key] ?? '—')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          ) : null}
        </>
      )}
    </div>
  );
}
