'use client';

import { useMemo, useState } from 'react';
import { Check, ChevronDown, Minus } from 'lucide-react';
import type { PermissionItem } from '@transitops/shared-types';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/utils/cn';

interface PrivilegeChecklistProps {
  permissions: PermissionItem[];
  selected: string[];
  disabled?: boolean;
  search?: string;
  onToggle: (code: string, enabled: boolean) => void;
  onToggleModule: (module: string, enabled: boolean) => void;
}

function formatLabel(value: string) {
  return value.replaceAll('_', ' ').replaceAll('.', ' · ');
}

export function PrivilegeChecklist({
  permissions,
  selected,
  disabled,
  search = '',
  onToggle,
  onToggleModule,
}: PrivilegeChecklistProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const modules = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = permissions.filter((p) => {
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
  }, [permissions, search]);

  if (!modules.length) {
    return (
      <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
        No privileges match your search.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {modules.map(([module, items]) => {
        const codes = items.map((p) => p.code);
        const selectedCount = codes.filter((code) => selected.includes(code)).length;
        const allOn = selectedCount === codes.length && codes.length > 0;
        const someOn = selectedCount > 0 && !allOn;
        const isCollapsed = collapsed[module] ?? false;

        return (
          <section
            key={module}
            className="overflow-hidden rounded-xl border border-border bg-card"
          >
            <div className="flex items-center gap-3 border-b border-border bg-muted/30 px-4 py-3">
              <Checkbox
                checked={allOn ? true : someOn ? 'indeterminate' : false}
                disabled={disabled}
                onCheckedChange={(value) => onToggleModule(module, Boolean(value))}
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
                  <p className="text-sm font-semibold capitalize">{formatLabel(module)}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedCount} of {codes.length} privileges selected
                  </p>
                </div>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
                    isCollapsed && '-rotate-90',
                  )}
                />
              </button>
            </div>

            {!isCollapsed ? (
              <ul className="divide-y divide-border">
                {items.map((permission) => {
                  const checked = selected.includes(permission.code);
                  return (
                    <li key={permission.code}>
                      <label
                        className={cn(
                          'flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/30',
                          disabled && 'cursor-not-allowed opacity-70',
                        )}
                      >
                        <Checkbox
                          className="mt-0.5"
                          checked={checked}
                          disabled={disabled}
                          onCheckedChange={(value) =>
                            onToggle(permission.code, Boolean(value))
                          }
                          aria-label={permission.code}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium capitalize">
                              {formatLabel(permission.action)}
                            </span>
                            {checked ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                                <Check className="h-3 w-3" />
                                Allowed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                <Minus className="h-3 w-3" />
                                Not allowed
                              </span>
                            )}
                          </span>
                          <span className="mt-1 block text-xs text-muted-foreground">
                            {permission.description || permission.code}
                          </span>
                          <span className="mt-1 block font-mono text-[11px] text-muted-foreground/80">
                            {permission.code}
                          </span>
                        </span>
                      </label>
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
