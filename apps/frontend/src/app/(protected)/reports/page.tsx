'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import type { ReportFormat, ReportPeriod } from '@transitops/shared-types';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/page-header';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { StatCard } from '@/components/charts/stat-card';
import { Leaderboard } from '@/components/dashboard/leaderboard';
import { formatCurrency, formatDateTime, formatNumber } from '@/components/dashboard/format';
import { EmptyState } from '@/components/feedback/empty-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAnalyticsReports } from '@/hooks/use-dashboard';
import { analyticsService, downloadBlob } from '@/services/dashboard.service';

const PERIODS: ReportPeriod[] = ['daily', 'weekly', 'monthly'];

export default function ReportsPage() {
  const [period, setPeriod] = useState<ReportPeriod>('monthly');
  const [exporting, setExporting] = useState<ReportFormat | null>(null);
  const reportsQuery = useAnalyticsReports(period);
  const payload = reportsQuery.data;
  const summary = payload?.summary;

  async function handleExport(format: ReportFormat) {
    try {
      setExporting(format);
      const file = await analyticsService.exportReport(period, format);
      downloadBlob(file.blob, file.filename);
      toast.success(`${format.toUpperCase()} report downloaded`);
    } catch {
      toast.error('Failed to export report');
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Breadcrumb items={[{ label: 'Home', href: '/dashboard' }, { label: 'Reports' }]} />
          <PageHeader
            title="Reports"
            description="Generate daily, weekly, or monthly business summaries."
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {PERIODS.map((option) => (
            <Button
              key={option}
              size="sm"
              variant={period === option ? 'default' : 'outline'}
              onClick={() => setPeriod(option)}
              className="capitalize"
            >
              {option}
            </Button>
          ))}
          <Button
            size="sm"
            variant="outline"
            disabled={exporting !== null}
            onClick={() => void handleExport('csv')}
          >
            <FileSpreadsheet className="mr-1.5 h-4 w-4" />
            {exporting === 'csv' ? 'Exporting…' : 'CSV'}
          </Button>
          <Button
            size="sm"
            disabled={exporting !== null}
            onClick={() => void handleExport('pdf')}
          >
            <FileText className="mr-1.5 h-4 w-4" />
            {exporting === 'pdf' ? 'Exporting…' : 'PDF'}
          </Button>
        </div>
      </div>

      {reportsQuery.isError ? (
        <EmptyState
          title="Reports unavailable"
          description="Could not load the business summary."
          actionLabel="Retry"
          onAction={() => void reportsQuery.refetch()}
        />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Trips Completed"
          value={summary ? formatNumber(summary.tripsCompleted) : '—'}
          icon={Download}
          loading={reportsQuery.isLoading}
          tone="success"
        />
        <StatCard
          title="Revenue"
          value={summary ? formatCurrency(summary.revenue, true) : '—'}
          icon={FileSpreadsheet}
          loading={reportsQuery.isLoading}
          tone="primary"
        />
        <StatCard
          title="Operational Cost"
          value={summary ? formatCurrency(summary.operationalCost, true) : '—'}
          icon={FileText}
          loading={reportsQuery.isLoading}
          tone="warning"
        />
        <StatCard
          title="Profit"
          value={summary ? formatCurrency(summary.profit, true) : '—'}
          icon={Download}
          loading={reportsQuery.isLoading}
          tone={summary && summary.profit >= 0 ? 'success' : 'danger'}
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Period Summary</CardTitle>
        </CardHeader>
        <CardContent>
          {reportsQuery.isLoading || !summary ? (
            <EmptyState title="Loading summary…" className="py-10" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <SummaryRow label="Period" value={summary.period} />
              <SummaryRow label="Start" value={formatDateTime(summary.periodStart)} />
              <SummaryRow label="End" value={formatDateTime(summary.periodEnd)} />
              <SummaryRow label="Cancelled trips" value={formatNumber(summary.tripsCancelled)} />
              <SummaryRow label="Fuel cost" value={formatCurrency(summary.fuelCost)} />
              <SummaryRow label="Expense cost" value={formatCurrency(summary.expenseCost)} />
              <SummaryRow
                label="Maintenance cost"
                value={formatCurrency(summary.maintenanceCost)}
              />
              <SummaryRow label="Active vehicles" value={formatNumber(summary.activeVehicles)} />
              <SummaryRow label="Active drivers" value={formatNumber(summary.activeDrivers)} />
              <SummaryRow
                label="Utilization"
                value={`${formatNumber(summary.utilizationRate, 1)}%`}
              />
              <SummaryRow
                label="Generated"
                value={payload ? formatDateTime(payload.generatedAt) : '—'}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Leaderboard
        drivers={payload?.topDrivers}
        vehicles={payload?.topVehicles}
        loading={reportsQuery.isLoading}
      />
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 px-3 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold capitalize">{value}</p>
    </div>
  );
}
