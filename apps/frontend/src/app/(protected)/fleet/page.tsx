'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import type { Vehicle } from '@transitops/shared-types';
import { PageHeader } from '@/components/layout/page-header';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/data-table/data-table';
import { mockVehicles } from '@/constants/mock-data';

const columns: ColumnDef<Vehicle>[] = [
  { accessorKey: 'vehicleId', header: 'Vehicle ID' },
  { accessorKey: 'model', header: 'Model' },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <Badge status={row.original.status}>{row.original.status.replaceAll('_', ' ')}</Badge>,
  },
  { accessorKey: 'lastService', header: 'Last Service' },
  {
    accessorKey: 'mileage',
    header: 'Mileage',
    cell: ({ row }) => row.original.mileage.toLocaleString(),
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: () => (
      <div className="flex gap-2">
        <Button variant="outline" size="sm">
          View
        </Button>
        <Button variant="ghost" size="sm">
          Edit
        </Button>
      </div>
    ),
  },
];

export default function FleetPage() {
  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb items={[{ label: 'Home', href: '/dashboard' }, { label: 'Fleet' }]} />
        <PageHeader
          title="Vehicle Registry"
          description="Track fleet assets, status, and service history."
          actions={
            <Button>
              <Plus className="h-4 w-4" />
              Add Vehicle
            </Button>
          }
        />
      </div>
      <DataTable columns={columns} data={mockVehicles} searchPlaceholder="Search vehicles..." searchKey="vehicleId" />
    </div>
  );
}
