import { TripStatus } from '@transitops/shared-types';

export const TRIP_NUMBER_PREFIX = 'TR';

export const ACTIVE_TRIP_STATUSES: TripStatus[] = [
  TripStatus.DRAFT,
  TripStatus.DISPATCHED,
  TripStatus.IN_PROGRESS,
];

export const DISPATCHABLE_STATUSES: TripStatus[] = [TripStatus.DRAFT];

export const STARTABLE_STATUSES: TripStatus[] = [TripStatus.DISPATCHED];

export const COMPLETABLE_STATUSES: TripStatus[] = [TripStatus.IN_PROGRESS];

export const CANCELLABLE_STATUSES: TripStatus[] = [
  TripStatus.DRAFT,
  TripStatus.DISPATCHED,
  TripStatus.IN_PROGRESS,
];

export const TRIP_SORT_FIELDS = [
  'createdAt',
  'plannedStartDate',
  'plannedDistance',
  'estimatedRevenue',
  'actualRevenue',
] as const;

export type TripSortField = (typeof TRIP_SORT_FIELDS)[number];
