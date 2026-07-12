'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import type { Driver } from '@transitops/shared-types';
import { PageHeader } from '@/components/layout/page-header';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/data-table/data-table';
import { mockDrivers } from '@/constants/mock-data';

const columns: ColumnDef<Driver>[] = [
  { accessorKey: 'name', header: 'Driver Name' },
  { accessorKey: 'employeeId', header: 'ID' },
  {
    accessorKey: 'licenseStatus',
    header: 'License',
    cell: ({ row }) => (
      <Badge status={row.original.licenseStatus}>{row.original.licenseStatus}</Badge>
    ),
  },
  { accessorKey: 'lastTrip', header: 'Last Trip' },
  {
    accessorKey: 'safetyScore',
    header: 'Safety Score',
    cell: ({ row }) => `${row.original.safetyScore}%`,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <Badge status={row.original.status}>{row.original.status.replaceAll('_', ' ')}</Badge>
    ),
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: () => (
      <Button variant="outline" size="sm">
        View
      </Button>
    ),
  },
];

export default function DriversPage() {
  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb items={[{ label: 'Home', href: '/dashboard' }, { label: 'Drivers' }]} />
        <PageHeader
          title="Drivers & Safety Profiles"
          description="Monitor driver availability, licenses, and safety scores."
          actions={
            <Button>
              <Plus className="h-4 w-4" />
              Add Driver
            </Button>
          }
        />
      </div>
      <DataTable columns={columns} data={mockDrivers} searchPlaceholder="Search drivers..." searchKey="name" />
    </div>
  );
}
