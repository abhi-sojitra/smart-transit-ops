'use client';

import { useEffect, useMemo, useState } from 'react';
import { RoleCode, UserAccountStatus, type AdminUser } from '@transitops/shared-types';
import { PageHeader } from '@/components/layout/page-header';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { SettingsCard } from '@/components/settings/settings-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/feedback/empty-state';
import { ConfirmationDialog } from '@/components/feedback/confirmation-dialog';
import { FormShell } from '@/components/forms/form-shell';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useAdminRoles,
  useAdminUsers,
  useBulkUserStatusMutation,
  useCreateUserMutation,
  useDeleteUserMutation,
  useUpdateUserMutation,
} from '@/hooks/use-admin';
import { formatDateTime } from '@/components/dashboard/format';

function formatRoleLabel(role: unknown): string {
  if (typeof role === 'string') return role.replaceAll('_', ' ');
  if (role && typeof role === 'object' && 'code' in role) {
    return String((role as { code: string }).code).replaceAll('_', ' ');
  }
  return '—';
}

function roleCodesFromUser(user: AdminUser | Record<string, unknown>): RoleCode[] {
  const roles = (user as AdminUser).roles ?? [];
  return roles
    .map((role) => {
      if (typeof role === 'string') return role as RoleCode;
      if (role && typeof role === 'object' && 'code' in role) {
        return (role as { code: RoleCode }).code;
      }
      return null;
    })
    .filter(Boolean) as RoleCode[];
}

export default function SettingsUsersPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'ALL' | UserAccountStatus>('ALL');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);

  const params = useMemo(
    () => ({
      page,
      limit: 10,
      search: search || undefined,
      status: status === 'ALL' ? undefined : status,
    }),
    [page, search, status],
  );

  const usersQuery = useAdminUsers(params);
  const rolesQuery = useAdminRoles();
  const createMutation = useCreateUserMutation();
  const updateMutation = useUpdateUserMutation();
  const deleteMutation = useDeleteUserMutation();
  const bulkStatusMutation = useBulkUserStatusMutation();

  const items = Array.isArray(usersQuery.data?.items) ? usersQuery.data.items : [];
  const meta = usersQuery.data?.meta;
  const roleOptions = rolesQuery.data?.map((r) => r.code) ?? Object.values(RoleCode);

  function toggleSelect(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function userId(user: AdminUser & { _id?: { toString(): string } }) {
    return user.id || user._id?.toString() || '';
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Breadcrumb
            items={[
              { label: 'Home', href: '/dashboard' },
              { label: 'Settings', href: '/settings' },
              { label: 'Users' },
            ]}
          />
          <PageHeader
            title="Users"
            description="Super Admin can create accounts and assign roles."
          />
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          Add user
        </Button>
      </div>

      {usersQuery.isError ? (
        <EmptyState
          title="Unable to load users"
          description="Check that the backend is running with the Settings module, then retry."
          actionLabel="Retry"
          onAction={() => void usersQuery.refetch()}
        />
      ) : null}

      <SettingsCard title="Directory" description="Search, filter, edit roles, and bulk-update">
        <div className="mb-4 grid gap-3 md:grid-cols-3">
          <Input
            placeholder="Search name, email, phone..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v as typeof status);
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              <SelectItem value={UserAccountStatus.ACTIVE}>Active</SelectItem>
              <SelectItem value={UserAccountStatus.INACTIVE}>Inactive</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!selected.length || bulkStatusMutation.isPending}
              onClick={() =>
                void bulkStatusMutation.mutateAsync({
                  ids: selected,
                  status: UserAccountStatus.ACTIVE,
                })
              }
            >
              Activate
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!selected.length || bulkStatusMutation.isPending}
              onClick={() =>
                void bulkStatusMutation.mutateAsync({
                  ids: selected,
                  status: UserAccountStatus.INACTIVE,
                })
              }
            >
              Deactivate
            </Button>
          </div>
        </div>

        {usersQuery.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : !items.length ? (
          <EmptyState
            title="No users found"
            description="Create the first user or run the backend seed."
            actionLabel="Add user"
            onAction={() => setShowCreate(true)}
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2" />
                  <th className="px-3 py-2 text-left">User</th>
                  <th className="px-3 py-2 text-left">Roles</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Last login</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((user) => {
                  const id = userId(user as AdminUser & { _id?: { toString(): string } });
                  const roles = roleCodesFromUser(user);
                  return (
                    <tr key={id} className="border-t border-border">
                      <td className="px-3 py-2">
                        <Checkbox
                          checked={selected.includes(id)}
                          onCheckedChange={() => toggleSelect(id)}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-medium">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                        {user.phone ? (
                          <div className="text-xs text-muted-foreground">{user.phone}</div>
                        ) : null}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-1">
                          {roles.length
                            ? roles.map((role) => (
                                <Badge key={role} className="text-[10px]">
                                  {formatRoleLabel(role)}
                                </Badge>
                              ))
                            : '—'}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <Badge status={user.status}>{user.status}</Badge>
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : '—'}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditUser(user)}
                          >
                            Edit / roles
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteId(id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {meta ? (
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Page {meta.page} of {meta.totalPages} · {meta.total} users
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

      <CreateUserDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        roles={roleOptions}
        loading={createMutation.isPending}
        onSubmit={async (payload) => {
          await createMutation.mutateAsync(payload);
          setShowCreate(false);
        }}
      />

      <EditUserDialog
        user={editUser}
        roles={roleOptions}
        loading={updateMutation.isPending}
        onOpenChange={(open) => !open && setEditUser(null)}
        onSubmit={async (payload) => {
          if (!editUser) return;
          const id = userId(editUser as AdminUser & { _id?: { toString(): string } });
          await updateMutation.mutateAsync({ id, payload });
          setEditUser(null);
        }}
      />

      <ConfirmationDialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete user?"
        description="This soft-deletes the account. They will no longer be able to sign in."
        variant="danger"
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (!deleteId) return;
          void deleteMutation.mutateAsync(deleteId).then(() => setDeleteId(null));
        }}
      />
    </div>
  );
}

