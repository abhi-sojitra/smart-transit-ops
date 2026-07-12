'use client';

import Link from 'next/link';
import {
  Eye,
  MapPin,
  Pencil,
  Play,
  Send,
  SquareCheckBig,
  Truck,
  User,
  XCircle,
} from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TripStatusBadge } from '@/components/trips/TripStatusBadge';
import { staggerItem } from '@/components/drivers/motion';
import {
  driverLabel,
  formatMiles,
  formatMoney,
  getTripId,
  tripRoute,
  vehicleLabel,
} from '@/components/trips/trip-display';
import { TripStatus, type TripRecord } from '@/types/trip';

interface TripCardProps {
  trip: TripRecord;
  onDispatch: (trip: TripRecord) => void;
  onStart: (trip: TripRecord) => void;
  onComplete: (trip: TripRecord) => void;
  onCancel: (trip: TripRecord) => void;
}

export function TripCard({ trip, onDispatch, onStart, onComplete, onCancel }: TripCardProps) {
  const reduceMotion = useReducedMotion();
  const id = getTripId(trip);

  return (
    <motion.div
      variants={staggerItem}
      initial={reduceMotion ? false : 'hidden'}
      animate="show"
      whileHover={reduceMotion ? undefined : { y: -2 }}
      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
    >
      <Card className="overflow-hidden border-border/80 transition-colors hover:border-primary/30">
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-3">
          <div className="min-w-0">
            <CardTitle className="truncate font-mono text-base">{trip.tripNumber}</CardTitle>
            <p className="mt-1 truncate text-sm text-muted-foreground">{tripRoute(trip)}</p>
          </div>
          <TripStatusBadge status={trip.status} />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Truck className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate text-foreground">{vehicleLabel(trip.vehicleId)}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate text-foreground">{driverLabel(trip.driverId)}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate text-foreground">{formatMiles(trip.plannedDistance)}</span>
            </div>
            <div className="truncate font-medium tabular-nums">
              {formatMoney(trip.actualRevenue ?? trip.estimatedRevenue)}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <Link href={`/trips/${id}`}>
                <Eye className="h-3.5 w-3.5" />
                View
              </Link>
            </Button>
            {trip.status === TripStatus.DRAFT ? (
              <Button variant="outline" size="sm" className="flex-1" asChild>
                <Link href={`/trips/${id}/edit`}>
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Link>
              </Button>
            ) : null}
            {trip.status === TripStatus.DRAFT ? (
              <Button size="sm" onClick={() => onDispatch(trip)}>
                <Send className="h-3.5 w-3.5" />
                Dispatch
              </Button>
            ) : null}
            {trip.status === TripStatus.DISPATCHED ? (
              <Button size="sm" onClick={() => onStart(trip)}>
                <Play className="h-3.5 w-3.5" />
                Start
              </Button>
            ) : null}
            {trip.status === TripStatus.IN_PROGRESS ? (
              <Button size="sm" onClick={() => onComplete(trip)}>
                <SquareCheckBig className="h-3.5 w-3.5" />
                Complete
              </Button>
            ) : null}
            {trip.status !== TripStatus.COMPLETED && trip.status !== TripStatus.CANCELLED ? (
              <Button variant="ghost" size="sm" onClick={() => onCancel(trip)} aria-label="Cancel trip">
                <XCircle className="h-3.5 w-3.5 text-destructive" />
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
