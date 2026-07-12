import { ACTIVE_TRIP_STATUSES } from '../constants/trip.constants';
import { TripStatus } from '@transitops/shared-types';

describe('TripRepository helpers (constants)', () => {
  it('treats draft/dispatched/in-progress as active', () => {
    expect(ACTIVE_TRIP_STATUSES).toEqual(
      expect.arrayContaining([TripStatus.DRAFT, TripStatus.DISPATCHED, TripStatus.IN_PROGRESS]),
    );
    expect(ACTIVE_TRIP_STATUSES).not.toContain(TripStatus.COMPLETED);
    expect(ACTIVE_TRIP_STATUSES).not.toContain(TripStatus.CANCELLED);
  });
});
