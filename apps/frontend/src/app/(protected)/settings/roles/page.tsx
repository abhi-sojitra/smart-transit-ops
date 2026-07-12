'use client';

import { useState } from 'react';
import { RoleCode } from '@transitops/shared-types';
import { PageHeader } from '@/components/layout/page-header';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { SettingsCard } from '@/components/settings/settings-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/feedback/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useAdminRoles,
  useCloneRoleMutation,
  useUpdateRoleMutation,
} from '@/hooks/use-admin';

export default function SettingsRolesPage() {
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [cloneTarget, setCloneTarget] = useState<RoleCode>(RoleCode.VIEWER);

  const rolesQuery = useAdminRoles(search || undefined);
  const updateMutation = useUpdateRoleMutation();
  const cloneMutation = useCloneRoleMutation();
  const roles = rolesQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb
          items={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Settings', href: '/settings' },
            { label: 'Roles' },
          ]}
        />
        <PageHeader
          title="Roles"
          description="System roles cannot be deleted. Clone permissions between roles."
        />
      </div>

      <Input
        placeholder="Search roles..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />

      {rolesQuery.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      ) : !roles.length ? (
        <EmptyState title="No roles found" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {roles.map((role) => (
            <SettingsCard
              key={role.id}
              title={role.name}
              description={role.description}
              action={
                <Badge status={role.isSystem ? 'ACTIVE' : 'INACTIVE'}>
                  {role.isSystem ? 'SYSTEM' : 'CUSTOM'}
                </Badge>
              }
            >
              <div className="space-y-3 text-sm">
                <p className="text-muted-foreground">
                  Code: <span className="font-medium text-foreground">{role.code}</span>
                </p>
                <p className="text-muted-foreground">
                  Users: <span className="font-medium text-foreground">{role.userCount ?? 0}</span>
                </p>
                <p className="text-muted-foreground">
                  Permissions:{' '}
                  <span className="font-medium text-foreground">
                    {role.permissions.includes('*') ? 'All (*)' : role.permissions.length}
                  </span>
                </p>

                {editingId === role.id ? (
                  <div className="space-y-2 border-t border-border pt-3">
                    <Input
                      placeholder="Description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        disabled={updateMutation.isPending}
                        onClick={() =>
                          void updateMutation.mutateAsync({
                            id: role.id,
                            payload: { description },
                          }).then(() => setEditingId(null))
                        }
                      >
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingId(role.id);
                        setDescription(role.description ?? '');
                      }}
                    >
                      Edit
                    </Button>
                    <Select
                      value={cloneTarget}
                      onValueChange={(v) => setCloneTarget(v as RoleCode)}
                    >
                      <SelectTrigger className="h-8 w-[160px]">
                        <SelectValue placeholder="Clone to" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(RoleCode)
                          .filter((c) => c !== role.code)
                          .map((code) => (
                            <SelectItem key={code} value={code}>
                              {code.replaceAll('_', ' ')}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={cloneMutation.isPending}
                      onClick={() =>
                        void cloneMutation.mutateAsync({
                          id: role.id,
                          targetCode: cloneTarget,
                        })
                      }
                    >
                      Clone perms
                    </Button>
                  </div>
                )}
              </div>
            </SettingsCard>
          ))}
        </div>
      )}
    </div>
  );
}
