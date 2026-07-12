'use client';

import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { PageHeader } from '@/components/layout/page-header';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { DriverForm } from '@/components/drivers/driver-form';
import { pageFade } from '@/components/drivers/motion';
import { useCreateDriverMutation } from '@/hooks/use-drivers';

export default function NewDriverPage() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const createMutation = useCreateDriverMutation();

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
            { label: 'Add Driver' },
          ]}
        />
        <PageHeader
          title="Add Driver"
          description="Create a new driver profile for fleet operations."
        />
      </div>

      <DriverForm
        submitting={createMutation.isPending}
        submitLabel="Create Driver"
        onCancel={() => router.push('/drivers')}
        onSubmit={async (values) => {
          const driver = await createMutation.mutateAsync(values);
          router.push(`/drivers/${driver.id}`);
        }}
      />
    </motion.div>
  );
}