function CreateUserDialog({
  open,
  onOpenChange,
  roles,
  loading,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roles: RoleCode[];
  loading: boolean;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    role: RoleCode.OPERATOR as RoleCode,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add user</DialogTitle>
          <DialogDescription>Create an account and assign a primary role.</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            void onSubmit({
              firstName: form.firstName,
              lastName: form.lastName,
              email: form.email,
              phone: form.phone || undefined,
              password: form.password,
              roles: [form.role],
              status: UserAccountStatus.ACTIVE,
            });
          }}
        >
          <FormShell submitting={loading}>
          <div className="space-y-1.5">
            <Label>First name</Label>
            <Input
              value={form.firstName}
              onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Last name</Label>
            <Input
              value={form.lastName}
              onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select
              value={form.role}
              onValueChange={(v) => setForm((f) => ({ ...f, role: v as RoleCode }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {formatRoleLabel(role)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Temporary password</Label>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              required
              minLength={8}
              placeholder="Min 8 characters"
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" loading={loading} className="w-full">
              Create user
            </Button>
          </div>
          </FormShell>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditUserDialog({
  user,
  roles,
  loading,
  onOpenChange,
  onSubmit,
}: {
  user: AdminUser | null;
  roles: RoleCode[];
  loading: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    status: UserAccountStatus.ACTIVE as UserAccountStatus,
    selectedRoles: [] as RoleCode[],
  });

  useEffect(() => {
    if (!user) return;
    setForm({
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone ?? '',
      status: user.status,
      selectedRoles: roleCodesFromUser(user),
    });
  }, [user]);

  function toggleRole(role: RoleCode) {
    setForm((f) => ({
      ...f,
      selectedRoles: f.selectedRoles.includes(role)
        ? f.selectedRoles.filter((r) => r !== role)
        : [...f.selectedRoles, role],
    }));
  }

  return (
    <Dialog open={Boolean(user)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit user & roles</DialogTitle>
          <DialogDescription>
            {user?.email} — assign one or more roles for this account.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.selectedRoles.length) return;
            void onSubmit({
              firstName: form.firstName,
              lastName: form.lastName,
              phone: form.phone || undefined,
              status: form.status,
              roles: form.selectedRoles,
            });
          }}
        >
          <FormShell submitting={loading}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>First name</Label>
              <Input
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Last name</Label>
              <Input
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                required
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
            <Label>Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, status: v as UserAccountStatus }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UserAccountStatus.ACTIVE}>Active</SelectItem>
                <SelectItem value={UserAccountStatus.INACTIVE}>Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Assigned roles</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {roles.map((role) => (
                <label
                  key={role}
                  className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <Checkbox
                    checked={form.selectedRoles.includes(role)}
                    onCheckedChange={() => toggleRole(role)}
                  />
                  {formatRoleLabel(role)}
                </label>
              ))}
            </div>
            {!form.selectedRoles.length ? (
              <p className="text-xs text-destructive">Select at least one role.</p>
            ) : null}
          </div>
          <Button type="submit" loading={loading} disabled={!form.selectedRoles.length}>
            Save changes
          </Button>
          </FormShell>
        </form>
      </DialogContent>
    </Dialog>
  );
}
