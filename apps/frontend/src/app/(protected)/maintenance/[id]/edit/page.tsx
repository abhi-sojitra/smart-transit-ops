'use client';

import { useParams, useRouter } from 'next/navigation';
import { MaintenanceStatus } from '@transitops/shared-types';
import { PageHeader } from '@/components/layout/page-header';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { MaintenanceDetailSkeleton, MaintenanceForm } from '@/components/maintenance';
import { EmptyState } from '@/components/feedback/empty-state';
import {
  useMaintenanceDetail,
  useMaintenanceVehicles,
  useUpdateMaintenance,
  useUploadMaintenanceAttachments,
} from '@/hooks/use-maintenance';
import type { MaintenanceFormValues } from '@/types/maintenance';

function toDateInput(value?: string) {
  if (!value) return '';
  return value.slice(0, 10);
}

export default function EditMaintenancePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;
  const detailQuery = useMaintenanceDetail(id);
  const vehiclesQuery = useMaintenanceVehicles();
  const updateMutation = useUpdateMaintenance(id);
  const uploadMutation = useUploadMaintenanceAttachments(id);

  if (detailQuery.isLoading || vehiclesQuery.isLoading) {
    return <MaintenanceDetailSkeleton />;
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <EmptyState
        title="Maintenance not found"
        actionLabel="Back to list"
        onAction={() => router.push('/maintenance')}
      />
    );
  }

  const item = detailQuery.data;
  if (item.status === MaintenanceStatus.CANCELLED) {
    return (
      <EmptyState
        title="Cancelled records cannot be edited"
        actionLabel="View details"
        onAction={() => router.push(`/maintenance/${id}`)}
      />
    );
  }

  const initialValues: Partial<MaintenanceFormValues> = {
    vehicleId: item.vehicleId,
    maintenanceType: item.maintenanceType,
    title: item.title,
    description: item.description,
    priority: item.priority,
    startDate: toDateInput(item.startDate),
    expectedCompletionDate: toDateInput(item.expectedCompletionDate),
    estimatedCost: item.estimatedCost,
    actualCost: item.actualCost ?? '',
    vendorName: item.vendorName,
    vendorPhone: item.vendorPhone,
    serviceCenter: item.serviceCenter,
    odometerReading: item.odometerReading ?? '',
    nextServiceDue: toDateInput(item.nextServiceDue),
    notes: item.notes,
  };

  const onSubmit = (values: MaintenanceFormValues) => {
    const payload =
      item.status === MaintenanceStatus.COMPLETED
        ? { notes: values.notes }
        : values;
    updateMutation.mutate(payload, {
      onSuccess: () => router.push(`/maintenance/${id}`),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb
          items={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Maintenance', href: '/maintenance' },
            { label: item.maintenanceNumber, href: `/maintenance/${item.id}` },
            { label: 'Edit' },
          ]}
        />
        <PageHeader
          title={`Edit ${item.maintenanceNumber}`}
          description={
            item.status === MaintenanceStatus.COMPLETED
              ? 'Only notes can be updated for completed maintenance.'
              : 'Update schedule, vendor, cost, and service details.'
          }
        />
      </div>
      <MaintenanceForm
        mode="edit"
        status={item.status}
        initialValues={initialValues}
        vehicles={vehiclesQuery.data ?? []}
        loading={updateMutation.isPending || uploadMutation.isPending}
        onSubmit={onSubmit}
        onFilesSelected={(files) => uploadMutation.mutate(files)}
      />
    </div>
  );
}
