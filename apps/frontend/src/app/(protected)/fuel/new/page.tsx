'use client';

import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { PageHeader } from '@/components/layout/page-header';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { FuelForm } from '@/components/fuel';
import { pageFade } from '@/components/drivers/motion';
import { useCreateFuel } from '@/hooks/use-fuel';
import type { FuelFormValues } from '@/types/fuel-expense';
import { toast } from 'sonner';
import { AxiosError } from 'axios';

export default function NewFuelPage() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const createMutation = useCreateFuel();

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
            { label: 'Fuel Logs', href: '/fuel' },
            { label: 'Add Fuel' },
          ]}
        />
        <PageHeader title="Add Fuel Log" description="Record a new fuel purchase for a vehicle." />
      </div>

      <FuelForm
        submitting={createMutation.isPending}
        submitLabel="Create Fuel Log"
        onCancel={() => router.push('/fuel')}
        onSubmit={async (values: FuelFormValues) => {
          try {
            const log = await createMutation.mutateAsync({
              ...values,
              tripId: values.tripId || undefined,
              driverId: values.driverId || undefined,
              receiptImage: values.receiptImage || undefined,
              notes: values.notes || undefined,
            });
            toast.success('Fuel log added');
            router.push(`/fuel/${log.id}`);
          } catch (error) {
            const message =
              error instanceof AxiosError
                ? ((error.response?.data as { message?: string })?.message ?? error.message)
                : 'Failed to add fuel log';
            toast.error(message);
          }
        }}
      />
    </motion.div>
  );
}
