'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/page-header';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/forms/form-field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/data-table/data-table';
import { DEFAULT_FORM_OPTIONS, FORM_LIMITS, PLACEHOLDERS } from '@/constants/form';
import { mockUsers } from '@/constants/mock-data';
import { sanitizeTextInput } from '@/utils/form-sanitize';
import { enhanceRegister } from '@/utils/form-register';
import { requiredTrimmedString } from '@/utils/form-validation';
import type { ColumnDef } from '@tanstack/react-table';
import type { User } from '@transitops/shared-types';

const generalSettingsSchema = z.object({
  organizationName: requiredTrimmedString('Organization name', FORM_LIMITS.text),
  timezone: requiredTrimmedString('Timezone', FORM_LIMITS.text),
});

type GeneralSettingsValues = z.infer<typeof generalSettingsSchema>;

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
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<GeneralSettingsValues>({
    ...DEFAULT_FORM_OPTIONS,
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      organizationName: 'TransitOps Fleet Co.',
      timezone: 'Asia/Kolkata',
    },
  });

  const onSaveGeneral = handleSubmit(async (values) => {
    toast.success(`Saved settings for ${values.organizationName}`);
  });

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
            <CardContent>
              <form className="grid max-w-xl gap-4" onSubmit={onSaveGeneral} noValidate>
                <FormField
                  label="Organization Name"
                  htmlFor="org"
                  required
                  error={errors.organizationName?.message}
                >
                  <Input
                    id="org"
                    maxLength={FORM_LIMITS.text}
                    placeholder={PLACEHOLDERS.orgName}
                    {...enhanceRegister(register('organizationName'), {
                      transform: (v) => sanitizeTextInput(v, FORM_LIMITS.text),
                    })}
                  />
                </FormField>
                <FormField label="Timezone" htmlFor="tz" required error={errors.timezone?.message}>
                  <Input
                    id="tz"
                    maxLength={FORM_LIMITS.text}
                    placeholder={PLACEHOLDERS.timezone}
                    {...enhanceRegister(register('timezone'), {
                      transform: (v) => sanitizeTextInput(v, FORM_LIMITS.text),
                    })}
                  />
                </FormField>
                <div className="flex items-center gap-3">
                  <Button type="submit" className="w-fit" loading={isSubmitting}>
                    Save changes
                  </Button>
                  {isDirty ? (
                    <p className="text-xs text-muted-foreground">You have unsaved changes.</p>
                  ) : null}
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <DataTable
            columns={columns}
            data={mockUsers}
            searchPlaceholder={PLACEHOLDERS.searchUsers}
          />
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
