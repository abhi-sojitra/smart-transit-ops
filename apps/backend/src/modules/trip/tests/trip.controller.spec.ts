import { TripController } from '../controller/trip.controller';
import { CreateTripDto, QueryTripDto } from '../dto/trip.dto';
import { CargoType, RoleCode } from '@transitops/shared-types';

describe('TripController', () => {
  const tripService = {
    createTrip: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    updateTrip: jest.fn(),
    softDelete: jest.fn(),
    dispatchTrip: jest.fn(),
    startTrip: jest.fn(),
    completeTrip: jest.fn(),
    cancelTrip: jest.fn(),
    getTripStatistics: jest.fn(),
    getAvailableVehicles: jest.fn(),
    getAvailableDrivers: jest.fn(),
  };

  const controller = new TripController(tripService as never);
  const user = { sub: 'u1', email: 'a@b.com', roles: [RoleCode.ADMIN] };

  beforeEach(() => jest.clearAllMocks());

  it('create delegates to service', async () => {
    const dto = {
      source: 'A',
      destination: 'B',
      vehicleId: '507f1f77bcf86cd799439011',
      driverId: '507f1f77bcf86cd799439012',
      cargoName: 'Cargo',
      cargoWeight: 10,
      cargoType: CargoType.GENERAL,
      plannedDistance: 100,
      plannedStartDate: '2026-07-15T08:00:00.000Z',
      plannedEndDate: '2026-07-15T18:00:00.000Z',
      estimatedRevenue: 500,
    } as CreateTripDto;
    tripService.createTrip.mockResolvedValue({ id: '1' });
    await controller.create(dto, user);
    expect(tripService.createTrip).toHaveBeenCalledWith(dto, user);
  });

  it('findAll passes query and user', async () => {
    const query = { page: 1 } as QueryTripDto;
    tripService.findAll.mockResolvedValue({ data: [], meta: {} });
    await controller.findAll(query, user);
    expect(tripService.findAll).toHaveBeenCalledWith(query, user);
  });

  it('dispatch delegates', async () => {
    await controller.dispatch('t1', user);
    expect(tripService.dispatchTrip).toHaveBeenCalledWith('t1', user);
  });
});
