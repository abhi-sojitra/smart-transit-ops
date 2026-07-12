'use client';

import { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { PermissionItem } from '@transitops/shared-types';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/utils/cn';

export type PrivilegeViewFilter = 'all' | 'assigned' | 'unassigned';

interface PrivilegeChecklistProps {
  permissions: PermissionItem[];
  selected: string[];
  disabled?: boolean;
  search?: string;
  viewFilter?: PrivilegeViewFilter;
  onToggle: (code: string, enabled: boolean) => void;
  onToggleModule: (module: string, enabled: boolean) => void;
}

/** Title-case labels so catalog codes like FUEL / CREATE read as Fuel / Create. */
function formatLabel(value: string) {
  return value
    .toLowerCase()
    .replaceAll('_', ' ')
    .replaceAll('.', ' · ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function PrivilegeChecklist({
  permissions,
  selected,
  disabled,
  search = '',
  viewFilter = 'all',
  onToggle,
  onToggleModule,
}: PrivilegeChecklistProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const modules = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = permissions.filter((p) => {
      const isAssigned = selectedSet.has(p.code);
      if (viewFilter === 'assigned' && !isAssigned) return false;
      if (viewFilter === 'unassigned' && isAssigned) return false;
      if (!q) return true;
      return (
        p.code.toLowerCase().includes(q) ||
        p.module.toLowerCase().includes(q) ||
        p.action.toLowerCase().includes(q) ||
        (p.description ?? '').toLowerCase().includes(q)
      );
    });

    const map = new Map<string, PermissionItem[]>();
    for (const permission of filtered) {
      const list = map.get(permission.module) ?? [];
      list.push(permission);
      map.set(permission.module, list);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [permissions, search, selectedSet, viewFilter]);

  if (!modules.length) {
    return (
      <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-base font-medium text-slate-700 dark:text-slate-200">
        {viewFilter === 'assigned'
          ? 'No assigned privileges for this role.'
          : viewFilter === 'unassigned'
            ? 'No unassigned privileges — this role has everything in view.'
            : 'No privileges match your search.'}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {modules.map(([module, items]) => {
        const moduleAllCodes = permissions
          .filter((p) => p.module === module)
          .map((p) => p.code);
        const selectedCount = moduleAllCodes.filter((code) => selectedSet.has(code)).length;
        const allOn = selectedCount === moduleAllCodes.length && moduleAllCodes.length > 0;
        const someOn = selectedCount > 0 && !allOn;
        const isCollapsed = collapsed[module] ?? false;

        return (
          <section
            key={module}
            className="overflow-hidden rounded-xl border border-slate-200 bg-card dark:border-slate-700"
          >
            <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/50">
              <Checkbox
                checked={allOn ? true : someOn ? 'indeterminate' : false}
                disabled={disabled}
                onCheckedChange={(value) => onToggleModule(module, value === true)}
                aria-label={`Toggle all ${module} privileges`}
              />
              <button
                type="button"
                className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left"
                onClick={() =>
                  setCollapsed((prev) => ({ ...prev, [module]: !isCollapsed }))
                }
              >
                <div className="min-w-0 flex-1">
                  <p className="text-base font-semibold text-slate-900 dark:text-slate-50">
                    {formatLabel(module)}
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                    {selectedCount} of {moduleAllCodes.length} assigned
                  </p>
                </div>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 shrink-0 text-slate-700 transition-transform dark:text-slate-300',
                    isCollapsed && '-rotate-90',
                  )}
                />
              </button>
            </div>

            {!isCollapsed ? (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((permission) => {
                  const checked = selectedSet.has(permission.code);
                  return (
                    <li key={permission.code}>
                      <div
                        className={cn(
                          'flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/40',
                          disabled && 'opacity-70',
                        )}
                      >
                        <Checkbox
                          className="mt-0.5"
                          checked={checked}
                          disabled={disabled}
                          onCheckedChange={(value) =>
                            onToggle(permission.code, value === true)
                          }
                          aria-label={permission.code}
                        />
                        <button
                          type="button"
                          disabled={disabled}
                          className="min-w-0 flex-1 cursor-pointer text-left disabled:cursor-not-allowed"
                          onClick={() => {
                            if (disabled) return;
                            onToggle(permission.code, !checked);
                          }}
                        >
                          <span className="block text-base font-semibold text-slate-900 dark:text-slate-50">
                            {formatLabel(permission.action)}
                          </span>
                          {permission.description ? (
                            <span className="mt-1 block text-sm font-medium leading-snug text-slate-700 dark:text-slate-300">
                              {permission.description}
                            </span>
                          ) : null}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
