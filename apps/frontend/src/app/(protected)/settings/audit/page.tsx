'use client';

import { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/page-header';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { SettingsCard } from '@/components/settings/settings-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/feedback/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuditLogs } from '@/hooks/use-admin';
import { adminService } from '@/services/admin.service';
import { formatDateTime } from '@/components/dashboard/format';

export default function AuditLogsPage() {
  const [search, setSearch] = useState('');
  const [module, setModule] = useState('ALL');
  const [page, setPage] = useState(1);

  const params = useMemo(
    () => ({
      page,
      limit: 20,
      search: search || undefined,
      module: module === 'ALL' ? undefined : module,
    }),
    [page, search, module],
  );

  const query = useAuditLogs(params);
  const items = query.data?.items ?? [];
  const meta = query.data?.meta;

  async function exportCsv() {
    try {
      const blob = await adminService.exportAudit(params);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'audit-logs.csv';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Audit CSV downloaded');
    } catch {
      toast.error('Export failed');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Breadcrumb
            items={[
              { label: 'Home', href: '/dashboard' },
              { label: 'Settings', href: '/settings' },
              { label: 'Audit Logs' },
            ]}
          />
          <PageHeader title="Audit logs" description="Track admin and security events." />
        </div>
        <Button variant="outline" size="sm" onClick={() => void exportCsv()}>
          <Download className="mr-1.5 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <SettingsCard title="Event log">
        <div className="mb-4 grid gap-3 md:grid-cols-2">
          <Input
            placeholder="Search summary, actor..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <Select
            value={module}
            onValueChange={(v) => {
              setModule(v);
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Module" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All modules</SelectItem>
              {[
                'AUTH',
                'USERS',
                'ROLES',
                'PERMISSIONS',
                'SETTINGS',
                'SECURITY',
                'NOTIFICATIONS',
                'PROFILE',
              ].map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {query.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : !items.length ? (
          <EmptyState title="No audit events" />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">When</th>
                  <th className="px-3 py-2 text-left">Action</th>
                  <th className="px-3 py-2 text-left">Module</th>
                  <th className="px-3 py-2 text-left">Summary</th>
                  <th className="px-3 py-2 text-left">Actor</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-t border-border">
                    <td className="whitespace-nowrap px-3 py-2 text-xs text-muted-foreground">
                      {formatDateTime(item.createdAt)}
                    </td>
                    <td className="px-3 py-2">
                      <Badge>{item.action}</Badge>
                    </td>
                    <td className="px-3 py-2 text-xs">{item.module}</td>
                    <td className="px-3 py-2">{item.summary}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {item.actorEmail ?? item.actorName ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {meta ? (
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Page {meta.page} of {meta.totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}
      </SettingsCard>
    </div>
  );
}
