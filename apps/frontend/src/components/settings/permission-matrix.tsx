'use client';

import { Fragment, useMemo } from 'react';
import { Check, Minus, Shield } from 'lucide-react';
import type { RolePermissionMatrix } from '@transitops/shared-types';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/feedback/empty-state';
import { cn } from '@/utils/cn';

interface PermissionMatrixProps {
  matrix?: RolePermissionMatrix;
  loading?: boolean;
  editableRoleCode?: string;
  selected?: string[];
  moduleFilter?: string | 'ALL';
  onSelectRole?: (roleCode: string) => void;
  onToggle?: (code: string, enabled: boolean) => void;
  onToggleModule?: (module: string, enabled: boolean) => void;
}

function formatLabel(value: string) {
  return value.replaceAll('_', ' ').replaceAll('.', ' · ');
}

function roleHasPermission(
  matrix: RolePermissionMatrix,
  roleCode: string,
  permissionCode: string,
) {
  const granted = matrix.matrix[roleCode] ?? [];
  return granted.includes('*') || granted.includes(permissionCode);
}

function roleIsFullAccess(matrix: RolePermissionMatrix, roleCode: string) {
  return (matrix.matrix[roleCode] ?? []).includes('*');
}

export function PermissionMatrix({
  matrix,
  loading,
  editableRoleCode,
  selected = [],
  moduleFilter = 'ALL',
  onSelectRole,
  onToggle,
  onToggleModule,
}: PermissionMatrixProps) {
  const modules = useMemo(() => {
    if (!matrix?.permissions.length) return [] as string[];
    const all = Array.from(new Set(matrix.permissions.map((p) => p.module)));
    if (moduleFilter === 'ALL') return all;
    return all.filter((m) => m === moduleFilter);
  }, [matrix, moduleFilter]);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-[28rem] w-full rounded-xl" />
      </div>
    );
  }

  if (!matrix?.permissions.length) {
    return (
      <EmptyState
        title="No permissions found"
        description="The permission catalog is empty or your search matched nothing."
      />
    );
  }

  const roleCodes = matrix.roles.map((r) => r.code);
  const editableIsFullAccess = editableRoleCode
    ? roleIsFullAccess(matrix, editableRoleCode)
    : false;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-center gap-4 border-b border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-700">
            <Check className="h-3 w-3" />
          </span>
          Allowed
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <Minus className="h-3 w-3" />
          </span>
          Not allowed
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm ring-2 ring-primary ring-offset-1 ring-offset-background" />
          Editing this role
        </span>
      </div>

      <div className="max-h-[min(70vh,44rem)] overflow-auto">
        <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
          <thead className="sticky top-0 z-20">
            <tr>
              <th className="sticky left-0 z-30 min-w-[220px] border-b border-border bg-card px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Permission
              </th>
              {matrix.roles.map((role) => {
                const active = editableRoleCode === role.code;
                const fullAccess = roleIsFullAccess(matrix, role.code);
                const count = fullAccess
                  ? matrix.permissions.length
                  : (matrix.matrix[role.code] ?? []).length;
                return (
                  <th
                    key={role.code}
                    className={cn(
                      'min-w-[132px] border-b border-border bg-card px-2 py-3 text-center align-bottom',
                      active && 'bg-primary/5',
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => onSelectRole?.(role.code)}
                      className={cn(
                        'mx-auto flex w-full max-w-[140px] cursor-pointer flex-col items-center gap-1 rounded-lg px-2 py-2 transition-colors',
                        active
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'hover:bg-muted',
                        onSelectRole ? '' : 'cursor-default',
                      )}
                      disabled={!onSelectRole}
                    >
                      <span className="text-[11px] font-semibold leading-tight">
                        {role.name}
                      </span>
                      <span
                        className={cn(
                          'text-[10px] tabular-nums',
                          active ? 'text-primary-foreground/80' : 'text-muted-foreground',
                        )}
                      >
                        {fullAccess ? 'Full access' : `${count} granted`}
                      </span>
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {modules.map((module) => {
              const modulePermissions = matrix.permissions.filter((p) => p.module === module);
              const moduleCodes = modulePermissions.map((p) => p.code);
              const selectedInModule = moduleCodes.filter((code) => selected.includes(code));
              const allSelected =
                Boolean(editableRoleCode) &&
                !editableIsFullAccess &&
                moduleCodes.length > 0 &&
                selectedInModule.length === moduleCodes.length;
              const someSelected =
                Boolean(editableRoleCode) &&
                !editableIsFullAccess &&
                selectedInModule.length > 0 &&
                !allSelected;

              return (
                <Fragment key={module}>
                  <tr className="bg-muted/40">
                    <td
                      colSpan={roleCodes.length + 1}
                      className="sticky left-0 border-y border-border px-4 py-2.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-xs font-semibold uppercase tracking-wide">
                            {formatLabel(module)}
                          </span>
                          <span className="rounded-full bg-background px-2 py-0.5 text-[10px] tabular-nums text-muted-foreground">
                            {modulePermissions.length}
                          </span>
                        </div>
                        {editableRoleCode && onToggleModule && !editableIsFullAccess ? (
                          <button
                            type="button"
                            className="cursor-pointer text-xs font-medium text-primary hover:underline"
                            onClick={() => onToggleModule(module, !allSelected)}
                          >
                            {allSelected
                              ? 'Clear module'
                              : someSelected
                                ? 'Grant remaining'
                                : 'Grant all in module'}
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                  {modulePermissions.map((permission) => (
                    <tr key={permission.code} className="group hover:bg-muted/20">
                      <td className="sticky left-0 z-10 border-b border-border bg-card px-4 py-3 group-hover:bg-muted/20">
                        <div className="font-medium capitalize leading-snug">
                          {formatLabel(permission.action)}
                        </div>
                        {permission.description ? (
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                            {permission.description}
                          </p>
                        ) : (
                          <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                            {permission.code}
                          </p>
                        )}
                      </td>
                      {roleCodes.map((code) => {
                        const fullAccess = roleIsFullAccess(matrix, code);
                        const has = roleHasPermission(matrix, code, permission.code);
                        const editable =
                          editableRoleCode === code && onToggle && !fullAccess;
                        const isEditingColumn = editableRoleCode === code;

                        return (
                          <td
                            key={`${permission.code}-${code}`}
                            className={cn(
                              'border-b border-border px-2 py-3 text-center',
                              isEditingColumn && 'bg-primary/5',
                            )}
                          >
                            {editable ? (
                              <div className="flex justify-center">
                                <Checkbox
                                  checked={selected.includes(permission.code)}
                                  onCheckedChange={(v) =>
                                    onToggle(permission.code, Boolean(v))
                                  }
                                  aria-label={`Toggle ${permission.code} for ${code}`}
                                />
                              </div>
                            ) : fullAccess || has ? (
                              <span
                                className="mx-auto inline-flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/12 text-emerald-700"
                                title={fullAccess ? 'Full access (*)' : 'Granted'}
                              >
                                <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                              </span>
                            ) : (
                              <span
                                className="mx-auto inline-flex h-7 w-7 items-center justify-center rounded-md bg-muted/70 text-muted-foreground/50"
                                title="Not granted"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
