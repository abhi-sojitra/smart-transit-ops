'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { User } from '@transitops/shared-types';
import { PageHeader } from '@/components/layout/page-header';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/forms/form-field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/data-table/data-table';
import { mockUsers } from '@/constants/mock-data';

const columns: ColumnDef<User>[] = [
  {
    id: 'name',
    header: 'User',
    cell: ({ row }) => `${row.original.firstName} ${row.original.lastName}`,
  },
  { accessorKey: 'email', header: 'Email' },
  {
    accessorKey: 'roles',
    header: 'Role',
    cell: ({ row }) => row.original.roles.join(', '),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <Badge status={row.original.status}>{row.original.status}</Badge>,
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: () => (
      <Button variant="outline" size="sm">
        Edit
      </Button>
    ),
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb items={[{ label: 'Home', href: '/dashboard' }, { label: 'Settings' }]} />
        <PageHeader
          title="Settings & RBAC"
          description="Manage organization preferences, users, and roles."
        />
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">General Settings</CardTitle>
            </CardHeader>
            <CardContent className="grid max-w-xl gap-4">
              <FormField label="Organization Name" htmlFor="org">
                <Input id="org" defaultValue="TransitOps Fleet Co." />
              </FormField>
              <FormField label="Timezone" htmlFor="tz">
                <Input id="tz" defaultValue="America/Chicago" />
              </FormField>
              <Button className="w-fit">Save changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <DataTable columns={columns} data={mockUsers} searchPlaceholder="Search users..." />
        </TabsContent>

        <TabsContent value="roles">
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              Role definitions are seeded on the backend (`SUPER_ADMIN`, `ADMIN`, `DISPATCHER`,
              and more). Permission editing will be wired when RBAC APIs are implemented.
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              Notification preferences scaffold — email and in-app alerts coming soon.
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
