import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { DriverStatus, RoleCode, TripStatus, VehicleStatus, type JwtPayload } from '@transitops/shared-types';
import { VehicleService } from '../../vehicle/vehicle.service';
import { DriverService } from '../../driver/service/driver.service';
import { TripRepository } from '../repository/trip.repository';
import { TripValidators } from '../validators/trip.validators';
import {
  CancelTripDto,
  CompleteTripDto,
  CreateTripDto,
  QueryTripDto,
  UpdateTripDto,
} from '../dto/trip.dto';
import {
  CANCELLABLE_STATUSES,
  COMPLETABLE_STATUSES,
  DISPATCHABLE_STATUSES,
  STARTABLE_STATUSES,
} from '../constants/trip.constants';
import { TripDocument } from '../schema/trip.schema';

@Injectable()
export class TripService {
  constructor(
    private readonly trips: TripRepository,
    private readonly validators: TripValidators,
    private readonly vehicleService: VehicleService,
    private readonly driverService: DriverService,
  ) {}

  async createTrip(dto: CreateTripDto, user?: JwtPayload) {
    await this.validateTrip({
      vehicleId: dto.vehicleId,
      driverId: dto.driverId,
      cargoWeight: dto.cargoWeight,
      plannedStartDate: new Date(dto.plannedStartDate),
      plannedEndDate: new Date(dto.plannedEndDate),
    });

    const tripNumber = await this.trips.nextTripNumber();
    return this.trips.create({
      ...dto,
      tripNumber,
      vehicleId: new Types.ObjectId(dto.vehicleId),
      driverId: new Types.ObjectId(dto.driverId),
      plannedStartDate: new Date(dto.plannedStartDate),
      plannedEndDate: new Date(dto.plannedEndDate),
      status: TripStatus.DRAFT,
      createdBy: user?.sub ? new Types.ObjectId(user.sub) : undefined,
      tripDocuments: dto.tripDocuments?.map((doc) => ({
        ...doc,
        uploadedAt: new Date(),
      })),
    });
  }

