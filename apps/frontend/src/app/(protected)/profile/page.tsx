'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { SettingsCard } from '@/components/settings/settings-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EmptyState } from '@/components/feedback/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { FormShell } from '@/components/forms/form-shell';
import {
  useChangePasswordMutation,
  useProfile,
  useUpdateProfileMutation,
} from '@/hooks/use-admin';
import { formatDateTime } from '@/components/dashboard/format';

export default function ProfilePage() {
  const profileQuery = useProfile();
  const updateMutation = useUpdateProfileMutation();
  const passwordMutation = useChangePasswordMutation();
  const profile = profileQuery.data;

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    avatarUrl: '',
  });
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
  });

  useEffect(() => {
    if (!profile) return;
    setForm({
      firstName: profile.firstName,
      lastName: profile.lastName,
      phone: profile.phone ?? '',
      avatarUrl: profile.avatarUrl ?? '',
    });
  }, [profile]);

  if (profileQuery.isLoading) {
    return <Skeleton className="h-80 w-full rounded-xl" />;
  }

  if (profileQuery.isError || !profile) {
    return (
      <EmptyState
        title="Unable to load profile"
        actionLabel="Retry"
        onAction={() => void profileQuery.refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb
          items={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Profile' },
          ]}
        />
        <PageHeader title="Profile" description="Manage your account details and password." />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SettingsCard title="Account">
          <div className="mb-4 space-y-1 text-sm">
            <p>
              <span className="text-muted-foreground">Email:</span> {profile.email}
            </p>
            <p className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground">Roles:</span>
              {profile.roles.map((role) => (
                <Badge key={role}>{role.replaceAll('_', ' ')}</Badge>
              ))}
            </p>
            <p>
              <span className="text-muted-foreground">Last login:</span>{' '}
              {profile.lastLoginAt ? formatDateTime(profile.lastLoginAt) : '—'}
            </p>
          </div>
          <FormShell submitting={updateMutation.isPending}>
          <form
            className="grid gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              void updateMutation.mutateAsync(form);
            }}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>First name</Label>
                <Input
                  value={form.firstName}
                  onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Last name</Label>
                <Input
                  value={form.lastName}
                  onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Avatar URL</Label>
              <Input
                value={form.avatarUrl}
                onChange={(e) => setForm((f) => ({ ...f, avatarUrl: e.target.value }))}
              />
            </div>
            <Button type="submit" loading={updateMutation.isPending}>
              Save profile
            </Button>
          </form>
          </FormShell>
        </SettingsCard>

        <SettingsCard title="Change password" description="You will need to sign in again after changing password.">
          <FormShell submitting={passwordMutation.isPending}>
          <form
            className="grid gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              void passwordMutation.mutateAsync(passwords).then(() =>
                setPasswords({ currentPassword: '', newPassword: '' }),
              );
            }}
          >
            <div className="space-y-1.5">
              <Label>Current password</Label>
              <Input
                type="password"
                value={passwords.currentPassword}
                onChange={(e) =>
                  setPasswords((p) => ({ ...p, currentPassword: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>New password</Label>
              <Input
                type="password"
                value={passwords.newPassword}
                onChange={(e) =>
                  setPasswords((p) => ({ ...p, newPassword: e.target.value }))
                }
                required
                minLength={8}
              />
            </div>
            <Button type="submit" loading={passwordMutation.isPending}>
              Update password
            </Button>
          </form>
          </FormShell>
        </SettingsCard>
      </div>
    </div>
  );
}
