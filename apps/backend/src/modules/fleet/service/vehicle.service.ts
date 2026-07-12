import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ComplianceStatus, VehicleStatus } from '@transitops/shared-types';
import type { JwtPayload } from '@transitops/shared-types';
import { VehicleRepository } from '../repository/vehicle.repository';
import { CreateVehicleDto } from '../dto/create-vehicle.dto';
import { UpdateVehicleDto } from '../dto/update-vehicle.dto';
import { QueryVehicleDto } from '../dto/query-vehicle.dto';
import {
  VEHICLE_DEFAULT_LIMIT,
  VEHICLE_DEFAULT_PAGE,
} from '../constants/fleet.constants';
import {
  computeComplianceStatus,
  hasExpiredCompliance,
  isComplianceExpired,
  mapVehicleToResponse,
} from './vehicle.mapper';
import { VehicleDocument } from '../schema/vehicle.schema';
import { startOfToday, toDateOnly } from '../validators/fleet.validators';

@Injectable()
export class VehicleService {
  constructor(private readonly vehicles: VehicleRepository) {}

  async create(dto: CreateVehicleDto, user?: JwtPayload) {
    await this.assertUniqueFields(dto);
    this.assertComplianceNotExpiredOnCreate(dto);
    this.assertServiceDates(dto);
    this.assertMaxCapacity(dto.maxCapacity);
    this.assertAssignableStatus(dto.status, dto);

    const payload = this.toPersistence(dto, user?.sub, 'create');
    const created = await this.vehicles.create(payload);
    return mapVehicleToResponse(created);
  }

  async findAll(query: QueryVehicleDto) {
    const page = query.page ?? VEHICLE_DEFAULT_PAGE;
    const limit = query.limit ?? VEHICLE_DEFAULT_LIMIT;
    const result = await this.vehicles.findWithFilters({
      page,
      limit,
      sortBy: query.sortBy ?? 'createdAt',
      sortOrder: query.sortOrder ?? 'desc',
      filters: {
        search: query.search,
        status: query.status,
        vehicleType: query.vehicleType,
        fuelType: query.fuelType,
        depotCity: query.depotCity,
        depotState: query.depotState,
        yearMin: query.yearMin,
        yearMax: query.yearMax,
        mileageMin: query.mileageMin,
        mileageMax: query.mileageMax,
      },
    });

    return {
      data: result.items.map(mapVehicleToResponse),
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
      message: 'Vehicles retrieved successfully',
    };
  }

  async findById(id: string) {
    const vehicle = await this.requireVehicle(id);
    return mapVehicleToResponse(vehicle);
  }

  async update(id: string, dto: UpdateVehicleDto, user?: JwtPayload) {
    const existing = await this.requireVehicle(id);
    await this.assertUniqueFields(dto, id);

    const nextCompliance = {
      registrationExpiryDate: dto.registrationExpiryDate
        ? new Date(dto.registrationExpiryDate)
        : existing.registrationExpiryDate,
      insuranceExpiryDate: dto.insuranceExpiryDate
        ? new Date(dto.insuranceExpiryDate)
        : existing.insuranceExpiryDate,
      fitnessCertificateExpiryDate: dto.fitnessCertificateExpiryDate
        ? new Date(dto.fitnessCertificateExpiryDate)
        : existing.fitnessCertificateExpiryDate,
    };

    if (
      dto.registrationExpiryDate &&
      isComplianceExpired(nextCompliance.registrationExpiryDate)
    ) {
      throw new BadRequestException('Registration expiry must be greater than today');
    }
    if (dto.insuranceExpiryDate && isComplianceExpired(nextCompliance.insuranceExpiryDate)) {
      throw new BadRequestException('Insurance expiry must be greater than today');
    }
    if (
      dto.fitnessCertificateExpiryDate &&
      isComplianceExpired(nextCompliance.fitnessCertificateExpiryDate)
    ) {
      throw new BadRequestException('Fitness certificate expiry must be greater than today');
    }

    this.assertServiceDates(dto, existing);
    if (dto.maxCapacity !== undefined) {
      this.assertMaxCapacity(dto.maxCapacity);
    }

    if (dto.status !== undefined) {
      this.assertStatusTransition(existing, dto.status, nextCompliance);
    }

    if (dto.mileage !== undefined && dto.mileage < existing.mileage) {
      throw new BadRequestException('Mileage cannot be less than the current reading');
    }

    const payload = this.toPersistence(dto, user?.sub, 'update');
    const updated = await this.vehicles.update(id, payload);
    if (!updated) {
      throw new NotFoundException(`Vehicle ${id} not found`);
    }
    return mapVehicleToResponse(updated);
  }

