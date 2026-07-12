import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import {
  MaintenancePriority,
  MaintenanceStatus,
  VehicleStatus,
  type Maintenance as MaintenanceDto,
  type MaintenanceStatistics,
  type MaintenanceAttachment,
} from '@transitops/shared-types';
import { VehicleRepository } from '../../vehicle/vehicle.repository';
import { VehicleDocument } from '../../vehicle/schema/vehicle.schema';
import { MAINTENANCE_ACTIVE_STATUSES } from '../constants/maintenance.constants';
import type {
  CancelMaintenanceInput,
  CompleteMaintenanceInput,
  CreateMaintenanceInput,
  MaintenanceQueryOptions,
  MaintenanceTimelineEvent,
  PaginatedResult,
  UpdateMaintenanceInput,
} from '../interfaces/maintenance.interfaces';
import { MaintenanceRepository } from '../repository/maintenance.repository';
import {
  MaintenanceAttachmentEmbedded,
  MaintenanceDocument,
} from '../schema/maintenance.schema';

@Injectable()
export class MaintenanceService {
  constructor(
    private readonly maintenanceRepository: MaintenanceRepository,
    private readonly vehicleRepository: VehicleRepository,
  ) {}

  /** Reusable — Trip / Dispatch modules can call directly */
  async createMaintenance(input: CreateMaintenanceInput): Promise<MaintenanceDto> {
    this.assertCostPositive(input.estimatedCost, 'estimatedCost');
    if (input.actualCost !== undefined) {
      this.assertCostPositive(input.actualCost, 'actualCost');
    }
    this.assertScheduleDates(input.startDate, input.expectedCompletionDate, input.nextServiceDue);
    this.assertTextLimits(input);

    const vehicle = await this.vehicleRepository.findById(input.vehicleId);
    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }
    if (vehicle.status === VehicleStatus.RETIRED) {
      throw new BadRequestException('Cannot create maintenance for a retired vehicle');
    }

    const active = await this.maintenanceRepository.findActiveByVehicleId(input.vehicleId);
    if (active) {
      throw new ConflictException(
        `Vehicle already has active maintenance (${active.maintenanceNumber})`,
      );
    }

    const maintenanceNumber = await this.maintenanceRepository.generateMaintenanceNumber();
    const status = input.status ?? MaintenanceStatus.SCHEDULED;

    const doc = await this.maintenanceRepository.create({
      vehicleId: new Types.ObjectId(input.vehicleId),
      maintenanceNumber,
      maintenanceType: input.maintenanceType,
      title: input.title,
      description: input.description,
      priority: input.priority ?? MaintenancePriority.MEDIUM,
      status,
      startDate: new Date(input.startDate),
      expectedCompletionDate: new Date(input.expectedCompletionDate),
      estimatedCost: input.estimatedCost,
      actualCost: input.actualCost,
      vendorName: input.vendorName,
      vendorPhone: input.vendorPhone,
      serviceCenter: input.serviceCenter,
      odometerReading: input.odometerReading ?? vehicle.mileage,
      nextServiceDue: input.nextServiceDue ? new Date(input.nextServiceDue) : undefined,
      notes: input.notes,
      createdBy: input.createdBy,
      attachments: [],
      isDeleted: false,
    });

    if (MAINTENANCE_ACTIVE_STATUSES.includes(status)) {
      await this.vehicleRepository.updateStatus(input.vehicleId, VehicleStatus.MAINTENANCE);
      if (input.odometerReading !== undefined) {
        await this.vehicleRepository.update(input.vehicleId, {
          mileage: input.odometerReading,
        });
      }
    }

