'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { SettingsCard } from '@/components/settings/settings-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EmptyState } from '@/components/feedback/empty-state';
import { useCompanySettings, useUpdateCompanyMutation } from '@/hooks/use-admin';

export default function CompanySettingsPage() {
  const query = useCompanySettings();
  const mutation = useUpdateCompanyMutation();
  const [form, setForm] = useState({
    companyName: '',
    email: '',
    phone: '',
    address: '',
    country: '',
    currency: '',
    timezone: '',
    dateFormat: '',
    language: '',
    logoUrl: '',
  });

  useEffect(() => {
    if (!query.data) return;
    setForm({
      companyName: query.data.companyName ?? '',
      email: query.data.email ?? '',
      phone: query.data.phone ?? '',
      address: query.data.address ?? '',
      country: query.data.country ?? '',
      currency: query.data.currency ?? '',
      timezone: query.data.timezone ?? '',
      dateFormat: query.data.dateFormat ?? '',
      language: query.data.language ?? '',
      logoUrl: query.data.logoUrl ?? '',
    });
  }, [query.data]);

  if (query.isError) {
    return (
      <EmptyState
        title="Unable to load company settings"
        actionLabel="Retry"
        onAction={() => void query.refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb
          items={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Settings', href: '/settings' },
            { label: 'Company' },
          ]}
        />
        <PageHeader title="Company settings" description="Organization identity and locale." />
      </div>

      <SettingsCard title="Organization" description="Shown across invoices and reports">
        <form
          className="grid max-w-2xl gap-4 md:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            void mutation.mutateAsync(form);
          }}
        >
          {(
            [
              ['companyName', 'Company name'],
              ['email', 'Email'],
              ['phone', 'Phone'],
              ['address', 'Address'],
              ['country', 'Country'],
              ['currency', 'Currency'],
              ['timezone', 'Timezone'],
              ['dateFormat', 'Date format'],
              ['language', 'Language'],
              ['logoUrl', 'Logo URL'],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="space-y-1.5">
              <Label htmlFor={key}>{label}</Label>
              <Input
                id={key}
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              />
            </div>
          ))}
          <div className="md:col-span-2">
            <Button type="submit" disabled={mutation.isPending || query.isLoading}>
              {mutation.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </form>
      </SettingsCard>
    </div>
  );
}
