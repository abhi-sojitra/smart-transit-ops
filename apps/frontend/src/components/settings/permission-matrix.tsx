'use client';

import { Fragment } from 'react';
import type { RolePermissionMatrix } from '@transitops/shared-types';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/feedback/empty-state';

interface PermissionMatrixProps {
  matrix?: RolePermissionMatrix;
  loading?: boolean;
  editableRoleCode?: string;
  selected?: string[];
  onToggle?: (code: string, enabled: boolean) => void;
}

export function PermissionMatrix({
  matrix,
  loading,
  editableRoleCode,
  selected = [],
  onToggle,
}: PermissionMatrixProps) {
  if (loading) {
    return <Skeleton className="h-96 w-full rounded-xl" />;
  }

  if (!matrix?.permissions.length) {
    return <EmptyState title="No permissions" description="Permission catalog is empty." />;
  }

  const roleCodes = matrix.roles.map((r) => r.code);
  const modules = Array.from(new Set(matrix.permissions.map((p) => p.module)));

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="sticky left-0 bg-muted/40 px-3 py-2 font-medium">Permission</th>
            {roleCodes.map((code) => (
              <th key={code} className="whitespace-nowrap px-3 py-2 font-medium">
                {code.replaceAll('_', ' ')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {modules.map((module) => (
            <Fragment key={module}>
              <tr className="bg-muted/20">
                <td
                  colSpan={roleCodes.length + 1}
                  className="px-3 py-2 text-xs font-semibold uppercase tracking-wide"
                >
                  {module}
                </td>
              </tr>
              {matrix.permissions
                .filter((p) => p.module === module)
                .map((permission) => (
                  <tr key={permission.code} className="border-t border-border">
                    <td className="sticky left-0 bg-card px-3 py-2">
                      <div className="font-medium">{permission.action}</div>
                      <div className="text-xs text-muted-foreground">{permission.code}</div>
                    </td>
                    {roleCodes.map((code) => {
                      const has =
                        matrix.matrix[code]?.includes('*') ||
                        matrix.matrix[code]?.includes(permission.code);
                      const editable = editableRoleCode === code && onToggle;
                      return (
                        <td key={`${permission.code}-${code}`} className="px-3 py-2 text-center">
                          {editable ? (
                            <Checkbox
                              checked={selected.includes(permission.code)}
                              onCheckedChange={(v) => onToggle(permission.code, Boolean(v))}
                            />
                          ) : (
                            <span
                              className={
                                has
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-muted-foreground/40'
                              }
                            >
                              {has ? '●' : '○'}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
