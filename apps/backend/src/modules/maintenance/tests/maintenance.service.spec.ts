import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  MaintenancePriority,
  MaintenanceStatus,
  MaintenanceType,
  VehicleStatus,
} from '@transitops/shared-types';
import { MaintenanceService } from '../service/maintenance.service';
import { MaintenanceRepository } from '../repository/maintenance.repository';
import { VehicleRepository } from '../../vehicle/vehicle.repository';

describe('MaintenanceService', () => {
  let service: MaintenanceService;

  const maintenanceRepo = {
    findActiveByVehicleId: jest.fn(),
    generateMaintenanceNumber: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    findPaginated: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    findByVehicleId: jest.fn(),
    isVehicleInMaintenance: jest.fn(),
    countAll: jest.fn(),
    countActive: jest.fn(),
    countByStatus: jest.fn(),
    countOverdue: jest.fn(),
    sumCostInRange: jest.fn(),
    averageRepairTimeDays: jest.fn(),
    addAttachments: jest.fn(),
  };

  const vehicleRepo = {
    findById: jest.fn(),
    findAll: jest.fn(),
    updateStatus: jest.fn(),
    update: jest.fn(),
    countByStatus: jest.fn(),
  };

  const baseInput = {
    vehicleId: '665f1a2b3c4d5e6f7a8b9c0d',
    maintenanceType: MaintenanceType.PREVENTIVE,
    title: '10k service',
    startDate: '2026-07-12',
    expectedCompletionDate: '2026-07-15',
    estimatedCost: 500,
    priority: MaintenancePriority.MEDIUM,
  };

  const vehicle = {
    _id: '665f1a2b3c4d5e6f7a8b9c0d',
    vehicleId: 'VH-1001',
    model: 'Cascadia',
    status: VehicleStatus.AVAILABLE,
    mileage: 10000,
  };

  const makeDoc = (overrides: Record<string, unknown> = {}) => ({
    _id: 'm1',
    vehicleId: vehicle,
    status: MaintenanceStatus.SCHEDULED,
    estimatedCost: 500,
    notes: 'n',
    startDate: new Date('2026-07-12'),
    expectedCompletionDate: new Date('2026-07-15'),
    attachments: [],
    maintenanceNumber: 'MNT-2026-0001',
    maintenanceType: MaintenanceType.PREVENTIVE,
    title: 't',
    priority: MaintenancePriority.MEDIUM,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MaintenanceService,
        { provide: MaintenanceRepository, useValue: maintenanceRepo },
        { provide: VehicleRepository, useValue: vehicleRepo },
      ],
    }).compile();
    service = module.get(MaintenanceService);
  });

  describe('createMaintenance', () => {
    it('creates maintenance and sets vehicle to MAINTENANCE', async () => {
      vehicleRepo.findById.mockResolvedValue(vehicle);
      maintenanceRepo.findActiveByVehicleId.mockResolvedValue(null);
      maintenanceRepo.generateMaintenanceNumber.mockResolvedValue('MNT-2026-0001');
      const created = makeDoc();
      maintenanceRepo.create.mockResolvedValue(created);
      maintenanceRepo.findById.mockResolvedValue(created);

      const result = await service.createMaintenance({
        ...baseInput,
        odometerReading: 11000,
        actualCost: 520,
      });
      expect(result.maintenanceNumber).toBe('MNT-2026-0001');
      expect(vehicleRepo.updateStatus).toHaveBeenCalledWith(
        baseInput.vehicleId,
        VehicleStatus.MAINTENANCE,
      );
      expect(vehicleRepo.update).toHaveBeenCalled();
    });

    it('rejects duplicate active maintenance', async () => {
      vehicleRepo.findById.mockResolvedValue(vehicle);
      maintenanceRepo.findActiveByVehicleId.mockResolvedValue({
        maintenanceNumber: 'MNT-2026-0001',
      });
      await expect(service.createMaintenance(baseInput)).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects non-positive cost', async () => {
      await expect(
        service.createMaintenance({ ...baseInput, estimatedCost: 0 }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects completion before start', async () => {
      await expect(
        service.createMaintenance({
          ...baseInput,
          expectedCompletionDate: '2026-07-10',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects missing vehicle', async () => {
      vehicleRepo.findById.mockResolvedValue(null);
      await expect(service.createMaintenance(baseInput)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects retired vehicle', async () => {
      vehicleRepo.findById.mockResolvedValue({ ...vehicle, status: VehicleStatus.RETIRED });
      await expect(service.createMaintenance(baseInput)).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('findAll / findById', () => {
    it('maps paginated results', async () => {
      maintenanceRepo.findPaginated.mockResolvedValue({
        data: [makeDoc()],
        meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
      });
      const result = await service.findAll({ page: 1 });
      expect(result.data[0].id).toBe('m1');
    });

    it('throws when detail missing', async () => {
      maintenanceRepo.findById.mockResolvedValue(null);
      await expect(service.findById('x')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns detail dto', async () => {
      maintenanceRepo.findById.mockResolvedValue(makeDoc());
      const result = await service.findById('m1');
      expect(result.vehicleNumber).toBe('VH-1001');
    });
  });

  describe('completeMaintenance', () => {
    it('completes and restores vehicle to AVAILABLE', async () => {
      const existing = makeDoc({ status: MaintenanceStatus.IN_PROGRESS });
      maintenanceRepo.findById.mockResolvedValue(existing);
      maintenanceRepo.update.mockResolvedValue({
        ...existing,
        status: MaintenanceStatus.COMPLETED,
        completedDate: new Date(),
        actualCost: 520,
      });
      vehicleRepo.findById.mockResolvedValue({ ...vehicle, status: VehicleStatus.MAINTENANCE });

      const result = await service.completeMaintenance('m1', { actualCost: 520 });
      expect(result.status).toBe(MaintenanceStatus.COMPLETED);
      expect(vehicleRepo.update).toHaveBeenCalled();
    });

    it('does not restore retired vehicles', async () => {
      const existing = makeDoc({ status: MaintenanceStatus.IN_PROGRESS });
      maintenanceRepo.findById.mockResolvedValue(existing);
      maintenanceRepo.update.mockResolvedValue({
        ...existing,
        status: MaintenanceStatus.COMPLETED,
        completedDate: new Date(),
      });
      vehicleRepo.findById.mockResolvedValue({ ...vehicle, status: VehicleStatus.RETIRED });

      await service.completeMaintenance('m1');
      expect(vehicleRepo.update).not.toHaveBeenCalled();
    });

    it('rejects already completed', async () => {
      maintenanceRepo.findById.mockResolvedValue(makeDoc({ status: MaintenanceStatus.COMPLETED }));
      await expect(service.completeMaintenance('m1')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects cancelled', async () => {
      maintenanceRepo.findById.mockResolvedValue(makeDoc({ status: MaintenanceStatus.CANCELLED }));
      await expect(service.completeMaintenance('m1')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects missing', async () => {
      maintenanceRepo.findById.mockResolvedValue(null);
      await expect(service.completeMaintenance('m1')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('cancelMaintenance', () => {
    it('cancels and restores availability', async () => {
      maintenanceRepo.findById.mockResolvedValue(makeDoc({ status: MaintenanceStatus.IN_PROGRESS }));
      maintenanceRepo.update.mockResolvedValue(makeDoc({ status: MaintenanceStatus.CANCELLED }));
      maintenanceRepo.isVehicleInMaintenance.mockResolvedValue(false);
      vehicleRepo.findById.mockResolvedValue({ ...vehicle, status: VehicleStatus.MAINTENANCE });

      const result = await service.cancelMaintenance('m1', { notes: 'delay' });
      expect(result.status).toBe(MaintenanceStatus.CANCELLED);
      expect(vehicleRepo.updateStatus).toHaveBeenCalledWith(
        expect.anything(),
        VehicleStatus.AVAILABLE,
      );
    });

    it('rejects completed cancel', async () => {
      maintenanceRepo.findById.mockResolvedValue(makeDoc({ status: MaintenanceStatus.COMPLETED }));
      await expect(service.cancelMaintenance('m1')).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('updateMaintenance', () => {
    it('only allows notes on completed records', async () => {
      maintenanceRepo.findById.mockResolvedValue(makeDoc({ status: MaintenanceStatus.COMPLETED }));
      await expect(
        service.updateMaintenance('m1', { title: 'new' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('allows notes update on completed records', async () => {
      const existing = makeDoc({ status: MaintenanceStatus.COMPLETED });
      maintenanceRepo.findById.mockResolvedValue(existing);
      maintenanceRepo.update.mockResolvedValue({ ...existing, notes: 'done' });
      const result = await service.updateMaintenance('m1', { notes: 'done' });
      expect(result.notes).toBe('done');
    });

    it('rejects cancelled edits', async () => {
      maintenanceRepo.findById.mockResolvedValue(makeDoc({ status: MaintenanceStatus.CANCELLED }));
      await expect(service.updateMaintenance('m1', { title: 'x' })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('updates active record and sets in-progress vehicle status', async () => {
      const existing = makeDoc({ status: MaintenanceStatus.SCHEDULED });
      maintenanceRepo.findById.mockResolvedValue(existing);
      maintenanceRepo.update.mockResolvedValue({
        ...existing,
        status: MaintenanceStatus.IN_PROGRESS,
        title: 'updated',
      });
      const result = await service.updateMaintenance('m1', {
        title: 'updated',
        status: MaintenanceStatus.IN_PROGRESS,
        estimatedCost: 600,
      });
      expect(result.title).toBe('updated');
      expect(vehicleRepo.updateStatus).toHaveBeenCalled();
    });

    it('throws when missing', async () => {
      maintenanceRepo.findById.mockResolvedValue(null);
      await expect(service.updateMaintenance('m1', { notes: 'x' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('softDelete', () => {
    it('restores vehicle when deleting active work', async () => {
      maintenanceRepo.findById.mockResolvedValue(makeDoc({ status: MaintenanceStatus.IN_PROGRESS }));
      maintenanceRepo.softDelete.mockResolvedValue({});
      maintenanceRepo.isVehicleInMaintenance.mockResolvedValue(false);
      vehicleRepo.findById.mockResolvedValue({ ...vehicle, status: VehicleStatus.MAINTENANCE });
      await expect(service.softDelete('m1', 'u1')).resolves.toEqual({ id: 'm1', deleted: true });
    });

    it('throws when missing', async () => {
      maintenanceRepo.findById.mockResolvedValue(null);
      await expect(service.softDelete('m1')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('history / stats / lookup / attachments / timeline', () => {
    it('returns vehicle history', async () => {
      vehicleRepo.findById.mockResolvedValue(vehicle);
      maintenanceRepo.findByVehicleId.mockResolvedValue([makeDoc()]);
      const result = await service.getVehicleMaintenanceHistory(vehicle._id);
      expect(result).toHaveLength(1);
    });

    it('throws history for missing vehicle', async () => {
      vehicleRepo.findById.mockResolvedValue(null);
      await expect(service.getVehicleMaintenanceHistory('x')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('aggregates KPIs', async () => {
      maintenanceRepo.countAll.mockResolvedValue(30);
      maintenanceRepo.countActive.mockResolvedValue(8);
      maintenanceRepo.countByStatus.mockResolvedValue(18);
      maintenanceRepo.countOverdue.mockResolvedValue(2);
      vehicleRepo.countByStatus.mockResolvedValue(5);
      maintenanceRepo.sumCostInRange.mockResolvedValueOnce(1200).mockResolvedValueOnce(9000);
      maintenanceRepo.averageRepairTimeDays.mockResolvedValue(2.45);

      const stats = await service.getMaintenanceStatistics();
      expect(stats.totalRecords).toBe(30);
      expect(stats.averageRepairTimeDays).toBe(2.5);
    });

    it('lists vehicles for lookup', async () => {
      vehicleRepo.findAll.mockResolvedValue([vehicle]);
      const list = await service.listVehiclesForLookup();
      expect(list[0].vehicleNumber).toBe('VH-1001');
    });

    it('checks in-maintenance flag', async () => {
      maintenanceRepo.isVehicleInMaintenance.mockResolvedValue(true);
      await expect(service.isVehicleInMaintenance('v1')).resolves.toBe(true);
    });

    it('builds timeline', () => {
      const dto = {
        id: '1',
        vehicleId: 'v',
        maintenanceNumber: 'MNT',
        maintenanceType: MaintenanceType.PREVENTIVE,
        title: 't',
        priority: MaintenancePriority.LOW,
        status: MaintenanceStatus.IN_PROGRESS,
        startDate: '2026-07-12',
        expectedCompletionDate: '2026-07-15',
        estimatedCost: 1,
        attachments: [],
        createdAt: '2026-07-12',
        updatedAt: '2026-07-13',
      };
      const timeline = service.getTimeline(dto);
      expect(timeline).toHaveLength(3);
      expect(timeline[1].completed).toBe(true);
    });

    it('uploads attachments', async () => {
      maintenanceRepo.findById.mockResolvedValue(makeDoc());
      maintenanceRepo.addAttachments.mockResolvedValue(
        makeDoc({
          attachments: [
            {
              filename: 'a.pdf',
              originalName: 'invoice.pdf',
              mimeType: 'application/pdf',
              size: 12,
              url: '/uploads/maintenance/a.pdf',
              uploadedAt: new Date(),
            },
          ],
        }),
      );
      const result = await service.addAttachments('m1', [
        {
          filename: 'a.pdf',
          originalname: 'invoice.pdf',
          mimetype: 'application/pdf',
          size: 12,
        } as Express.Multer.File,
      ]);
      expect(result.id).toBe('m1');
    });

    it('rejects attachment upload when missing', async () => {
      maintenanceRepo.findById.mockResolvedValue(null);
      await expect(service.addAttachments('m1', [])).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
