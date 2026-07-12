'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { AxiosError } from 'axios';
import { motion, useReducedMotion } from 'framer-motion';
import { PageHeader } from '@/components/layout/page-header';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/feedback/empty-state';
import { DriverStatusBadge } from '@/components/drivers/driver-status-badge';
import { DeleteDriverDialog } from '@/components/drivers/delete-driver-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { pageFade, staggerContainer, staggerItem } from '@/components/drivers/motion';
import {
  useDeleteDriverMutation,
  useDriverQuery,
  useUpdateDriverStatusMutation,
} from '@/hooks/use-drivers';
import { DriverStatus } from '@/types/driver';

function formatDate(value?: string) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
}

function DetailItem({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value ?? '—'}</p>
    </div>
  );
}

export default function DriverDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;
  const reduceMotion = useReducedMotion();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data: driver, isLoading, error } = useDriverQuery(id);
  const deleteMutation = useDeleteDriverMutation();
  const statusMutation = useUpdateDriverStatusMutation();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error || !driver) {
    const message =
      error instanceof AxiosError
        ? ((error.response?.data as { message?: string })?.message ?? error.message)
        : 'Driver not found';
    return <EmptyState title="Driver unavailable" description={message} />;
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
            { label: 'Drivers', href: '/drivers' },
            { label: driver.fullName },
          ]}
        />
        <PageHeader
          title={driver.fullName}
          description={`${driver.employeeCode} · ${driver.email}`}
          actions={
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" asChild>
                <Link href={`/drivers/${driver.id}/edit`}>
                  <Pencil className="h-4 w-4" />
                  Edit
                </Link>
              </Button>
              <Button variant="danger" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          }
        />
      </div>

      <motion.div
        className="flex flex-col gap-4 rounded-xl border border-border bg-card/50 p-4 sm:flex-row sm:items-center sm:justify-between"
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-center gap-3">
          <DriverStatusBadge status={driver.status} />
          <span className="text-sm text-muted-foreground">
            Safety score {driver.safetyScore}% · License {driver.licenseStatus?.toLowerCase()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Update status</span>
          <Select
            value={driver.status}
            disabled={statusMutation.isPending}
            onValueChange={(value) =>
              statusMutation.mutate({ id: driver.id, status: value })
            }
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(DriverStatus).map((status) => (
                <SelectItem key={status} value={status}>
                  {status.replaceAll('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      <motion.div
        className="grid gap-4 lg:grid-cols-2"
        variants={staggerContainer}
        initial={reduceMotion ? false : 'hidden'}
        animate="show"
      >
        <motion.div variants={staggerItem}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Personal</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <DetailItem label="Phone" value={driver.phone} />
              <DetailItem label="Alternate Phone" value={driver.alternatePhone} />
              <DetailItem label="Date of Birth" value={formatDate(driver.dateOfBirth)} />
              <DetailItem label="Blood Group" value={driver.bloodGroup} />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">License</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <DetailItem label="Number" value={driver.licenseNumber} />
              <DetailItem label="Category" value={driver.licenseCategory} />
              <DetailItem label="Issue Date" value={formatDate(driver.licenseIssueDate)} />
              <DetailItem label="Expiry Date" value={formatDate(driver.licenseExpiryDate)} />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Employment</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <DetailItem label="Joining Date" value={formatDate(driver.joiningDate)} />
              <DetailItem label="Experience" value={`${driver.experienceYears} years`} />
              <DetailItem label="City" value={driver.city} />
              <DetailItem label="State" value={driver.state} />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Emergency & Notes</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <DetailItem label="Emergency Name" value={driver.emergencyName} />
              <DetailItem label="Emergency Phone" value={driver.emergencyPhone} />
              <DetailItem label="Address" value={driver.address} />
              <DetailItem label="Remarks" value={driver.remarks} />
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <DeleteDriverDialog
        driver={driver}
        open={confirmDelete}
        loading={deleteMutation.isPending}
        onOpenChange={setConfirmDelete}
        onConfirm={() => {
          deleteMutation.mutate(driver.id, {
            onSuccess: () => router.push('/drivers'),
          });
        }}
      />
    </motion.div>
  );
}
