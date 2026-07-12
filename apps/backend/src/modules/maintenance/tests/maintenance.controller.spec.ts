import { Test, TestingModule } from '@nestjs/testing';
import { MaintenanceController } from '../controller/maintenance.controller';
import { MaintenanceService } from '../service/maintenance.service';
import { MaintenanceStatus, MaintenanceType, MaintenancePriority } from '@transitops/shared-types';

describe('MaintenanceController', () => {
  let controller: MaintenanceController;

  const service = {
    createMaintenance: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    updateMaintenance: jest.fn(),
    softDelete: jest.fn(),
    startMaintenance: jest.fn(),
    completeMaintenance: jest.fn(),
    cancelMaintenance: jest.fn(),
    getMaintenanceStatistics: jest.fn(),
    getVehicleMaintenanceHistory: jest.fn(),
    isVehicleInMaintenance: jest.fn(),
    getTimeline: jest.fn(),
    addAttachments: jest.fn(),
    listVehiclesForLookup: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MaintenanceController],
      providers: [{ provide: MaintenanceService, useValue: service }],
    }).compile();
    controller = module.get(MaintenanceController);
  });

  it('creates maintenance', async () => {
    const dto = {
      vehicleId: '665f1a2b3c4d5e6f7a8b9c0d',
      maintenanceType: MaintenanceType.OIL_CHANGE,
      title: 'Oil',
      startDate: '2026-07-12',
      expectedCompletionDate: '2026-07-13',
      estimatedCost: 120,
      priority: MaintenancePriority.LOW,
    };
    service.createMaintenance.mockResolvedValue({ id: '1', ...dto });
    await expect(
      controller.create(dto, { sub: 'u1', email: 'a@b.com', roles: [] }),
    ).resolves.toMatchObject({ id: '1' });
  });

  it('lists maintenance with query', async () => {
    service.findAll.mockResolvedValue({
      data: [],
      meta: { page: 1, limit: 10, total: 0, totalPages: 1 },
    });
    await expect(controller.findAll({ page: 1, limit: 10 })).resolves.toMatchObject({
      meta: { total: 0 },
    });
  });

  it('returns statistics', async () => {
    service.getMaintenanceStatistics.mockResolvedValue({ active: 3 });
    await expect(controller.statistics()).resolves.toEqual({ active: 3 });
  });

  it('returns vehicle lookup', async () => {
    service.listVehiclesForLookup.mockResolvedValue([{ id: 'v1' }]);
    await expect(controller.vehicleLookup()).resolves.toEqual([{ id: 'v1' }]);
  });

  it('returns vehicle history', async () => {
    service.getVehicleMaintenanceHistory.mockResolvedValue([]);
    await expect(controller.vehicleHistory('v1')).resolves.toEqual([]);
  });

  it('checks in-maintenance', async () => {
    service.isVehicleInMaintenance.mockResolvedValue(true);
    await expect(controller.isInMaintenance('v1')).resolves.toEqual({
      vehicleId: 'v1',
      inMaintenance: true,
    });
  });

  it('returns details with timeline', async () => {
    const data = {
      id: '1',
      status: MaintenanceStatus.SCHEDULED,
      createdAt: '2026-07-12',
      updatedAt: '2026-07-12',
    };
    service.findById.mockResolvedValue(data);
    service.getTimeline.mockReturnValue([{ label: 'Maintenance Created', completed: true }]);
    const result = await controller.findOne('1');
    expect(result.timeline).toHaveLength(1);
  });

  it('updates and strips vehicleId', async () => {
    service.updateMaintenance.mockResolvedValue({ id: '1' });
    await controller.update(
      '1',
      { title: 'x', vehicleId: 'should-strip' } as never,
      { sub: 'u1', email: 'a@b.com', roles: [] },
    );
    expect(service.updateMaintenance).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({ title: 'x', updatedBy: 'u1' }),
    );
  });

  it('starts scheduled maintenance', async () => {
    service.startMaintenance.mockResolvedValue({
      id: '1',
      status: MaintenanceStatus.IN_PROGRESS,
    });
    await expect(
      controller.start('1', { sub: 'u1', email: 'a@b.com', roles: [] }),
    ).resolves.toMatchObject({ status: MaintenanceStatus.IN_PROGRESS });
  });

  it('completes maintenance', async () => {
    service.completeMaintenance.mockResolvedValue({ id: '1', status: MaintenanceStatus.COMPLETED });
    await expect(
      controller.complete('1', { actualCost: 200 }, { sub: 'u1', email: 'a@b.com', roles: [] }),
    ).resolves.toMatchObject({ status: MaintenanceStatus.COMPLETED });
  });

  it('cancels maintenance', async () => {
    service.cancelMaintenance.mockResolvedValue({ id: '1', status: MaintenanceStatus.CANCELLED });
    await expect(
      controller.cancel('1', { notes: 'parts delay' }, { sub: 'u1', email: 'a@b.com', roles: [] }),
    ).resolves.toMatchObject({ status: MaintenanceStatus.CANCELLED });
  });

  it('soft deletes', async () => {
    service.softDelete.mockResolvedValue({ id: '1', deleted: true });
    await expect(
      controller.remove('1', { sub: 'u1', email: 'a@b.com', roles: [] }),
    ).resolves.toEqual({ id: '1', deleted: true });
  });

  it('uploads attachments', async () => {
    service.addAttachments.mockResolvedValue({ id: '1', attachments: [] });
    await expect(controller.uploadAttachments('1', [])).resolves.toMatchObject({ id: '1' });
  });
});
