import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DriverStatus, LicenseStatus } from '@transitops/shared-types';
import type { JwtPayload } from '@transitops/shared-types';
import { DriverRepository } from '../repository/driver.repository';
import { CreateDriverDto } from '../dto/create-driver.dto';
import { UpdateDriverDto } from '../dto/update-driver.dto';
import { QueryDriverDto } from '../dto/query-driver.dto';
import {
  DRIVER_DEFAULT_LIMIT,
  DRIVER_DEFAULT_PAGE,
} from '../constants/driver.constants';
import {
  computeLicenseStatus,
  isLicenseExpired,
  mapDriverToResponse,
} from './driver.mapper';
import { DriverDocument } from '../schema/driver.schema';

@Injectable()
export class DriverService {
  constructor(private readonly drivers: DriverRepository) {}

  async create(dto: CreateDriverDto, user?: JwtPayload) {
    await this.assertUniqueFields(dto);
    this.assertLicenseNotExpiredOnCreate(dto.licenseExpiryDate);
    this.assertAssignableStatus(dto.status, dto.licenseExpiryDate);

    const payload = this.toPersistence(dto, user?.sub, 'create');
    const created = await this.drivers.create(payload);
    return mapDriverToResponse(created);
  }

  async findAll(query: QueryDriverDto) {
    const page = query.page ?? DRIVER_DEFAULT_PAGE;
    const limit = query.limit ?? DRIVER_DEFAULT_LIMIT;
    const result = await this.drivers.findWithFilters({
      page,
      limit,
      sortBy: query.sortBy ?? 'createdAt',
      sortOrder: query.sortOrder ?? 'desc',
      filters: {
        search: query.search,
        status: query.status,
        licenseCategory: query.licenseCategory,
        city: query.city,
        state: query.state,
        experienceMin: query.experienceMin,
        experienceMax: query.experienceMax,
      },
    });

    return {
      data: result.items.map(mapDriverToResponse),
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
      message: 'Drivers retrieved successfully',
    };
  }

  async findById(id: string) {
    const driver = await this.requireDriver(id);
    return mapDriverToResponse(driver);
  }

  async update(id: string, dto: UpdateDriverDto, user?: JwtPayload) {
    const existing = await this.requireDriver(id);
    await this.assertUniqueFields(dto, id);

    const nextExpiry = dto.licenseExpiryDate
      ? new Date(dto.licenseExpiryDate)
      : existing.licenseExpiryDate;

    if (dto.licenseExpiryDate && isLicenseExpired(nextExpiry)) {
      throw new BadRequestException('License expiry must be greater than today');
    }

    if (dto.status !== undefined) {
      this.assertStatusTransition(existing, dto.status, nextExpiry);
    }

    const payload = this.toPersistence(dto, user?.sub, 'update', existing);
    const updated = await this.drivers.update(id, payload);
    if (!updated) {
      throw new NotFoundException(`Driver ${id} not found`);
    }
    return mapDriverToResponse(updated);
  }

  async softDelete(id: string, user?: JwtPayload) {
    await this.requireDriver(id);
    const deleted = await this.drivers.softDelete(id, {
      deletedAt: new Date(),
      deletedBy: user?.sub,
    });
    if (!deleted) {
      throw new NotFoundException(`Driver ${id} not found`);
    }
    return { id, deleted: true };
  }

  async updateDriverStatus(id: string, status: DriverStatus, user?: JwtPayload) {
    const existing = await this.requireDriver(id);
    this.assertStatusTransition(existing, status, existing.licenseExpiryDate);
    const updated = await this.drivers.update(id, {
      status,
      updatedBy: user?.sub,
    });
    if (!updated) {
      throw new NotFoundException(`Driver ${id} not found`);
    }
    return mapDriverToResponse(updated);
  }

  async updateSafetyScore(id: string, safetyScore: number, user?: JwtPayload) {
    if (safetyScore < 0 || safetyScore > 100) {
      throw new BadRequestException('Safety score must be between 0 and 100');
    }
    await this.requireDriver(id);
    const updated = await this.drivers.update(id, {
      safetyScore,
      updatedBy: user?.sub,
    });
    if (!updated) {
      throw new NotFoundException(`Driver ${id} not found`);
    }
    return mapDriverToResponse(updated);
  }

  /** Reusable for Trip module — available drivers with valid licenses */
  async getAvailableDrivers() {
    const items = await this.drivers.findAvailable();
    return items.map(mapDriverToResponse);
  }

  /** Reusable for Trip module — license validity check */
  async validateDriverLicense(id: string): Promise<{
    valid: boolean;
    status: LicenseStatus;
    licenseExpiryDate: string;
    message: string;
  }> {
    const driver = await this.requireDriver(id);
    const status = computeLicenseStatus(driver.licenseExpiryDate);
    const valid = status !== LicenseStatus.EXPIRED;
    return {
      valid,
      status,
      licenseExpiryDate: driver.licenseExpiryDate.toISOString(),
      message: valid
        ? status === LicenseStatus.EXPIRING
          ? 'License is valid but expiring soon'
          : 'License is valid'
        : 'License is expired — driver cannot be assigned to a trip',
    };
  }

  async getDriverStatistics() {
    return this.drivers.getStatistics();
  }

