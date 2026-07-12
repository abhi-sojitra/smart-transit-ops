'use client';

import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { MaintenanceForm, MaintenanceFormSkeleton } from '@/components/maintenance';
import { EmptyState } from '@/components/feedback/empty-state';
import { useCreateMaintenance, useMaintenanceVehicles } from '@/hooks/use-maintenance';
import type { MaintenanceFormValues } from '@/types/maintenance';

export default function NewMaintenancePage() {
  const router = useRouter();
  const vehiclesQuery = useMaintenanceVehicles();
  const createMutation = useCreateMaintenance();

  if (vehiclesQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Breadcrumb
            items={[
              { label: 'Home', href: '/dashboard' },
              { label: 'Maintenance', href: '/maintenance' },
              { label: 'New' },
            ]}
          />
          <PageHeader
            title="Create Maintenance"
            description="Opening a work order moves the vehicle In Shop and blocks trip assignment."
          />
        </div>
        <MaintenanceFormSkeleton />
      </div>
    );
  }

  if (vehiclesQuery.isError) {
    return (
      <EmptyState
        title="Unable to load vehicles"
        description="Maintenance forms require the vehicle lookup endpoint."
        actionLabel="Retry"
        onAction={() => void vehiclesQuery.refetch()}
      />
    );
  }

  const onSubmit = (values: MaintenanceFormValues) => {
    createMutation.mutate(values, {
      onSuccess: (created) => router.push(`/maintenance/${created.id}`),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb
          items={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Maintenance', href: '/maintenance' },
            { label: 'New' },
          ]}
        />
        <PageHeader
          title="Create Maintenance"
          description="Opening a work order moves the vehicle In Shop and blocks trip assignment."
        />
      </div>
      <MaintenanceForm
        mode="create"
        vehicles={vehiclesQuery.data ?? []}
        loading={createMutation.isPending}
        onSubmit={onSubmit}
      />
    </div>
  );
}