  async softDelete(id: string, user?: JwtPayload) {
    await this.requireVehicle(id);
    const deleted = await this.vehicles.softDelete(id, {
      deletedAt: new Date(),
      deletedBy: user?.sub,
    });
    if (!deleted) {
      throw new NotFoundException(`Vehicle ${id} not found`);
    }
    return { id, deleted: true };
  }

  async updateVehicleStatus(id: string, status: VehicleStatus, user?: JwtPayload) {
    const existing = await this.requireVehicle(id);
    this.assertStatusTransition(existing, status, {
      registrationExpiryDate: existing.registrationExpiryDate,
      insuranceExpiryDate: existing.insuranceExpiryDate,
      fitnessCertificateExpiryDate: existing.fitnessCertificateExpiryDate,
    });
    const updated = await this.vehicles.update(id, {
      status,
      updatedBy: user?.sub,
    });
    if (!updated) {
      throw new NotFoundException(`Vehicle ${id} not found`);
    }
    return mapVehicleToResponse(updated);
  }

  async updateMileage(id: string, mileage: number, user?: JwtPayload) {
    const existing = await this.requireVehicle(id);
    if (mileage < existing.mileage) {
      throw new BadRequestException('Mileage cannot be less than the current reading');
    }
    await this.requireVehicle(id);
    const updated = await this.vehicles.update(id, {
      mileage,
      updatedBy: user?.sub,
    });
    if (!updated) {
      throw new NotFoundException(`Vehicle ${id} not found`);
    }
    return mapVehicleToResponse(updated);
  }

  async getAvailableVehicles() {
    const items = await this.vehicles.findAvailable();
    return items.map(mapVehicleToResponse);
  }

  async validateVehicleCompliance(id: string): Promise<{
    valid: boolean;
    registrationStatus: ComplianceStatus;
    insuranceStatus: ComplianceStatus;
    fitnessStatus: ComplianceStatus;
    message: string;
  }> {
    const vehicle = await this.requireVehicle(id);
    const registrationStatus = computeComplianceStatus(vehicle.registrationExpiryDate);
    const insuranceStatus = computeComplianceStatus(vehicle.insuranceExpiryDate);
    const fitnessStatus = computeComplianceStatus(vehicle.fitnessCertificateExpiryDate);
    const valid =
      registrationStatus !== ComplianceStatus.EXPIRED &&
      insuranceStatus !== ComplianceStatus.EXPIRED &&
      fitnessStatus !== ComplianceStatus.EXPIRED;

    return {
      valid,
      registrationStatus,
      insuranceStatus,
      fitnessStatus,
      message: valid
        ? 'Vehicle compliance documents are valid'
        : 'Vehicle has expired compliance documents and cannot be assigned to a trip',
    };
  }

  async getVehicleStatistics() {
    return this.vehicles.getStatistics();
  }

  async assertAssignableToTrip(id: string): Promise<ReturnType<typeof mapVehicleToResponse>> {
    const vehicle = await this.requireVehicle(id);
    if (vehicle.status === VehicleStatus.RETIRED) {
      throw new BadRequestException('Retired vehicle cannot be assigned to a trip');
    }
    if (vehicle.status === VehicleStatus.ON_TRIP) {
      throw new BadRequestException('Vehicle is already on a trip');
    }
    if (vehicle.status === VehicleStatus.MAINTENANCE) {
      throw new BadRequestException('Vehicle under maintenance cannot be assigned to a trip');
    }
    if (hasExpiredCompliance(vehicle)) {
      throw new BadRequestException(
        'Vehicle with expired compliance documents cannot be assigned to a trip',
      );
    }
    if (vehicle.status !== VehicleStatus.AVAILABLE) {
      throw new BadRequestException('Only available vehicles can be assigned to a trip');
    }
    return mapVehicleToResponse(vehicle);
  }

