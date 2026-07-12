'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useSafeReducedMotion } from '@/hooks/use-safe-reduced-motion';
import { PageHeader } from '@/components/layout/page-header';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { VehicleForm } from '@/components/fleet/vehicle-form';
import { pageFade } from '@/components/fleet/motion';
import { useCreateVehicleMutation } from '@/hooks/use-fleet';

export default function NewVehiclePage() {
  const router = useRouter();
  const reduceMotion = useSafeReducedMotion();
  const createMutation = useCreateVehicleMutation();

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
            { label: 'Add Vehicle' },
          ]}
        />
        <PageHeader
          title="Add Vehicle"
          description="Register a new fleet vehicle with compliance and depot details."
        />
      </div>

      <VehicleForm
        submitting={createMutation.isPending}
        submitLabel="Create Vehicle"
        onCancel={() => router.push('/fleet')}
        onSubmit={async (values) => {
          const vehicle = await createMutation.mutateAsync(values);
          router.push(`/fleet/${vehicle.id}`);
        }}
      />
    </motion.div>
  );
}
