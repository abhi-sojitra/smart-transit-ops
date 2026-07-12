'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { PageHeader } from '@/components/layout/page-header';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { SettingsCard } from '@/components/settings/settings-card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { FormShell } from '@/components/forms/form-shell';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUiStore } from '@/store';
import {
  useAppearanceSettings,
  useUpdateAppearanceMutation,
} from '@/hooks/use-admin';

export default function AppearanceSettingsPage() {
  const { setTheme } = useTheme();
  const setSidebarCollapsed = useUiStore((s) => s.setSidebarCollapsed);
  const query = useAppearanceSettings();
  const mutation = useUpdateAppearanceMutation();
  const [form, setForm] = useState({
    theme: 'dark' as 'light' | 'dark',
    sidebarCollapsed: false,
    compactTables: false,
  });

  useEffect(() => {
    if (!query.data) return;
    setForm({
      theme: query.data.theme === 'light' ? 'light' : 'dark',
      sidebarCollapsed: query.data.sidebarCollapsed,
      compactTables: query.data.compactTables,
    });
  }, [query.data]);

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb
          items={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Settings', href: '/settings' },
            { label: 'Appearance' },
          ]}
        />
        <PageHeader title="Appearance" description="Theme and layout preferences." />
      </div>

      <SettingsCard title="Theme & layout">
        <FormShell fetching={query.isLoading} submitting={mutation.isPending} skeletonFields={3}>
        <div className="grid max-w-md gap-4">
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Theme</p>
            <Select
              value={form.theme}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, theme: v as typeof form.theme }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={form.sidebarCollapsed}
              onCheckedChange={(v) =>
                setForm((f) => ({ ...f, sidebarCollapsed: Boolean(v) }))
              }
            />
            Collapse sidebar by default
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={form.compactTables}
              onCheckedChange={(v) =>
                setForm((f) => ({ ...f, compactTables: Boolean(v) }))
              }
            />
            Compact tables
          </label>
          <Button
            loading={mutation.isPending}
            onClick={() => {
              setTheme(form.theme);
              setSidebarCollapsed(form.sidebarCollapsed);
              void mutation.mutateAsync(form);
            }}
          >
            Save appearance
          </Button>
        </div>
        </FormShell>
      </SettingsCard>
    </div>
  );
}
