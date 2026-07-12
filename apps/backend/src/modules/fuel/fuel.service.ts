import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import type { FuelStatistics } from '@transitops/shared-types';
import { RoleCode } from '@transitops/shared-types';

type AuthUser = { sub: string; roles: RoleCode[] };
import { FuelRepository } from '../../repositories/fuel.repository';
import { ReferenceValidationService } from '../integration/reference-validation.service';
import { CostCalculationService } from '../integration/cost-calculation.service';
import { CreateFuelDto } from './dto/create-fuel.dto';
import { FuelQueryDto } from './dto/fuel-query.dto';
import { UpdateFuelDto } from './dto/update-fuel.dto';
import { toFuelDto, toFuelDtoList } from './fuel.mapper';

@Injectable()
export class FuelService {
  constructor(
    private readonly fuelRepository: FuelRepository,
    private readonly referenceValidation: ReferenceValidationService,
    private readonly costCalculation: CostCalculationService,
  ) {}

  async createFuelLog(dto: CreateFuelDto, user?: AuthUser) {
    await this.validateReferences(dto);
    const totalCost = Math.round(dto.quantity * dto.pricePerLiter * 100) / 100;

    const fuel = await this.fuelRepository.create({
      vehicleId: dto.vehicleId.toUpperCase(),
      tripId: dto.tripId?.toUpperCase(),
      driverId: dto.driverId?.toUpperCase(),
      fuelStation: dto.fuelStation.trim(),
      fuelType: dto.fuelType,
      quantity: dto.quantity,
      pricePerLiter: dto.pricePerLiter,
      totalCost,
      odometerReading: dto.odometerReading,
      filledAt: new Date(dto.filledAt),
      receiptImage: dto.receiptImage,
      notes: dto.notes?.trim(),
      createdBy: user?.sub ? new Types.ObjectId(user.sub) : undefined,
    });

    return toFuelDto(fuel);
  }

  async findAll(query: FuelQueryDto, user?: AuthUser) {
    const createdBy = this.getOwnerFilter(user);
    const { items, total, page, limit } = await this.fuelRepository.findPaginated({
      ...query,
      createdBy,
    });
    const totalPages = Math.ceil(total / limit) || 1;
    return {
      data: toFuelDtoList(items),
      meta: { page, limit, total, totalPages },
    };
  }

  async findById(id: string, user?: AuthUser) {
    const fuel = await this.fuelRepository.findById(id);
    if (!fuel) throw new NotFoundException(`Fuel log with id "${id}" not found`);
    this.assertOwnerAccess(fuel.createdBy?.toString(), user);
    return toFuelDto(fuel);
  }

  async update(id: string, dto: UpdateFuelDto, user?: AuthUser) {
    const existing = await this.fuelRepository.findById(id);
    if (!existing) throw new NotFoundException(`Fuel log with id "${id}" not found`);
    this.assertOwnerAccess(existing.createdBy?.toString(), user);

    if (dto.vehicleId || dto.tripId || dto.driverId) {
      await this.validateReferences({
        vehicleId: dto.vehicleId ?? existing.vehicleId,
        tripId: dto.tripId ?? existing.tripId,
        driverId: dto.driverId ?? existing.driverId,
      });
    }

    const quantity = dto.quantity ?? existing.quantity;
    const pricePerLiter = dto.pricePerLiter ?? existing.pricePerLiter;
    const totalCost = Math.round(quantity * pricePerLiter * 100) / 100;

    const fuel = await this.fuelRepository.update(id, {
      ...(dto.vehicleId && { vehicleId: dto.vehicleId.toUpperCase() }),
      ...(dto.tripId !== undefined && { tripId: dto.tripId?.toUpperCase() }),
      ...(dto.driverId !== undefined && { driverId: dto.driverId?.toUpperCase() }),
      ...(dto.fuelStation && { fuelStation: dto.fuelStation.trim() }),
      ...(dto.fuelType && { fuelType: dto.fuelType }),
      ...(dto.quantity !== undefined && { quantity: dto.quantity }),
      ...(dto.pricePerLiter !== undefined && { pricePerLiter: dto.pricePerLiter }),
      totalCost,
      ...(dto.odometerReading !== undefined && { odometerReading: dto.odometerReading }),
      ...(dto.filledAt && { filledAt: new Date(dto.filledAt) }),
      ...(dto.receiptImage !== undefined && { receiptImage: dto.receiptImage }),
      ...(dto.notes !== undefined && { notes: dto.notes?.trim() }),
      updatedBy: user?.sub ? new Types.ObjectId(user.sub) : undefined,
    });

    if (!fuel) throw new NotFoundException(`Fuel log with id "${id}" not found`);
    return toFuelDto(fuel);
  }

