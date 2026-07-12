'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { SettingsCard } from '@/components/settings/settings-card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  useNotificationSettings,
  useUpdateNotificationsMutation,
} from '@/hooks/use-admin';

const TOGGLES = [
  ['licenseExpiry', 'License expiry'],
  ['tripCompleted', 'Trip completed'],
  ['maintenanceDue', 'Maintenance due'],
  ['fuelReminder', 'Fuel reminder'],
  ['expenseApproval', 'Expense approval'],
  ['newUser', 'New user'],
  ['roleChanges', 'Role changes'],
] as const;

export default function NotificationSettingsPage() {
  const query = useNotificationSettings();
  const mutation = useUpdateNotificationsMutation();
  const [form, setForm] = useState({
    channels: { email: true, inApp: true },
    licenseExpiry: true,
    tripCompleted: true,
    maintenanceDue: true,
    fuelReminder: true,
    expenseApproval: true,
    newUser: true,
    roleChanges: true,
  });

  useEffect(() => {
    if (!query.data) return;
    setForm({
      channels: {
        email: query.data.channels?.email ?? true,
        inApp: query.data.channels?.inApp ?? true,
      },
      licenseExpiry: query.data.licenseExpiry,
      tripCompleted: query.data.tripCompleted,
      maintenanceDue: query.data.maintenanceDue,
      fuelReminder: query.data.fuelReminder,
      expenseApproval: query.data.expenseApproval,
      newUser: query.data.newUser,
      roleChanges: query.data.roleChanges,
    });
  }, [query.data]);

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb
          items={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Settings', href: '/settings' },
            { label: 'Notifications' },
          ]}
        />
        <PageHeader
          title="Notifications"
          description="Choose channels and which events should notify your team."
        />
      </div>

      <SettingsCard title="Channels">
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={form.channels.email}
              onCheckedChange={(v) =>
                setForm((f) => ({ ...f, channels: { ...f.channels, email: Boolean(v) } }))
              }
            />
            Email
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={form.channels.inApp}
              onCheckedChange={(v) =>
                setForm((f) => ({ ...f, channels: { ...f.channels, inApp: Boolean(v) } }))
              }
            />
            In-app
          </label>
        </div>
      </SettingsCard>

      <SettingsCard title="Events">
        <div className="grid gap-3 sm:grid-cols-2">
          {TOGGLES.map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form[key]}
                onCheckedChange={(v) => setForm((f) => ({ ...f, [key]: Boolean(v) }))}
              />
              {label}
            </label>
          ))}
        </div>
        <Button
          className="mt-4"
          disabled={mutation.isPending}
          onClick={() => void mutation.mutateAsync(form)}
        >
          {mutation.isPending ? 'Saving…' : 'Save notifications'}
        </Button>
      </SettingsCard>
    </div>
  );
}
