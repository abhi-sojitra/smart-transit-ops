jest.mock('../../vehicle/schema/vehicle.schema', () => ({
  Vehicle: { name: 'Vehicle' },
}));
jest.mock('../../driver/schema/driver.schema', () => ({
  Driver: { name: 'Driver' },
}));
jest.mock('../../trip/schema/trip.schema', () => ({
  Trip: { name: 'Trip' },
}));
jest.mock('../../maintenance/schema/maintenance.schema', () => ({
  Maintenance: { name: 'Maintenance' },
}));
jest.mock('../../../schemas/fuel.schema', () => ({
  Fuel: { name: 'Fuel' },
}));
jest.mock('../../../schemas/expense.schema', () => ({
  Expense: { name: 'Expense' },
}));

import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { DashboardRepository } from '../repository/dashboard.repository';

describe('DashboardRepository', () => {
  let repository: DashboardRepository;
  const aggregate = jest.fn();
  const model = { aggregate };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardRepository,
        { provide: getModelToken('Vehicle'), useValue: model },
        { provide: getModelToken('Driver'), useValue: model },
        { provide: getModelToken('Trip'), useValue: model },
        { provide: getModelToken('Maintenance'), useValue: model },
        { provide: getModelToken('Fuel'), useValue: model },
        { provide: getModelToken('Expense'), useValue: model },
      ],
    }).compile();

    repository = module.get(DashboardRepository);
    jest.clearAllMocks();
    aggregate.mockResolvedValue([]);
  });

  it('resolves weekly period range', () => {
    const range = repository.resolvePeriodRange(
      'weekly',
      new Date('2026-07-12T12:00:00.000Z'),
    );
    const daySpan =
      Math.round((range.end.getTime() - range.start.getTime()) / 86_400_000);
    expect(daySpan).toBeGreaterThanOrEqual(6);
    expect(daySpan).toBeLessThanOrEqual(7);
  });

  it('runs fleet status aggregation pipeline', async () => {
    await repository.getFleetStatusCounts();
    expect(aggregate).toHaveBeenCalled();
    const pipeline = aggregate.mock.calls[0][0];
    expect(pipeline[0]).toEqual({ $match: { isDeleted: { $ne: true } } });
    expect(pipeline[1].$group).toBeDefined();
  });

  it('runs recent activity with unionWith stages', async () => {
    await repository.getRecentActivity(5);
    const pipeline = aggregate.mock.calls[0][0];
    expect(pipeline.some((stage: Record<string, unknown>) => stage.$unionWith)).toBe(
      true,
    );
    expect(pipeline.at(-1)).toEqual({ $limit: 5 });
  });
});