  async findAll(query: QueryTripDto, user?: JwtPayload) {
    const extra = await this.scopeFilterForUser(user);
    const result = await this.trips.findMany(query, extra);
    return {
      data: result.data,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }

  async findOne(id: string, user?: JwtPayload) {
    const trip = await this.requireTrip(id);
    await this.assertCanReadTrip(trip, user);
    return trip;
  }

  async updateTrip(id: string, dto: UpdateTripDto, user?: JwtPayload) {
    const trip = await this.requireTrip(id);
    if (trip.status !== TripStatus.DRAFT) {
      throw new BadRequestException('Only draft trips can be updated');
    }

    const vehicleId = dto.vehicleId ?? String(trip.vehicleId);
    const driverId = dto.driverId ?? String(trip.driverId);
    const cargoWeight = dto.cargoWeight ?? trip.cargoWeight;
    const plannedStartDate = dto.plannedStartDate
      ? new Date(dto.plannedStartDate)
      : trip.plannedStartDate;
    const plannedEndDate = dto.plannedEndDate ? new Date(dto.plannedEndDate) : trip.plannedEndDate;

    await this.validateTrip({
      vehicleId,
      driverId,
      cargoWeight,
      plannedStartDate,
      plannedEndDate,
      excludeTripId: id,
    });

    return this.trips.update(id, {
      ...dto,
      vehicleId: dto.vehicleId ? new Types.ObjectId(dto.vehicleId) : undefined,
      driverId: dto.driverId ? new Types.ObjectId(dto.driverId) : undefined,
      plannedStartDate: dto.plannedStartDate ? new Date(dto.plannedStartDate) : undefined,
      plannedEndDate: dto.plannedEndDate ? new Date(dto.plannedEndDate) : undefined,
      updatedBy: user?.sub ? new Types.ObjectId(user.sub) : undefined,
    });
  }

  async softDelete(id: string, user?: JwtPayload) {
    const trip = await this.requireTrip(id);
    if (trip.status === TripStatus.IN_PROGRESS || trip.status === TripStatus.DISPATCHED) {
      throw new BadRequestException('Cancel the trip before deleting an active dispatch');
    }
    const deleted = await this.trips.softDelete(id, user?.sub);
    if (!deleted) throw new NotFoundException(`Trip ${id} not found`);
    return deleted;
  }

  async dispatchTrip(id: string, user?: JwtPayload) {
    const trip = await this.requireTrip(id);
    if (!DISPATCHABLE_STATUSES.includes(trip.status)) {
      throw new BadRequestException(`Cannot dispatch trip in status ${trip.status}`);
    }

    const vehicleId = this.refId(trip.vehicleId);
    const driverId = this.refId(trip.driverId);

    await this.validateTrip({
      vehicleId,
      driverId,
      cargoWeight: trip.cargoWeight,
      plannedStartDate: trip.plannedStartDate,
      plannedEndDate: trip.plannedEndDate,
      excludeTripId: id,
    });

    await Promise.all([
      this.vehicleService.updateStatus(vehicleId, VehicleStatus.ON_TRIP),
      this.driverService.updateDriverStatus(driverId, DriverStatus.ON_TRIP, user),
    ]);

    return this.trips.update(id, {
      status: TripStatus.DISPATCHED,
      updatedBy: user?.sub ? new Types.ObjectId(user.sub) : undefined,
    });
  }

  async startTrip(id: string, user?: JwtPayload) {
    const trip = await this.requireTrip(id);
    if (!STARTABLE_STATUSES.includes(trip.status)) {
      throw new BadRequestException(`Cannot start trip in status ${trip.status}`);
    }

    return this.trips.update(id, {
      status: TripStatus.IN_PROGRESS,
      actualStartDate: new Date(),
      updatedBy: user?.sub ? new Types.ObjectId(user.sub) : undefined,
    });
  }

  async completeTrip(id: string, dto: CompleteTripDto, user?: JwtPayload) {
    const trip = await this.requireTrip(id);
    if (!COMPLETABLE_STATUSES.includes(trip.status)) {
      throw new BadRequestException(`Cannot complete trip in status ${trip.status}`);
    }

    const vehicleId = this.refId(trip.vehicleId);
    const driverId = this.refId(trip.driverId);

    await Promise.all([
      this.vehicleService.updateStatus(vehicleId, VehicleStatus.AVAILABLE),
      this.driverService.updateDriverStatus(driverId, DriverStatus.AVAILABLE, user),
    ]);

    return this.trips.update(id, {
      status: TripStatus.COMPLETED,
      actualEndDate: new Date(),
      actualDistance: dto.actualDistance,
      fuelConsumed: dto.fuelConsumed,
      actualRevenue: dto.actualRevenue,
      notes: dto.notes ?? trip.notes,
      updatedBy: user?.sub ? new Types.ObjectId(user.sub) : undefined,
    });
  }

  async cancelTrip(id: string, dto: CancelTripDto, user?: JwtPayload) {
    const trip = await this.requireTrip(id);
    if (!CANCELLABLE_STATUSES.includes(trip.status)) {
      throw new BadRequestException(`Cannot cancel trip in status ${trip.status}`);
    }

    const vehicleId = this.refId(trip.vehicleId);
    const driverId = this.refId(trip.driverId);

    if (trip.status === TripStatus.DISPATCHED || trip.status === TripStatus.IN_PROGRESS) {
      await Promise.all([
        this.vehicleService.updateStatus(vehicleId, VehicleStatus.AVAILABLE),
        this.driverService.updateDriverStatus(driverId, DriverStatus.AVAILABLE, user),
      ]);
    }

    const noteParts = [trip.notes, dto.reason ? `Cancel reason: ${dto.reason}` : null, dto.notes]
      .filter(Boolean)
      .join('\n');

    return this.trips.update(id, {
      status: TripStatus.CANCELLED,
      notes: noteParts || undefined,
      updatedBy: user?.sub ? new Types.ObjectId(user.sub) : undefined,
    });
  }

  async validateTrip(params: {
    vehicleId: string;
    driverId: string;
    cargoWeight: number;
    plannedStartDate?: Date;
    plannedEndDate?: Date;
    excludeTripId?: string;
  }) {
    const [vehicleHasActiveTrip, driverHasActiveTrip] = await Promise.all([
      this.trips.hasActiveTripForVehicle(params.vehicleId, params.excludeTripId),
      this.trips.hasActiveTripForDriver(params.driverId, params.excludeTripId),
    ]);

    const result = await this.validators.buildValidationContext({
      ...params,
      vehicleHasActiveTrip,
      driverHasActiveTrip,
    });
    this.validators.assertValid(result);
    return result;
  }

  getAvailableVehicles() {
    return this.vehicleService.findAvailable();
  }

  getAvailableDrivers() {
    return this.driverService.getAvailableDrivers();
  }

  async getTripStatistics(user?: JwtPayload) {
    const extra = await this.scopeFilterForUser(user);
    return this.trips.getStatistics(extra);
  }

  private async requireTrip(id: string): Promise<TripDocument> {
    const trip = await this.trips.findById(id);
    if (!trip) throw new NotFoundException(`Trip ${id} not found`);
    return trip;
  }

  private refId(value: Types.ObjectId | { _id: Types.ObjectId } | string): string {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object' && '_id' in value) {
      return String(value._id);
    }
    return String(value);
  }

  private async scopeFilterForUser(user?: JwtPayload) {
    if (!user?.roles?.length) return {};

    const elevated = [
      RoleCode.SUPER_ADMIN,
      RoleCode.ADMIN,
      RoleCode.FLEET_MANAGER,
      RoleCode.DISPATCHER,
      RoleCode.SAFETY_OFFICER,
      RoleCode.FINANCIAL_ANALYST,
      RoleCode.VIEWER,
    ];

    if (user.roles.some((r) => elevated.includes(r))) {
      return {};
    }

    if (user.roles.includes(RoleCode.OPERATOR)) {
      return { createdBy: new Types.ObjectId(user.sub) };
    }

    throw new ForbiddenException('Insufficient permissions for trips');
  }

  private async assertCanReadTrip(trip: TripDocument, user?: JwtPayload) {
    if (!user) return;
    const elevated = [
      RoleCode.SUPER_ADMIN,
      RoleCode.ADMIN,
      RoleCode.FLEET_MANAGER,
      RoleCode.DISPATCHER,
      RoleCode.SAFETY_OFFICER,
      RoleCode.FINANCIAL_ANALYST,
      RoleCode.VIEWER,
    ];
    if (user.roles.some((r) => elevated.includes(r))) return;

    if (user.roles.includes(RoleCode.OPERATOR)) {
      if (trip.createdBy && String(trip.createdBy) === user.sub) return;
    }

    throw new ForbiddenException('You can only view your own trips');
  }
}
