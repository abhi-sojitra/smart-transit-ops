'use client';

import Link from 'next/link';
import { use } from 'react';
import { Pencil } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useFuelDetail } from '@/hooks/use-fuel';

export default function FuelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: fuel, isLoading, isError } = useFuelDetail(id);

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

  return (
    <div className="space-y-6">
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
          description={`${fuel.vehicleId} · ${fuel.filledAt}`}
          actions={
            <Button asChild variant="outline">
              <Link href={`/fuel/${id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
          }
        />
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Fuel Log Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Detail label="Vehicle" value={fuel.vehicleId} />
          <Detail label="Trip" value={fuel.tripId ?? '—'} />
          <Detail label="Driver" value={fuel.driverId ?? '—'} />
          <Detail label="Fuel Type" value={fuel.fuelType} />
          <Detail label="Quantity" value={`${fuel.quantity} L`} />
          <Detail label="Price/Liter" value={`$${fuel.pricePerLiter.toFixed(2)}`} />
          <Detail label="Total Cost" value={`$${fuel.totalCost.toFixed(2)}`} />
          <Detail label="Odometer" value={fuel.odometerReading?.toString() ?? '—'} />
          <Detail label="Filled At" value={fuel.filledAt} />
          <Detail label="Notes" value={fuel.notes ?? '—'} className="sm:col-span-2" />
        </CardContent>
      </Card>
    </div>
  );
}

function Detail({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}
