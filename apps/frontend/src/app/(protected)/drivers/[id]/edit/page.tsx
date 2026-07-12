'use client';

import { useParams, useRouter } from 'next/navigation';
import { AxiosError } from 'axios';
import { motion, useReducedMotion } from 'framer-motion';
import { PageHeader } from '@/components/layout/page-header';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/feedback/empty-state';
import { DriverForm } from '@/components/drivers/driver-form';
import { pageFade } from '@/components/drivers/motion';
import { useDriverQuery, useUpdateDriverMutation } from '@/hooks/use-drivers';

function toDateInput(value?: string) {
  if (!value) return '';
  return value.slice(0, 10);
}

export default function EditDriverPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;
  const reduceMotion = useReducedMotion();

  const { data: driver, isLoading, error } = useDriverQuery(id);
  const updateMutation = useUpdateDriverMutation(id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !driver) {
    const message =
      error instanceof AxiosError
        ? ((error.response?.data as { message?: string })?.message ?? error.message)
        : 'Driver not found';
    return <EmptyState title="Unable to edit driver" description={message} />;
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
            { label: driver.fullName, href: `/drivers/${driver.id}` },
            { label: 'Edit' },
          ]}
        />
        <PageHeader
          title={`Edit ${driver.fullName}`}
          description="Update driver profile, license, and employment details."
        />
      </div>

      <DriverForm
        submitting={updateMutation.isPending}
        submitLabel="Save Changes"
        onCancel={() => router.push(`/drivers/${driver.id}`)}
        defaultValues={{
          employeeCode: driver.employeeCode,
          firstName: driver.firstName,
          lastName: driver.lastName,
          email: driver.email,
          phone: driver.phone,
          alternatePhone: driver.alternatePhone ?? '',
          dateOfBirth: toDateInput(driver.dateOfBirth),
          joiningDate: toDateInput(driver.joiningDate),
          licenseNumber: driver.licenseNumber,
          licenseCategory: driver.licenseCategory,
          licenseIssueDate: toDateInput(driver.licenseIssueDate),
          licenseExpiryDate: toDateInput(driver.licenseExpiryDate),
          experienceYears: driver.experienceYears,
          address: driver.address ?? '',
          city: driver.city ?? '',
          state: driver.state ?? '',
          country: driver.country ?? 'India',
          postalCode: driver.postalCode ?? '',
          emergencyName: driver.emergencyName ?? '',
          emergencyPhone: driver.emergencyPhone ?? '',
          bloodGroup: driver.bloodGroup,
          photo: driver.photo ?? '',
          remarks: driver.remarks ?? '',
          status: driver.status,
          safetyScore: driver.safetyScore,
        }}
        onSubmit={async (values) => {
          await updateMutation.mutateAsync(values);
          router.push(`/drivers/${driver.id}`);
        }}
      />
    </motion.div>
  );
}
