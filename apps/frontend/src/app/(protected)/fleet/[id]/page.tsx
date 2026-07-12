'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { AxiosError } from 'axios';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/layout/page-header';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/feedback/empty-state';
import { VehicleStatusBadge } from '@/components/fleet/vehicle-status-badge';
import { DeleteVehicleDialog } from '@/components/fleet/delete-vehicle-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { pageFade, staggerContainer, staggerItem } from '@/components/fleet/motion';
import { useSafeReducedMotion } from '@/hooks/use-safe-reduced-motion';
import {
  useDeleteVehicleMutation,
  useUpdateVehicleStatusMutation,
  useVehicleQuery,
} from '@/hooks/use-fleet';
import { VehicleStatus } from '@/types/fleet';

function formatDate(value?: string) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function DetailItem({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value ?? '—'}</p>
    </div>
  );
}

export default function VehicleDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;
  const reduceMotion = useSafeReducedMotion();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data: vehicle, isLoading, error } = useVehicleQuery(id);
  const deleteMutation = useDeleteVehicleMutation();
  const statusMutation = useUpdateVehicleStatusMutation();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error || !vehicle) {
    const message =
      error instanceof AxiosError
        ? ((error.response?.data as { message?: string })?.message ?? error.message)
        : 'Vehicle not found';
    return <EmptyState title="Vehicle unavailable" description={message} />;
  }

  return (
    <motion.div
      className="space-y-6"
      variants={pageFade}
      initial={reduceMotion ? false : 'hidden'}
      animate="show"
    >
      <div>
        <Breadcrumb
          items={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Fleet', href: '/fleet' },
            { label: vehicle.vehicleId },
          ]}
        />
        <PageHeader
          title={`${vehicle.make} ${vehicle.model}`}
          description={`Vehicle ${vehicle.vehicleId} · ${vehicle.registrationNumber}`}
          actions={
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" asChild>
                <Link href={`/fleet/${vehicle.id}/edit`}>
                  <Pencil className="h-4 w-4" />
                  Edit
                </Link>
              </Button>
              <Button variant="outline" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="h-4 w-4 text-red-500" />
                Delete
              </Button>
            </div>
          }
        />
      </div>

      <motion.div
        className="grid gap-4 lg:grid-cols-2"
        variants={staggerContainer}
        initial={reduceMotion ? false : 'hidden'}
        animate="show"
      >
        <motion.div variants={staggerItem}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Overview</CardTitle>
              <VehicleStatusBadge status={vehicle.status} />
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <DetailItem label="Vehicle ID" value={vehicle.vehicleId} />
              <DetailItem label="Registration" value={vehicle.registrationNumber} />
              <DetailItem label="VIN" value={vehicle.vin} />
              <DetailItem label="Type" value={vehicle.vehicleType.replaceAll('_', ' ')} />
              <DetailItem label="Fuel" value={vehicle.fuelType} />
              <DetailItem label="Year" value={vehicle.year} />
              <DetailItem label="Mileage" value={`${vehicle.mileage.toLocaleString()} km`} />
              <DetailItem label="Seating" value={vehicle.seatingCapacity} />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card>
            <CardHeader>
              <CardTitle>Compliance</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <DetailItem
                label="Registration Expiry"
                value={`${formatDate(vehicle.registrationExpiryDate)} (${vehicle.registrationStatus})`}
              />
              <DetailItem
                label="Insurance Expiry"
                value={`${formatDate(vehicle.insuranceExpiryDate)} (${vehicle.insuranceStatus})`}
              />
              <DetailItem
                label="Fitness Expiry"
                value={`${formatDate(vehicle.fitnessCertificateExpiryDate)} (${vehicle.fitnessStatus})`}
              />
              <DetailItem label="Service Due Status" value={vehicle.serviceDueStatus} />
              <DetailItem label="Last Service" value={formatDate(vehicle.lastServiceDate)} />
              <DetailItem label="Next Service Due" value={formatDate(vehicle.nextServiceDueDate)} />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem} className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Depot & Operations</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <DetailItem label="Depot City" value={vehicle.depotCity} />
              <DetailItem label="Depot State" value={vehicle.depotState} />
              <DetailItem label="Country" value={vehicle.country} />
              <DetailItem label="Remarks" value={vehicle.remarks} />
              <div className="sm:col-span-2">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Status</p>
                <Select
                  value={vehicle.status}
                  disabled={statusMutation.isPending}
                  onValueChange={(value) =>
                    statusMutation.mutate({ id: vehicle.id, status: value })
                  }
                >
                  <SelectTrigger className="mt-1 max-w-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(VehicleStatus).map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.replaceAll('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <DeleteVehicleDialog
        vehicle={vehicle}
        open={confirmDelete}
        loading={deleteMutation.isPending}
        onOpenChange={setConfirmDelete}
        onConfirm={() => {
          deleteMutation.mutate(vehicle.id, {
            onSuccess: () => router.push('/fleet'),
          });
        }}
      />
    </motion.div>
  );
}
