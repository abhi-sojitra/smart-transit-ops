'use client';

import Link from 'next/link';
import { use, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { AxiosError } from 'axios';
import { motion, useReducedMotion } from 'framer-motion';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/page-header';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DeleteFuelDialog } from '@/components/fuel';
import { pageFade, staggerContainer, staggerItem } from '@/components/drivers/motion';
import { useDeleteFuel, useFuelDetail } from '@/hooks/use-fuel';
import { formatDisplayDate } from '@/utils/date';
import { useRouter } from 'next/navigation';

export default function FuelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { data: fuel, isLoading, isError } = useFuelDetail(id);
  const deleteMutation = useDeleteFuel();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-80 w-full max-w-2xl rounded-xl" />
      </div>
    );
  }

  if (isError || !fuel) {
    return <p className="text-sm text-red-500">Fuel log not found.</p>;
  }

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Fuel log deleted');
      router.push('/fuel');
    } catch (error) {
      const message =
        error instanceof AxiosError
          ? ((error.response?.data as { message?: string })?.message ?? error.message)
          : 'Failed to delete fuel log';
      toast.error(message);
    }
  };

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
            { label: fuel.fuelStation },
          ]}
        />
        <PageHeader
          title={fuel.fuelStation}
          description={`${fuel.vehicleId} · ${formatDisplayDate(fuel.filledAt)}`}
          actions={
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link href={`/fuel/${id}/edit`}>
                  <Pencil className="h-4 w-4" />
                  Edit
                </Link>
              </Button>
              <Button variant="danger" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          }
        />
      </div>

      <motion.div
        className="grid gap-4 md:grid-cols-2"
        variants={staggerContainer}
        initial={reduceMotion ? false : 'hidden'}
        animate="show"
      >
        <motion.div variants={staggerItem}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Assignment</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Detail label="Vehicle" value={fuel.vehicleId} />
              <Detail label="Trip" value={fuel.tripId ?? '—'} />
              <Detail label="Driver" value={fuel.driverId ?? '—'} />
              <Detail label="Filled At" value={formatDisplayDate(fuel.filledAt)} />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fuel & Cost</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Detail label="Fuel Type" value={fuel.fuelType} />
              <Detail label="Quantity" value={`${fuel.quantity} L`} />
              <Detail label="Price/Liter" value={`$${fuel.pricePerLiter.toFixed(2)}`} />
              <Detail label="Total Cost" value={`$${fuel.totalCost.toFixed(2)}`} />
              <Detail label="Odometer" value={fuel.odometerReading?.toString() ?? '—'} />
            </CardContent>
          </Card>
        </motion.div>

        {fuel.notes ? (
          <motion.div variants={staggerItem} className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{fuel.notes}</p>
              </CardContent>
            </Card>
          </motion.div>
        ) : null}
      </motion.div>

      <DeleteFuelDialog
        fuel={fuel}
        open={deleteOpen}
        loading={deleteMutation.isPending}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
      />
    </motion.div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}