  /** Trip module helper — throws if driver cannot be assigned */
  async assertAssignableToTrip(id: string): Promise<ReturnType<typeof mapDriverToResponse>> {
    const driver = await this.requireDriver(id);
    if (driver.status === DriverStatus.SUSPENDED) {
      throw new BadRequestException('Suspended driver cannot be assigned to a trip');
    }
    if (driver.status === DriverStatus.ON_TRIP) {
      throw new BadRequestException('Driver is already on a trip');
    }
    if (isLicenseExpired(driver.licenseExpiryDate)) {
      throw new BadRequestException('Expired license cannot be assigned to a trip');
    }
    if (driver.status !== DriverStatus.AVAILABLE) {
      throw new BadRequestException('Only available drivers can be assigned to a trip');
    }
    return mapDriverToResponse(driver);
  }

  private async requireDriver(id: string): Promise<DriverDocument> {
    const driver = await this.drivers.findById(id);
    if (!driver) {
      throw new NotFoundException(`Driver ${id} not found`);
    }
    return driver;
  }

  private async assertUniqueFields(
    dto: Partial<CreateDriverDto | UpdateDriverDto>,
    excludeId?: string,
  ) {
    const checks: Array<{
      field: string;
      value?: string;
      finder: (value: string, excludeId?: string) => Promise<DriverDocument | null>;
    }> = [
      {
        field: 'employeeCode',
        value: dto.employeeCode,
        finder: (v, id) => this.drivers.findByEmployeeCode(v, id),
      },
      {
        field: 'email',
        value: dto.email,
        finder: (v, id) => this.drivers.findByEmail(v, id),
      },
      {
        field: 'phone',
        value: dto.phone,
        finder: (v, id) => this.drivers.findByPhone(v, id),
      },
      {
        field: 'licenseNumber',
        value: dto.licenseNumber,
        finder: (v, id) => this.drivers.findByLicenseNumber(v, id),
      },
    ];

    for (const check of checks) {
      if (!check.value) continue;
      const existing = await check.finder(check.value, excludeId);
      if (existing) {
        throw new ConflictException(`Driver with this ${check.field} already exists`);
      }
    }
  }

  private assertLicenseNotExpiredOnCreate(licenseExpiryDate: string) {
    if (isLicenseExpired(new Date(licenseExpiryDate))) {
      throw new BadRequestException('License expiry must be greater than today');
    }
  }

  private assertAssignableStatus(status: DriverStatus | undefined, licenseExpiryDate: string) {
    if (!status || status !== DriverStatus.AVAILABLE) return;
    if (isLicenseExpired(new Date(licenseExpiryDate))) {
      throw new BadRequestException('Expired license cannot become Available');
    }
  }

  private assertStatusTransition(
    existing: DriverDocument,
    nextStatus: DriverStatus,
    licenseExpiryDate: Date,
  ) {
    if (nextStatus === DriverStatus.AVAILABLE) {
      if (existing.status === DriverStatus.SUSPENDED) {
        throw new BadRequestException('Suspended driver cannot become Available');
      }
      if (isLicenseExpired(licenseExpiryDate)) {
        throw new BadRequestException('Expired license cannot become Available');
      }
    }
  }

  private toPersistence(
    dto: CreateDriverDto | UpdateDriverDto,
    userId: string | undefined,
    mode: 'create' | 'update',
    existing?: DriverDocument,
  ): Partial<DriverDocument> {
    const data: Partial<DriverDocument> = {};

    const stringFields = [
      'firstName',
      'lastName',
      'email',
      'phone',
      'alternatePhone',
      'address',
      'city',
      'state',
      'country',
      'postalCode',
      'emergencyName',
      'emergencyPhone',
      'photo',
      'remarks',
      'employeeCode',
      'licenseNumber',
    ] as const;

    for (const field of stringFields) {
      const value = dto[field as keyof typeof dto];
      if (value !== undefined) {
        (data as Record<string, unknown>)[field] = value;
      }
    }

    if (dto.employeeCode !== undefined) {
      data.employeeCode = dto.employeeCode.toUpperCase().trim();
    }
    if (dto.licenseNumber !== undefined) {
      data.licenseNumber = dto.licenseNumber.toUpperCase().trim();
    }
    if (dto.email !== undefined) {
      data.email = dto.email.toLowerCase().trim();
    }

    if (dto.licenseCategory !== undefined) data.licenseCategory = dto.licenseCategory;
    if (dto.bloodGroup !== undefined) data.bloodGroup = dto.bloodGroup;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.experienceYears !== undefined) data.experienceYears = dto.experienceYears;
    if (dto.safetyScore !== undefined) data.safetyScore = dto.safetyScore;
    if (dto.documents !== undefined) {
      data.documents = dto.documents.map((d) => ({
        name: d.name,
        url: d.url,
        type: d.type,
        uploadedAt: d.uploadedAt ? new Date(d.uploadedAt) : new Date(),
      }));
    }

    if (dto.dateOfBirth !== undefined) data.dateOfBirth = new Date(dto.dateOfBirth);
    if (dto.joiningDate !== undefined) data.joiningDate = new Date(dto.joiningDate);
    if (dto.licenseIssueDate !== undefined) {
      data.licenseIssueDate = new Date(dto.licenseIssueDate);
    }
    if (dto.licenseExpiryDate !== undefined) {
      data.licenseExpiryDate = new Date(dto.licenseExpiryDate);
    }

    const firstName = dto.firstName ?? existing?.firstName;
    const lastName = dto.lastName ?? existing?.lastName;
    if (firstName && lastName) {
      data.fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    }

    if (mode === 'create') {
      data.isDeleted = false;
      data.status = dto.status ?? DriverStatus.AVAILABLE;
      data.safetyScore = dto.safetyScore ?? 100;
      data.createdBy = userId;
      data.documents = data.documents ?? [];
    } else {
      data.updatedBy = userId;
    }

    return data;
  }
}
