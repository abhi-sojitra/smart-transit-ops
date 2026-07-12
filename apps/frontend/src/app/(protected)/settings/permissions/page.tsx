'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CheckCheck,
  Eraser,
  RotateCcw,
  Save,
  Search,
  Shield,
  ShieldAlert,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import {
  PrivilegeChecklist,
  type PrivilegeViewFilter,
} from '@/components/settings/privilege-checklist';
import { SettingsCard } from '@/components/settings/settings-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/feedback/empty-state';
import { cn } from '@/utils/cn';
import {
  useAdminRoles,
  usePermissionMatrix,
  useUpdateRoleMutation,
} from '@/hooks/use-admin';

function samePermissionSet(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  const left = [...a].sort();
  const right = [...b].sort();
  return left.every((value, index) => value === right[index]);
}

/** Keep only real catalog codes; expand "*" to every catalog permission. */
function normalizeGranted(raw: string[] | undefined, catalogCodes: string[]): string[] {
  const catalog = new Set(catalogCodes);
  const source = raw ?? [];
  if (source.includes('*')) return [...catalogCodes];
  return source.filter((code) => catalog.has(code));
}

export default function SettingsPermissionsPage() {
  const [search, setSearch] = useState('');
  const [viewFilter, setViewFilter] = useState<PrivilegeViewFilter>('assigned');
  const [editRoleId, setEditRoleId] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [baseline, setBaseline] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);

  const matrixQuery = usePermissionMatrix();
  const rolesQuery = useAdminRoles();
  const updateMutation = useUpdateRoleMutation();

  const roles = rolesQuery.data ?? [];
  const catalog = matrixQuery.data?.permissions ?? [];
  const matrixMap = matrixQuery.data?.matrix ?? {};
  const allCodes = useMemo(() => catalog.map((p) => p.code), [catalog]);
  const catalogReady = allCodes.length > 0;

  const editRole = roles.find((role) => role.id === editRoleId);
  const isFullAccess = Boolean(editRole?.permissions.includes('*'));

  const grantedForRole = (rolePermissions: string[]) =>
    normalizeGranted(rolePermissions, allCodes);

  const totalPermissions = allCodes.length;
  const grantedCount = isFullAccess ? totalPermissions : selected.length;
  const notAssignedCount = Math.max(totalPermissions - grantedCount, 0);
  const dirty =
    Boolean(editRole) && !isFullAccess && !samePermissionSet(selected, baseline);
  const allSelected =
    !isFullAccess && totalPermissions > 0 && selected.length === totalPermissions;

  function resolveRolePermissions(role: { code: string; permissions: string[] }) {
    // Prefer matrix payload when present so UI matches /permissions/matrix.
    const fromMatrix = matrixMap[role.code];
    return normalizeGranted(fromMatrix ?? role.permissions, allCodes);
  }

  function applyRoleSelection(roleId: string) {
    const role = roles.find((item) => item.id === roleId);
    if (!role) return;
    setEditRoleId(roleId);
    const next = role.permissions.includes('*')
      ? [...allCodes]
      : resolveRolePermissions(role);
    setSelected(next);
    setBaseline(next);
    setSearch('');
    setViewFilter('assigned');
  }

  // Pick a sensible default role once data is ready (prefer partial roles, not Admin-with-everything).
  useEffect(() => {
    if (initialized || !roles.length || !catalogReady) return;
    const preferred =
      roles.find((role) => role.code === 'DISPATCHER') ??
      roles.find((role) => role.code === 'VIEWER') ??
      roles.find(
        (role) =>
          !role.permissions.includes('*') &&
          grantedForRole(role.permissions).length < allCodes.length,
      ) ??
      roles.find((role) => !role.permissions.includes('*')) ??
      roles[0];
    if (!preferred) return;
    applyRoleSelection(preferred.id);
    setInitialized(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roles, catalogReady, initialized]);

  // Keep selection in sync when catalog/matrix/roles refresh (skip while dirty).
  useEffect(() => {
    if (!editRole || !catalogReady || dirty) return;
    const next = editRole.permissions.includes('*')
      ? [...allCodes]
      : resolveRolePermissions(editRole);
    if (!samePermissionSet(next, selected)) {
      setSelected(next);
      setBaseline(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editRole, catalogReady, matrixMap, allCodes, dirty]);

  function discardChanges() {
    setSelected([...baseline]);
  }

  async function saveChanges() {
    if (!editRole || isFullAccess) return;
    const payload = selected.filter((code) => allCodes.includes(code));
    await updateMutation.mutateAsync({
      id: editRole.id,
      payload: { permissions: payload },
    });
    setSelected(payload);
    setBaseline(payload);
  }

  function togglePermission(code: string, enabled: boolean) {
    setSelected((prev) => {
      if (enabled) {
        if (prev.includes(code)) return prev;
        return [...prev, code];
      }
      return prev.filter((item) => item !== code);
    });
  }

  function toggleModule(module: string, enabled: boolean) {
    const codes = catalog.filter((p) => p.module === module).map((p) => p.code);
    setSelected((prev) => {
      if (enabled) return Array.from(new Set([...prev, ...codes]));
      return prev.filter((code) => !codes.includes(code));
    });
  }

  function selectAllPermissions() {
    setSelected([...allCodes]);
  }

  function clearAllPermissions() {
    setSelected([]);
  }

  return (
    <div className="space-y-6 pb-28">
      <div>
        <Breadcrumb
          items={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Settings', href: '/settings' },
            { label: 'Permissions' },
          ]}
        />
        <PageHeader
          title="Role privileges"
          description="Assigned privileges are checked. Use filters to inspect not-assigned privileges, then save."
          actions={
            <Button asChild variant="outline">
              <Link href="/settings/roles">Back to roles</Link>
            </Button>
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="space-y-3 lg:sticky lg:top-4 lg:self-start">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Roles
          </p>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            {rolesQuery.isLoading || matrixQuery.isLoading ? (
              <div className="space-y-2 p-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : !roles.length ? (
              <EmptyState title="No roles" className="py-8" />
            ) : (
              <ul className="divide-y divide-border">
                {roles.map((role) => {
                  const active = role.id === editRoleId;
                  const full =
                    role.permissions.includes('*') ||
                    Boolean(matrixMap[role.code]?.includes('*'));
                  const assigned = full
                    ? totalPermissions
                    : resolveRolePermissions(role).length;
                  const missing = Math.max(totalPermissions - assigned, 0);
                  const assignedModules = full
                    ? 'All modules'
                    : (() => {
                        const codes = new Set(resolveRolePermissions(role));
                        const modules = Array.from(
                          new Set(
                            catalog
                              .filter((p) => codes.has(p.code))
                              .map((p) => p.module),
                          ),
                        );
                        return modules.length
                          ? modules.slice(0, 3).join(', ') +
                              (modules.length > 3 ? ` +${modules.length - 3}` : '')
                          : 'No modules';
                      })();
                  return (
                    <li key={role.id}>
                      <button
                        type="button"
                        onClick={() => applyRoleSelection(role.id)}
                        className={cn(
                          'flex w-full cursor-pointer items-start gap-3 px-3 py-3 text-left transition-colors',
                          active ? 'bg-primary/10' : 'hover:bg-muted/40',
                        )}
                      >
                        <span
                          className={cn(
                            'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                            active
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground',
                          )}
                        >
                          <Shield className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="truncate text-sm font-semibold">{role.name}</span>
                            {full ? <Badge className="text-[10px]">Full</Badge> : null}
                          </span>
                          <span className="mt-1 block text-[11px] leading-relaxed text-muted-foreground">
                            {full ? (
                              'All privileges assigned'
                            ) : (
                              <>
                                <span className="font-medium text-emerald-700 dark:text-emerald-400">
                                  {assigned} assigned
                                </span>
                                <span className="mx-1 text-border">·</span>
                                <span className="font-medium text-muted-foreground">
                                  {missing} not assigned
                                </span>
                              </>
                            )}
                          </span>
                          {!full ? (
                            <span className="mt-1 block truncate text-[10px] text-muted-foreground/90">
                              {assignedModules}
                            </span>
                          ) : null}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>

        <div className="min-w-0 space-y-4">
          {!editRole ? (
            <SettingsCard
              title="Select a role"
              description="Choose a role on the left to edit privileges."
            >
              <EmptyState
                title="No role selected"
                description="Pick Dispatcher or Viewer to see assigned vs not-assigned privileges clearly."
                className="py-12"
              />
            </SettingsCard>
          ) : (
            <>
              <SettingsCard
                title={editRole.name}
                description={
                  editRole.description ||
                  'Only checked privileges are assigned to this role.'
                }
                action={
                  <Badge status={isFullAccess ? 'ACTIVE' : 'PENDING'}>
                    {isFullAccess
                      ? 'FULL ACCESS'
                      : `${grantedCount} assigned / ${notAssignedCount} not`}
                  </Badge>
                }
              >
                {isFullAccess ? (
                  <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                      <p className="font-semibold">This role has unrestricted access</p>
                      <p className="mt-1 text-xs opacity-90">
                        Roles with <code className="font-mono">*</code> always have every
                        privilege. Choose Dispatcher, Viewer, or another limited role to
                        assign or remove privileges.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <div className="relative min-w-0 flex-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          className="pl-9"
                          placeholder="Search privileges…"
                          value={search}
                          onChange={(event) => setSearch(event.target.value)}
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={
                            allSelected ||
                            totalPermissions === 0 ||
                            updateMutation.isPending
                          }
                          onClick={selectAllPermissions}
                        >
                          <CheckCheck className="h-3.5 w-3.5" />
                          Select all
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={
                            selected.length === 0 ||
                            totalPermissions === 0 ||
                            updateMutation.isPending
                          }
                          onClick={clearAllPermissions}
                        >
                          <Eraser className="h-3.5 w-3.5" />
                          Clear all
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {(
                        [
                          { id: 'all', label: `All (${totalPermissions})` },
                          { id: 'assigned', label: `Assigned (${grantedCount})` },
                          {
                            id: 'unassigned',
                            label: `Not assigned (${notAssignedCount})`,
                          },
                        ] as const
                      ).map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setViewFilter(item.id)}
                          className={cn(
                            'cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                            viewFilter === item.id
                              ? 'border-foreground bg-foreground text-background'
                              : 'border-border bg-background text-muted-foreground hover:text-foreground',
                          )}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                      <span>
                        {grantedCount} assigned · {notAssignedCount} not assigned
                        {dirty ? ' · unsaved changes' : ''}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={!dirty || updateMutation.isPending}
                          onClick={discardChanges}
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Discard
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          disabled={!dirty || updateMutation.isPending}
                          loading={updateMutation.isPending}
                          onClick={() => void saveChanges()}
                        >
                          <Save className="h-3.5 w-3.5" />
                          Save
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </SettingsCard>

              <SettingsCard
                title="Privileges"
                description="Only assigned privileges are listed by default. Switch to “Not assigned” or “All” to grant more."
              >
                {matrixQuery.isLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <Skeleton key={index} className="h-40 w-full rounded-xl" />
                    ))}
                  </div>
                ) : (
                  <PrivilegeChecklist
                    permissions={catalog}
                    selected={isFullAccess ? allCodes : selected}
                    disabled={isFullAccess}
                    search={search}
                    viewFilter={isFullAccess ? 'all' : viewFilter}
                    onToggle={togglePermission}
                    onToggleModule={toggleModule}
                  />
                )}
              </SettingsCard>
            </>
          )}
        </div>
      </div>

      {dirty ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
            <p className="text-sm">
              <span className="font-semibold">{editRole?.name}</span>
              <span className="text-muted-foreground">
                {' '}
                · {grantedCount} assigned · {notAssignedCount} not assigned · unsaved
              </span>
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllPermissions}
                disabled={selected.length === 0 || updateMutation.isPending}
              >
                Clear all
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={selectAllPermissions}
                disabled={allSelected || updateMutation.isPending}
              >
                Select all
              </Button>
              <Button variant="outline" onClick={discardChanges} disabled={updateMutation.isPending}>
                Discard
              </Button>
              <Button loading={updateMutation.isPending} onClick={() => void saveChanges()}>
                <Save className="h-4 w-4" />
                Save privileges
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