    const populated = await this.maintenanceRepository.findById(String(doc._id));
    return this.toDto(populated ?? doc);
  }

  async findAll(options: MaintenanceQueryOptions): Promise<PaginatedResult<MaintenanceDto>> {
    const result = await this.maintenanceRepository.findPaginated(options);
    return {
      data: result.data.map((doc) => this.toDto(doc)),
      meta: result.meta,
    };
  }

  async findById(id: string): Promise<MaintenanceDto> {
    const doc = await this.maintenanceRepository.findById(id);
    if (!doc) throw new NotFoundException('Maintenance record not found');
    return this.toDto(doc);
  }

  async updateMaintenance(id: string, input: UpdateMaintenanceInput): Promise<MaintenanceDto> {
    const existing = await this.maintenanceRepository.findById(id);
    if (!existing) throw new NotFoundException('Maintenance record not found');

    if (existing.status === MaintenanceStatus.COMPLETED) {
      if (this.hasNonNotesUpdates(input)) {
        throw new ForbiddenException('Completed maintenance can only update notes');
      }
      const updated = await this.maintenanceRepository.update(id, {
        notes: input.notes,
        updatedBy: input.updatedBy,
      });
      return this.toDto(updated!);
    }

    if (existing.status === MaintenanceStatus.CANCELLED) {
      throw new BadRequestException('Cancelled maintenance cannot be edited');
    }

    if (input.estimatedCost !== undefined) {
      this.assertCostPositive(input.estimatedCost, 'estimatedCost');
    }
    if (input.actualCost !== undefined) {
      this.assertCostPositive(input.actualCost, 'actualCost');
    }

    const startDate = input.startDate ?? existing.startDate;
    const expectedCompletionDate = input.expectedCompletionDate ?? existing.expectedCompletionDate;
    const nextServiceDue = input.nextServiceDue ?? existing.nextServiceDue;
    this.assertScheduleDates(startDate, expectedCompletionDate, nextServiceDue);
    this.assertTextLimits(input);

    const patch: Record<string, unknown> = { updatedBy: input.updatedBy };
    const assignable: (keyof UpdateMaintenanceInput)[] = [
      'maintenanceType',
      'title',
      'description',
      'priority',
      'status',
      'estimatedCost',
      'actualCost',
      'vendorName',
      'vendorPhone',
      'serviceCenter',
      'odometerReading',
      'notes',
    ];
    for (const key of assignable) {
      if (input[key] !== undefined) patch[key] = input[key];
    }
    if (input.startDate) patch.startDate = new Date(input.startDate);
    if (input.expectedCompletionDate) {
      patch.expectedCompletionDate = new Date(input.expectedCompletionDate);
    }
    if (input.nextServiceDue) patch.nextServiceDue = new Date(input.nextServiceDue);

    if (input.status === MaintenanceStatus.IN_PROGRESS && existing.status === MaintenanceStatus.SCHEDULED) {
      const vehicleId = String(this.resolveVehicleId(existing));
      await this.vehicleRepository.updateStatus(vehicleId, VehicleStatus.MAINTENANCE);
    }

    const updated = await this.maintenanceRepository.update(id, patch as Partial<MaintenanceDocument>);
    return this.toDto(updated!);
  }

  /** Move Scheduled → In Progress */
  async startMaintenance(id: string, updatedBy?: string): Promise<MaintenanceDto> {
    const existing = await this.maintenanceRepository.findById(id);
    if (!existing) throw new NotFoundException('Maintenance record not found');

    if (existing.status === MaintenanceStatus.IN_PROGRESS) {
      return this.toDto(existing);
    }
    if (existing.status !== MaintenanceStatus.SCHEDULED) {
      throw new BadRequestException('Only scheduled maintenance can be started');
    }

    const updated = await this.maintenanceRepository.update(id, {
      status: MaintenanceStatus.IN_PROGRESS,
      updatedBy,
    });

    const vehicleId = String(this.resolveVehicleId(existing));
    await this.vehicleRepository.updateStatus(vehicleId, VehicleStatus.MAINTENANCE);

    return this.toDto(updated!);
  }

  /** Reusable — Trip / Dispatch modules can call directly */
  async completeMaintenance(
    id: string,
    input: CompleteMaintenanceInput = {},
  ): Promise<MaintenanceDto> {
    const existing = await this.maintenanceRepository.findById(id);
    if (!existing) throw new NotFoundException('Maintenance record not found');

    if (existing.status === MaintenanceStatus.COMPLETED) {
      throw new BadRequestException('Maintenance is already completed');
    }
    if (existing.status === MaintenanceStatus.CANCELLED) {
      throw new BadRequestException('Cannot complete a cancelled maintenance');
    }

    if (input.actualCost !== undefined) {
      this.assertCostPositive(input.actualCost, 'actualCost');
    }

    const completedDate = input.completedDate ? new Date(input.completedDate) : new Date();
    const updated = await this.maintenanceRepository.update(id, {
      status: MaintenanceStatus.COMPLETED,
      completedDate,
      actualCost: input.actualCost ?? existing.actualCost ?? existing.estimatedCost,
      notes: input.notes ?? existing.notes,
      updatedBy: input.updatedBy,
    });

    const vehicleId = String(this.resolveVehicleId(existing));
    const vehicle = await this.vehicleRepository.findById(vehicleId);
    if (vehicle && vehicle.status !== VehicleStatus.RETIRED) {
      await this.vehicleRepository.update(vehicleId, {
        status: VehicleStatus.AVAILABLE,
        lastService: completedDate,
        ...(existing.odometerReading !== undefined
          ? { mileage: existing.odometerReading }
          : {}),
      });
    }

    return this.toDto(updated!);
  }

  /** Reusable — Trip / Dispatch modules can call directly */
  async cancelMaintenance(
    id: string,
    input: CancelMaintenanceInput = {},
  ): Promise<MaintenanceDto> {
    const existing = await this.maintenanceRepository.findById(id);
    if (!existing) throw new NotFoundException('Maintenance record not found');

    if (existing.status === MaintenanceStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel a completed maintenance');
    }
    if (existing.status === MaintenanceStatus.CANCELLED) {
      throw new BadRequestException('Maintenance is already cancelled');
    }

    const updated = await this.maintenanceRepository.update(id, {
      status: MaintenanceStatus.CANCELLED,
      notes: input.notes
        ? `${existing.notes ? existing.notes + '\n' : ''}[Cancelled] ${input.notes}`
        : existing.notes,
      updatedBy: input.updatedBy,
    });

    const vehicleId = String(this.resolveVehicleId(existing));
    await this.restoreVehicleAvailability(vehicleId);

    return this.toDto(updated!);
  }

  async softDelete(id: string, deletedBy?: string): Promise<{ id: string; deleted: boolean }> {
    const existing = await this.maintenanceRepository.findById(id);
    if (!existing) throw new NotFoundException('Maintenance record not found');

    if (MAINTENANCE_ACTIVE_STATUSES.includes(existing.status)) {
      const vehicleId = String(this.resolveVehicleId(existing));
      await this.restoreVehicleAvailability(vehicleId);
    }

    await this.maintenanceRepository.softDelete(id, deletedBy);
    return { id, deleted: true };
  }

  /** Lightweight vehicle list for maintenance forms (not a Vehicle Module) */
  async listVehiclesForLookup() {
    const vehicles = await this.vehicleRepository.findAll();
    return vehicles.map((v) => ({
      id: String(v._id),
      vehicleNumber: v.vehicleId || v.vehicleNumber || '',
      model: v.model,
      status: v.status,
      odometerReading: v.mileage,
    }));
  }

  /** Reusable — Trip / Dispatch modules can call directly */
  async getVehicleMaintenanceHistory(vehicleId: string): Promise<MaintenanceDto[]> {
    const vehicle = await this.vehicleRepository.findById(vehicleId);
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    const docs = await this.maintenanceRepository.findByVehicleId(vehicleId);
    return docs.map((doc) => this.toDto(doc));
  }

  /** Reusable — Trip / Dispatch modules can call directly */
  async getMaintenanceStatistics(): Promise<MaintenanceStatistics> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const [
      totalRecords,
      active,
      completed,
      overdue,
      vehiclesInShop,
      costThisMonth,
      costThisYear,
      averageRepairTimeDays,
    ] = await Promise.all([
      this.maintenanceRepository.countAll(),
      this.maintenanceRepository.countActive(),
      this.maintenanceRepository.countByStatus(MaintenanceStatus.COMPLETED),
      this.maintenanceRepository.countOverdue(now),
      this.vehicleRepository.countByStatus(VehicleStatus.MAINTENANCE),
      this.maintenanceRepository.sumCostInRange(monthStart, now),
      this.maintenanceRepository.sumCostInRange(yearStart, now),
      this.maintenanceRepository.averageRepairTimeDays(),
    ]);

    return {
      totalRecords,
      active,
      completed,
      overdue,
      vehiclesInShop,
      costThisMonth: Math.round(costThisMonth * 100) / 100,
      costThisYear: Math.round(costThisYear * 100) / 100,
      averageRepairTimeDays: Math.round(averageRepairTimeDays * 10) / 10,
    };
  }

  /** Reusable — Trip / Dispatch modules can call directly */
  async isVehicleInMaintenance(vehicleId: string): Promise<boolean> {
    return this.maintenanceRepository.isVehicleInMaintenance(vehicleId);
  }

  getTimeline(doc: MaintenanceDto): MaintenanceTimelineEvent[] {
    return [
      {
        status: MaintenanceStatus.SCHEDULED,
        label: 'Maintenance Created',
        timestamp: doc.createdAt,
        completed: true,
      },
      {
        status: MaintenanceStatus.IN_PROGRESS,
        label: 'In Progress',
        timestamp:
          doc.status === MaintenanceStatus.IN_PROGRESS ||
          doc.status === MaintenanceStatus.COMPLETED
            ? doc.updatedAt
            : undefined,
        completed:
          doc.status === MaintenanceStatus.IN_PROGRESS ||
          doc.status === MaintenanceStatus.COMPLETED,
      },
      {
        status: MaintenanceStatus.COMPLETED,
        label: 'Completed',
        timestamp: doc.completedDate,
        completed: doc.status === MaintenanceStatus.COMPLETED,
      },
    ];
  }

  async addAttachments(
    id: string,
    files: Express.Multer.File[],
  ): Promise<MaintenanceDto> {
    const existing = await this.maintenanceRepository.findById(id);
    if (!existing) throw new NotFoundException('Maintenance record not found');

    const attachments: MaintenanceAttachmentEmbedded[] = files.map((file) => ({
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url: `/uploads/maintenance/${file.filename}`,
      uploadedAt: new Date(),
    }));

    const updated = await this.maintenanceRepository.addAttachments(id, attachments);
    return this.toDto(updated!);
  }

  private async restoreVehicleAvailability(vehicleId: string): Promise<void> {
    const stillActive = await this.maintenanceRepository.isVehicleInMaintenance(vehicleId);
    if (stillActive) return;

    const vehicle = await this.vehicleRepository.findById(vehicleId);
    if (!vehicle) return;
    if (vehicle.status === VehicleStatus.RETIRED) return;
    if (vehicle.status === VehicleStatus.MAINTENANCE) {
      await this.vehicleRepository.updateStatus(vehicleId, VehicleStatus.AVAILABLE);
    }
  }

  private assertCostPositive(value: number, field: string): void {
    if (!(typeof value === 'number') || !(value > 0)) {
      throw new BadRequestException(`${field} must be greater than zero`);
    }
  }

  private toDateOnly(value: string | Date): Date {
    if (value instanceof Date) {
      return new Date(value.getFullYear(), value.getMonth(), value.getDate());
    }
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));
    if (match) {
      return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    }
    const parsed = new Date(value);
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  }

  private assertTodayOrFuture(value: string | Date, field: string): void {
    const date = this.toDateOnly(value);
    const today = this.toDateOnly(new Date());
    if (Number.isNaN(date.getTime()) || date.getTime() < today.getTime()) {
      throw new BadRequestException(`${field} must be today or a future date`);
    }
  }

  private assertScheduleDates(
    start: string | Date,
    expected: string | Date,
    nextServiceDue?: string | Date | null,
  ): void {
    this.assertTodayOrFuture(start, 'startDate');
    this.assertTodayOrFuture(expected, 'expectedCompletionDate');
    const startDate = this.toDateOnly(start);
    const expectedDate = this.toDateOnly(expected);
    if (expectedDate.getTime() < startDate.getTime()) {
      throw new BadRequestException('Expected completion date cannot be before start date');
    }
    if (nextServiceDue) {
      const nextDue = this.toDateOnly(nextServiceDue);
      if (Number.isNaN(nextDue.getTime()) || nextDue.getTime() <= expectedDate.getTime()) {
        throw new BadRequestException('nextServiceDue must be after expectedCompletionDate');
      }
    }
  }

  private assertTextLimits(input: {
    title?: string;
    description?: string;
    notes?: string;
  }): void {
    if (input.title !== undefined && input.title.length > 100) {
      throw new BadRequestException('title must be at most 100 characters');
    }
    if (input.description !== undefined && input.description.length > 500) {
      throw new BadRequestException('description must be at most 500 characters');
    }
    if (input.notes !== undefined && input.notes.length > 500) {
      throw new BadRequestException('notes must be at most 500 characters');
    }
  }

  private hasNonNotesUpdates(input: UpdateMaintenanceInput): boolean {
    const keys = Object.keys(input).filter((k) => k !== 'notes' && k !== 'updatedBy');
    return keys.some((k) => (input as Record<string, unknown>)[k] !== undefined);
  }

  private resolveVehicleId(doc: MaintenanceDocument): Types.ObjectId | string {
    const vehicle = doc.vehicleId as Types.ObjectId | VehicleDocument;
    if (vehicle && typeof vehicle === 'object' && '_id' in vehicle) {
      return vehicle._id as Types.ObjectId;
    }
    return vehicle;
  }

  private toIso(value?: Date | string | null): string | undefined {
    if (!value) return undefined;
    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? undefined : value.toISOString();
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
  }

  private toDto(doc: MaintenanceDocument): MaintenanceDto {
    const vehicle = doc.vehicleId as unknown as VehicleDocument | Types.ObjectId;
    const vehiclePopulated =
      vehicle && typeof vehicle === 'object' && ('vehicleId' in vehicle || 'vehicleNumber' in vehicle)
        ? (vehicle as VehicleDocument)
        : null;

    const attachments: MaintenanceAttachment[] = (doc.attachments ?? []).map((a) => ({
      filename: a.filename,
      originalName: a.originalName,
      mimeType: a.mimeType,
      size: a.size,
      url: a.url,
      uploadedAt: this.toIso(a.uploadedAt) ?? new Date().toISOString(),
    }));

    return {
      id: String(doc._id),
      vehicleId: vehiclePopulated
        ? String(vehiclePopulated._id)
        : String(doc.vehicleId),
      vehicleNumber: vehiclePopulated?.vehicleId || vehiclePopulated?.vehicleNumber,
      vehicleModel: vehiclePopulated?.model,
      maintenanceNumber: doc.maintenanceNumber ?? '—',
      maintenanceType: doc.maintenanceType,
      title: doc.title ?? 'Untitled',
      description: doc.description,
      priority: doc.priority,
      status: doc.status,
      startDate: this.toIso(doc.startDate) ?? new Date().toISOString(),
      expectedCompletionDate: this.toIso(doc.expectedCompletionDate) ?? new Date().toISOString(),
      completedDate: this.toIso(doc.completedDate),
      estimatedCost: doc.estimatedCost ?? 0,
      actualCost: doc.actualCost,
      vendorName: doc.vendorName,
      vendorPhone: doc.vendorPhone,
      serviceCenter: doc.serviceCenter,
      odometerReading: doc.odometerReading,
      nextServiceDue: this.toIso(doc.nextServiceDue),
      attachments,
      notes: doc.notes,
      createdBy: doc.createdBy,
      updatedBy: doc.updatedBy,
      createdAt: this.toIso(doc.createdAt) ?? new Date().toISOString(),
      updatedAt: this.toIso(doc.updatedAt) ?? new Date().toISOString(),
    };
  }
}
