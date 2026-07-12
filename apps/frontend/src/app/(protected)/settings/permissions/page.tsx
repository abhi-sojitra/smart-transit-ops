'use client';

import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { PermissionMatrix } from '@/components/settings/permission-matrix';
import { SettingsCard } from '@/components/settings/settings-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useAdminRoles,
  usePermissionMatrix,
  useUpdateRoleMutation,
} from '@/hooks/use-admin';

export default function SettingsPermissionsPage() {
  const [search, setSearch] = useState('');
  const [editRoleId, setEditRoleId] = useState<string>('');
  const [selected, setSelected] = useState<string[]>([]);

  const matrixQuery = usePermissionMatrix();
  const rolesQuery = useAdminRoles();
  const updateMutation = useUpdateRoleMutation();

  const editRole = rolesQuery.data?.find((r) => r.id === editRoleId);

  const filteredMatrix = useMemo(() => {
    if (!matrixQuery.data || !search.trim()) return matrixQuery.data;
    const q = search.trim().toLowerCase();
    return {
      ...matrixQuery.data,
      permissions: matrixQuery.data.permissions.filter(
        (p) =>
          p.code.toLowerCase().includes(q) ||
          p.module.toLowerCase().includes(q) ||
          p.action.toLowerCase().includes(q),
      ),
    };
  }, [matrixQuery.data, search]);

  function startEdit(roleId: string) {
    const role = rolesQuery.data?.find((r) => r.id === roleId);
    setEditRoleId(roleId);
    setSelected(role?.permissions.includes('*') ? [] : [...(role?.permissions ?? [])]);
  }

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb
          items={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Settings', href: '/settings' },
            { label: 'Permissions' },
          ]}
        />
        <PageHeader
          title="Permissions"
          description="Module-based permission matrix. Toggle permissions for a selected role."
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Search permissions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
        <Select value={editRoleId} onValueChange={startEdit}>
          <SelectTrigger className="max-w-xs">
            <SelectValue placeholder="Edit role permissions" />
          </SelectTrigger>
          <SelectContent>
            {(rolesQuery.data ?? []).map((role) => (
              <SelectItem key={role.id} value={role.id}>
                {role.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {editRole ? (
          <Button
            disabled={updateMutation.isPending}
            onClick={() =>
              void updateMutation.mutateAsync({
                id: editRole.id,
                payload: { permissions: selected },
              })
            }
          >
            Save {editRole.code.replaceAll('_', ' ')}
          </Button>
        ) : null}
      </div>

      <SettingsCard title="Role matrix" description="● granted · ○ not granted">
        <PermissionMatrix
          matrix={filteredMatrix}
          loading={matrixQuery.isLoading}
          editableRoleCode={editRole?.code}
          selected={selected}
          onToggle={(code, enabled) =>
            setSelected((prev) =>
              enabled ? Array.from(new Set([...prev, code])) : prev.filter((c) => c !== code),
            )
          }
        />
      </SettingsCard>
    </div>
  );
}
