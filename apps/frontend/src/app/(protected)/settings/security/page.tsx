'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { SettingsCard } from '@/components/settings/settings-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { FormShell } from '@/components/forms/form-shell';
import { useSecuritySettings, useUpdateSecurityMutation } from '@/hooks/use-admin';

export default function SecuritySettingsPage() {
  const query = useSecuritySettings();
  const mutation = useUpdateSecurityMutation();
  const [form, setForm] = useState({
    minPasswordLength: 8,
    requireUppercase: true,
    requireNumber: true,
    requireSpecialCharacter: true,
    sessionTimeoutMinutes: 60,
    twoFactorReady: true,
    maxLoginAttempts: 5,
    lockDurationMinutes: 30,
  });

  useEffect(() => {
    if (!query.data) return;
    setForm({
      minPasswordLength: query.data.minPasswordLength,
      requireUppercase: query.data.requireUppercase,
      requireNumber: query.data.requireNumber,
      requireSpecialCharacter: query.data.requireSpecialCharacter,
      sessionTimeoutMinutes: query.data.sessionTimeoutMinutes,
      twoFactorReady: query.data.twoFactorReady,
      maxLoginAttempts: query.data.maxLoginAttempts,
      lockDurationMinutes: query.data.lockDurationMinutes,
    });
  }, [query.data]);

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb
          items={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Settings', href: '/settings' },
            { label: 'Security' },
          ]}
        />
        <PageHeader title="Security" description="Password policy, session, and lockout rules." />
      </div>

      <SettingsCard title="Password policy">
        <FormShell fetching={query.isLoading} submitting={mutation.isPending} skeletonFields={6}>
        <form
          className="grid max-w-xl gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            void mutation.mutateAsync(form);
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="minLen">Minimum length</Label>
            <Input
              id="minLen"
              type="number"
              min={6}
              value={form.minPasswordLength}
              onChange={(e) =>
                setForm((f) => ({ ...f, minPasswordLength: Number(e.target.value) }))
              }
            />
          </div>
          {(
            [
              ['requireUppercase', 'Require uppercase'],
              ['requireNumber', 'Require number'],
              ['requireSpecialCharacter', 'Require special character'],
              ['twoFactorReady', 'Two-factor ready'],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form[key]}
                onCheckedChange={(v) => setForm((f) => ({ ...f, [key]: Boolean(v) }))}
              />
              {label}
            </label>
          ))}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Session timeout (min)</Label>
              <Input
                type="number"
                value={form.sessionTimeoutMinutes}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    sessionTimeoutMinutes: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Max login attempts</Label>
              <Input
                type="number"
                value={form.maxLoginAttempts}
                onChange={(e) =>
                  setForm((f) => ({ ...f, maxLoginAttempts: Number(e.target.value) }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Lock duration (min)</Label>
              <Input
                type="number"
                value={form.lockDurationMinutes}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    lockDurationMinutes: Number(e.target.value),
                  }))
                }
              />
            </div>
          </div>
          <Button type="submit" loading={mutation.isPending}>
            Save security settings
          </Button>
        </form>
        </FormShell>
      </SettingsCard>
    </div>
  );
}
