'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ColumnDef } from '@tanstack/react-table';
import type { MaintenanceRecord } from '@transitops/shared-types';
import { PageHeader } from '@/components/layout/page-header';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/forms/form-field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/data-table/data-table';
import { mockMaintenance } from '@/constants/mock-data';

const schema = z.object({
  vehicleId: z.string().min(1, 'Vehicle is required'),
  serviceType: z.string().min(1, 'Service type is required'),
  cost: z.string().min(1, 'Cost is required'),
  date: z.string().min(1, 'Date is required'),
  notes: z.string().optional(),
});

type Values = z.infer<typeof schema>;

const columns: ColumnDef<MaintenanceRecord>[] = [
  { accessorKey: 'vehicleId', header: 'Vehicle ID' },
  { accessorKey: 'serviceType', header: 'Service Type' },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <Badge status={row.original.status}>{row.original.status.replaceAll('_', ' ')}</Badge>
    ),
  },
  { accessorKey: 'date', header: 'Date' },
  {
    accessorKey: 'cost',
    header: 'Cost',
    cell: ({ row }) => `$${row.original.cost.toFixed(2)}`,
  },
];

export default function MaintenancePage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<Values>({
    resolver: zodResolver(schema),
  });

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb items={[{ label: 'Home', href: '/dashboard' }, { label: 'Maintenance' }]} />
        <PageHeader
          title="Maintenance"
          description="Log service work and track upcoming tasks."
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1.4fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New Maintenance Entry</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={handleSubmit(() => {
                reset();
              })}
            >
              <FormField label="Vehicle ID" htmlFor="vehicleId" error={errors.vehicleId?.message}>
                <Input id="vehicleId" placeholder="VH-1001" {...register('vehicleId')} />
              </FormField>
              <FormField
                label="Service Type"
                htmlFor="serviceType"
                error={errors.serviceType?.message}
              >
                <Input id="serviceType" placeholder="Oil Change" {...register('serviceType')} />
              </FormField>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Cost" htmlFor="cost" error={errors.cost?.message}>
                  <Input id="cost" placeholder="420" {...register('cost')} />
                </FormField>
                <FormField label="Date" htmlFor="date" error={errors.date?.message}>
                  <Input id="date" type="date" {...register('date')} />
                </FormField>
              </div>
              <FormField label="Notes" htmlFor="notes" description="Optional service notes">
                <Textarea id="notes" {...register('notes')} />
              </FormField>
              <Button type="submit" className="w-full">
                Save Entry
              </Button>
            </form>
          </CardContent>
        </Card>

        <div>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">Upcoming & History</h2>
          <DataTable columns={columns} data={mockMaintenance} searchPlaceholder="Search maintenance..." />
        </div>
      </div>
    </div>
  );
}