  private async requireVehicle(id: string): Promise<VehicleDocument> {
    const vehicle = await this.vehicles.findById(id);
    if (!vehicle) {
      throw new NotFoundException(`Vehicle ${id} not found`);
    }
    return vehicle;
  }

  private async assertUniqueFields(
    dto: Partial<CreateVehicleDto | UpdateVehicleDto>,
    excludeId?: string,
  ) {
    const checks: Array<{
      field: string;
      value?: string;
      finder: (value: string, excludeId?: string) => Promise<VehicleDocument | null>;
    }> = [
      {
        field: 'vehicleId',
        value: dto.vehicleId,
        finder: (v, id) => this.vehicles.findByVehicleId(v, id),
      },
      {
        field: 'registrationNumber',
        value: dto.registrationNumber,
        finder: (v, id) => this.vehicles.findByRegistrationNumber(v, id),
      },
      {
        field: 'vin',
        value: dto.vin,
        finder: (v, id) => this.vehicles.findByVin(v, id),
      },
    ];

    for (const check of checks) {
      if (!check.value) continue;
      const existing = await check.finder(check.value, excludeId);
      if (existing) {
        throw new ConflictException(`Vehicle with this ${check.field} already exists`);
      }
    }
  }

  private assertComplianceNotExpiredOnCreate(dto: CreateVehicleDto) {
    if (isComplianceExpired(new Date(dto.registrationExpiryDate))) {
      throw new BadRequestException('Registration expiry must be greater than today');
    }
    if (isComplianceExpired(new Date(dto.insuranceExpiryDate))) {
      throw new BadRequestException('Insurance expiry must be greater than today');
    }
    if (isComplianceExpired(new Date(dto.fitnessCertificateExpiryDate))) {
      throw new BadRequestException('Fitness certificate expiry must be greater than today');
    }
  }

  private assertMaxCapacity(maxCapacity: number) {
    if (maxCapacity < 1 || maxCapacity > 500) {
      throw new BadRequestException('Maximum load capacity must be between 1 and 500 kg');
    }
  }

  private assertServiceDates(
    dto: { lastServiceDate?: string; nextServiceDueDate?: string },
    existing?: { lastServiceDate?: Date | null; nextServiceDueDate?: Date | null },
  ) {
    const today = startOfToday().getTime();
    const lastRaw = dto.lastServiceDate ?? (existing?.lastServiceDate
      ? existing.lastServiceDate.toISOString().slice(0, 10)
      : undefined);
    const nextRaw = dto.nextServiceDueDate;

    if (dto.lastServiceDate) {
      const last = toDateOnly(dto.lastServiceDate);
      if (!last || last.getTime() > today) {
        throw new BadRequestException('Last service date must be today or a past date');
      }
    }

    if (nextRaw) {
      const next = toDateOnly(nextRaw);
      if (!next || next.getTime() <= today) {
        throw new BadRequestException('Next service due must be greater than today');
      }
      if (lastRaw) {
        const last = toDateOnly(lastRaw);
        if (last && next.getTime() < last.getTime()) {
          throw new BadRequestException(
            'Next service due must be on or after last service date',
          );
        }
      }
    }
  }

  private assertAssignableStatus(
    status: VehicleStatus | undefined,
    dto: Pick<
      CreateVehicleDto,
      'registrationExpiryDate' | 'insuranceExpiryDate' | 'fitnessCertificateExpiryDate'
    >,
  ) {
    if (!status || status !== VehicleStatus.AVAILABLE) return;
    if (
      isComplianceExpired(new Date(dto.registrationExpiryDate)) ||
      isComplianceExpired(new Date(dto.insuranceExpiryDate)) ||
      isComplianceExpired(new Date(dto.fitnessCertificateExpiryDate))
    ) {
      throw new BadRequestException('Non-compliant vehicle cannot become Available');
    }
  }