  async remove(id: string, user?: AuthUser) {
    const existing = await this.fuelRepository.findById(id);
    if (!existing) throw new NotFoundException(`Fuel log with id "${id}" not found`);
    this.assertOwnerAccess(existing.createdBy?.toString(), user);

    const deleted = await this.fuelRepository.delete(
      id,
      user?.sub ? new Types.ObjectId(user.sub) : undefined,
    );
    if (!deleted) throw new NotFoundException(`Fuel log with id "${id}" not found`);
    return { deleted: true };
  }

  async getFuelStatistics(dateFrom?: string, dateTo?: string): Promise<FuelStatistics> {
    const [stats, monthlyFuelCost, fuelConsumptionTrend] = await Promise.all([
      this.fuelRepository.getStatistics(dateFrom, dateTo),
      this.fuelRepository.getMonthlyFuelCost(),
      this.fuelRepository.getConsumptionTrend(30),
    ]);

    const agg = stats[0] ?? {
      totalFuelCost: 0,
      totalFuelQuantity: 0,
      avgPrice: 0,
      count: 0,
      totalOdometer: 0,
    };

    const averageFuelCost = agg.count > 0 ? agg.totalFuelCost / agg.count : 0;
    const averageFuelEfficiency =
      agg.totalFuelQuantity > 0 ? agg.totalOdometer / agg.totalFuelQuantity : 0;

    return {
      totalFuelCost: agg.totalFuelCost,
      totalFuelQuantity: agg.totalFuelQuantity,
      averageFuelCost,
      averageFuelEfficiency,
      monthlyFuelCost,
      fuelConsumptionTrend,
    };
  }

  async getVehicleFuelHistory(vehicleId: string) {
    const items = await this.fuelRepository.findByVehicle(vehicleId);
    return toFuelDtoList(items);
  }

  calculateOperationalCost(vehicleId?: string) {
    return this.costCalculation.calculateOperationalCost(vehicleId);
  }

  calculateTripCost(tripId: string) {
    return this.costCalculation.calculateTripCost(tripId);
  }

  calculateVehicleCost(vehicleId: string) {
    return this.costCalculation.calculateVehicleCost(vehicleId);
  }

  getVehicleCostComparison() {
    return this.fuelRepository.getVehicleCostComparison();
  }

  private async validateReferences(dto: {
    vehicleId: string;
    tripId?: string;
    driverId?: string;
  }) {
    try {
      await this.referenceValidation.validateReferences(dto);
    } catch (err) {
      throw new BadRequestException((err as Error).message);
    }
  }

  private getOwnerFilter(user?: AuthUser): string | undefined {
    if (!user) return undefined;
    const isDriverOnly =
      user.roles.includes(RoleCode.OPERATOR) &&
      !user.roles.some((r) =>
        [
          RoleCode.SUPER_ADMIN,
          RoleCode.ADMIN,
          RoleCode.FLEET_MANAGER,
          RoleCode.FINANCIAL_ANALYST,
        ].includes(r),
      );
    return isDriverOnly ? user.sub : undefined;
  }

  private assertOwnerAccess(createdBy: string | undefined, user?: AuthUser) {
    const ownerFilter = this.getOwnerFilter(user);
    if (ownerFilter && createdBy !== ownerFilter) {
      throw new NotFoundException('Fuel log not found');
    }
  }
}
