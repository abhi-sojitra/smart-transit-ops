'use client';

import { PageHeader } from '@/components/layout/page-header';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { SettingsCard } from '@/components/settings/settings-card';
import { EmptyState } from '@/components/feedback/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuditLogs } from '@/hooks/use-admin';
import { formatDateTime, formatRelativeTime } from '@/components/dashboard/format';

export default function ActivityTimelinePage() {
  const query = useAuditLogs({ page: 1, limit: 40 });
  const items = query.data?.items ?? [];

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb
          items={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Settings', href: '/settings' },
            { label: 'Activity' },
          ]}
        />
        <PageHeader
          title="Activity timeline"
          description="Who did what, when — across modules, with device context."
        />
      </div>

      <SettingsCard title="Recent activity">
        {query.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : !items.length ? (
          <EmptyState title="No activity yet" />
        ) : (
          <ol className="relative space-y-4 border-l border-border pl-6">
            {items.map((item) => (
              <li key={item.id} className="relative">
                <span className="absolute -left-[1.6rem] mt-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
                <div className="rounded-lg border border-border bg-card/60 px-3 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium">{item.summary}</p>
                    <span className="text-[11px] text-muted-foreground">
                      {formatRelativeTime(item.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.actorEmail ?? 'System'} · {item.module} · {item.action}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {formatDateTime(item.createdAt)}
                    {item.ip ? ` · IP ${item.ip}` : ''}
                    {item.browser ? ` · ${item.browser}` : ''}
                    {item.device ? ` · ${item.device}` : ''}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </SettingsCard>
    </div>
  );
}
