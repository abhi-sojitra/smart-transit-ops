'use client';

import Link from 'next/link';
import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import { DataTable } from '@/components/data-table/data-table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TripStatusBadge } from '@/components/trips/TripStatusBadge';
import { TripStatus, type TripDriverRef, type TripRecord, type TripVehicleRef } from '@/types/trip';

function vehicleLabel(vehicle: TripRecord['vehicleId']) {
  if (!vehicle) return '—';
  if (typeof vehicle === 'string') return vehicle;
  const v = vehicle as TripVehicleRef;
  return v.vehicleId ?? v.registrationNumber ?? v._id;
}

function driverLabel(driver: TripRecord['driverId']) {
  if (!driver) return '—';
  if (typeof driver === 'string') return driver;
  const d = driver as TripDriverRef;
  return d.name ?? (`${d.firstName ?? ''} ${d.lastName ?? ''}`.trim() || d.employeeId || d._id);
}

interface TripTableProps {
  data: TripRecord[];
  onDispatch: (trip: TripRecord) => void;
  onComplete: (trip: TripRecord) => void;
  onCancel: (trip: TripRecord) => void;
  onStart: (trip: TripRecord) => void;
}

export function TripTable({ data, onDispatch, onComplete, onCancel, onStart }: TripTableProps) {
  const columns: ColumnDef<TripRecord>[] = [
    {
      accessorKey: 'tripNumber',
      header: 'Trip Number',
      cell: ({ row }) => (
        <Link className="font-medium text-primary hover:underline" href={`/trips/${row.original._id}`}>
          {row.original.tripNumber}
        </Link>
      ),
    },
    {
      id: 'vehicle',
      header: 'Vehicle',
      cell: ({ row }) => vehicleLabel(row.original.vehicleId),
    },
    {
      id: 'driver',
      header: 'Driver',
      cell: ({ row }) => driverLabel(row.original.driverId),
    },
    { accessorKey: 'source', header: 'Source' },
    { accessorKey: 'destination', header: 'Destination' },
    { accessorKey: 'cargoName', header: 'Cargo' },
    {
      accessorKey: 'plannedDistance',
      header: 'Distance',
      cell: ({ row }) => `${row.original.plannedDistance.toLocaleString()} mi`,
    },
    {
      id: 'revenue',
      header: 'Revenue',
      cell: ({ row }) => {
        const value = row.original.actualRevenue ?? row.original.estimatedRevenue;
        return `$${value.toLocaleString()}`;
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <TripStatusBadge status={row.original.status} />,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const trip = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/trips/${trip._id}`}>View</Link>
              </DropdownMenuItem>
              {trip.status === TripStatus.DRAFT ? (
                <DropdownMenuItem asChild>
                  <Link href={`/trips/${trip._id}/edit`}>Edit</Link>
                </DropdownMenuItem>
              ) : null}
              {trip.status === TripStatus.DRAFT ? (
                <DropdownMenuItem onClick={() => onDispatch(trip)}>Dispatch</DropdownMenuItem>
              ) : null}
              {trip.status === TripStatus.DISPATCHED ? (
                <DropdownMenuItem onClick={() => onStart(trip)}>Start</DropdownMenuItem>
              ) : null}
              {trip.status === TripStatus.IN_PROGRESS ? (
                <DropdownMenuItem onClick={() => onComplete(trip)}>Complete</DropdownMenuItem>
              ) : null}
              {trip.status !== TripStatus.COMPLETED && trip.status !== TripStatus.CANCELLED ? (
                <DropdownMenuItem onClick={() => onCancel(trip)}>Cancel</DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return <DataTable columns={columns} data={data} searchPlaceholder="Filter rows..." />;
}