  private assertStatusTransition(
    existing: VehicleDocument,
    nextStatus: VehicleStatus,
    compliance: {
      registrationExpiryDate: Date;
      insuranceExpiryDate: Date;
      fitnessCertificateExpiryDate: Date;
    },
  ) {
    if (nextStatus === VehicleStatus.AVAILABLE) {
      if (existing.status === VehicleStatus.RETIRED) {
        throw new BadRequestException('Retired vehicle cannot become Available');
      }
      // ON_TRIP → AVAILABLE is allowed when a trip is completed or cancelled.
      if (
        existing.status !== VehicleStatus.ON_TRIP &&
        (isComplianceExpired(compliance.registrationExpiryDate) ||
          isComplianceExpired(compliance.insuranceExpiryDate) ||
          isComplianceExpired(compliance.fitnessCertificateExpiryDate))
      ) {
        throw new BadRequestException('Non-compliant vehicle cannot become Available');
      }
    }
  }

  private toPersistence(
    dto: CreateVehicleDto | UpdateVehicleDto,
    userId: string | undefined,
    mode: 'create' | 'update',
  ): Partial<VehicleDocument> {
    const data: Partial<VehicleDocument> = {};

    const stringFields = [
      'vehicleId',
      'registrationNumber',
      'vin',
      'make',
      'model',
      'color',
      'depotCity',
      'depotState',
      'country',
      'photo',
      'remarks',
    ] as const;

    for (const field of stringFields) {
      const value = dto[field as keyof typeof dto];
      if (value !== undefined) {
        (data as Record<string, unknown>)[field] = value;
      }
    }

    if (dto.vehicleId !== undefined) {
      data.vehicleId = dto.vehicleId.toUpperCase().trim();
    }
    if (dto.registrationNumber !== undefined) {
      data.registrationNumber = dto.registrationNumber.toUpperCase().trim();
    }
    if (dto.vin !== undefined) {
      data.vin = dto.vin.toUpperCase().trim();
    }

    if (dto.vehicleType !== undefined) data.vehicleType = dto.vehicleType;
    if (dto.fuelType !== undefined) data.fuelType = dto.fuelType;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.year !== undefined) data.year = dto.year;
    if (dto.seatingCapacity !== undefined) data.seatingCapacity = dto.seatingCapacity;
    if (dto.maxCapacity !== undefined) data.maxCapacity = dto.maxCapacity;
    if (dto.mileage !== undefined) data.mileage = dto.mileage;
    if (dto.documents !== undefined) {
      data.documents = dto.documents.map((d) => ({
        name: d.name,
        url: d.url,
        type: d.type,
        uploadedAt: d.uploadedAt ? new Date(d.uploadedAt) : new Date(),
      }));
    }

    if (dto.purchaseDate !== undefined) data.purchaseDate = new Date(dto.purchaseDate);
    if (dto.registrationExpiryDate !== undefined) {
      data.registrationExpiryDate = new Date(dto.registrationExpiryDate);
    }
    if (dto.insuranceExpiryDate !== undefined) {
      data.insuranceExpiryDate = new Date(dto.insuranceExpiryDate);
    }
    if (dto.fitnessCertificateExpiryDate !== undefined) {
      data.fitnessCertificateExpiryDate = new Date(dto.fitnessCertificateExpiryDate);
    }
    if (dto.lastServiceDate !== undefined) data.lastServiceDate = new Date(dto.lastServiceDate);
    if (dto.nextServiceDueDate !== undefined) {
      data.nextServiceDueDate = new Date(dto.nextServiceDueDate);
    }

    if (mode === 'create') {
      data.isDeleted = false;
      data.status = dto.status ?? VehicleStatus.AVAILABLE;
      data.createdBy = userId;
      data.documents = data.documents ?? [];
    } else {
      data.updatedBy = userId;
    }

    return data;
  }
}
