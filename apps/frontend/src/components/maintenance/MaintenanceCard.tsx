'use client';

import Link from 'next/link';
import type { Maintenance } from '@transitops/shared-types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MaintenanceStatusBadge } from './MaintenanceStatusBadge';

interface MaintenanceCardProps {
  item: Maintenance;
}

export function MaintenanceCard({ item }: MaintenanceCardProps) {
  return (
    <Card className="transition-colors hover:border-primary/40">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-2">
        <div>
          <CardTitle className="text-base">
            <Link href={`/maintenance/${item.id}`} className="hover:text-primary">
              {item.maintenanceNumber}
            </Link>
          </CardTitle>
          <p className="text-sm text-muted-foreground">{item.title}</p>
        </div>
        <MaintenanceStatusBadge status={item.status} />
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between gap-2">
          <span className="text-muted-foreground">Vehicle</span>
          <span className="font-medium">{item.vehicleNumber ?? '—'}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-muted-foreground">Type</span>
          <span>{item.maintenanceType?.replaceAll('_', ' ') ?? '—'}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-muted-foreground">Priority</span>
          <span>{item.priority}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-muted-foreground">Est. Cost</span>
          <span>
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
              item.estimatedCost,
            )}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
