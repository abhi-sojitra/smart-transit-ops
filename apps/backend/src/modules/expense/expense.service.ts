import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import type { ExpenseStatistics, ExpenseType } from '@transitops/shared-types';
import { ExpenseStatus, RoleCode } from '@transitops/shared-types';

type AuthUser = { sub: string; roles: RoleCode[] };
import { ExpenseRepository } from '../../repositories/expense.repository';
import { ReferenceValidationService } from '../integration/reference-validation.service';
import { CostCalculationService } from '../integration/cost-calculation.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { ExpenseQueryDto } from './dto/expense-query.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { toExpenseDto, toExpenseDtoList } from './expense.mapper';

@Injectable()
export class ExpenseService {
  constructor(
    private readonly expenseRepository: ExpenseRepository,
    private readonly referenceValidation: ReferenceValidationService,
    private readonly costCalculation: CostCalculationService,
  ) {}

  async createExpense(dto: CreateExpenseDto, user?: AuthUser) {
    await this.validateReferences(dto);

    const expense = await this.expenseRepository.create({
      vehicleId: dto.vehicleId.toUpperCase(),
      tripId: dto.tripId?.toUpperCase(),
      driverId: dto.driverId?.toUpperCase(),
      expenseType: dto.expenseType,
      title: dto.title.trim(),
      description: dto.description?.trim(),
      amount: dto.amount,
      expenseDate: new Date(dto.expenseDate),
      receiptImage: dto.receiptImage,
      status: dto.status ?? ExpenseStatus.PENDING,
      notes: dto.notes?.trim(),
      createdBy: user?.sub ? new Types.ObjectId(user.sub) : undefined,
    });

    return toExpenseDto(expense);
  }

  async findAll(query: ExpenseQueryDto, user?: AuthUser) {
    const createdBy = this.getOwnerFilter(user);
    const { items, total, page, limit } = await this.expenseRepository.findPaginated({
      ...query,
      createdBy,
    });
    const totalPages = Math.ceil(total / limit) || 1;
    return {
      data: toExpenseDtoList(items),
      meta: { page, limit, total, totalPages },
    };
  }

  async findById(id: string, user?: AuthUser) {
    const expense = await this.expenseRepository.findById(id);
    if (!expense) throw new NotFoundException(`Expense with id "${id}" not found`);
    this.assertOwnerAccess(expense.createdBy?.toString(), user);
    return toExpenseDto(expense);
  }

  async update(id: string, dto: UpdateExpenseDto, user?: AuthUser) {
    const existing = await this.expenseRepository.findById(id);
    if (!existing) throw new NotFoundException(`Expense with id "${id}" not found`);
    this.assertOwnerAccess(existing.createdBy?.toString(), user);

    if (dto.vehicleId || dto.tripId || dto.driverId) {
      await this.validateReferences({
        vehicleId: dto.vehicleId ?? existing.vehicleId,
        tripId: dto.tripId ?? existing.tripId,
        driverId: dto.driverId ?? existing.driverId,
      });
    }

    const expense = await this.expenseRepository.update(id, {
      ...(dto.vehicleId && { vehicleId: dto.vehicleId.toUpperCase() }),
      ...(dto.tripId !== undefined && { tripId: dto.tripId?.toUpperCase() }),
      ...(dto.driverId !== undefined && { driverId: dto.driverId?.toUpperCase() }),
      ...(dto.expenseType && { expenseType: dto.expenseType }),
      ...(dto.title && { title: dto.title.trim() }),
      ...(dto.description !== undefined && { description: dto.description?.trim() }),
      ...(dto.amount !== undefined && { amount: dto.amount }),
      ...(dto.expenseDate && { expenseDate: new Date(dto.expenseDate) }),
      ...(dto.receiptImage !== undefined && { receiptImage: dto.receiptImage }),
      ...(dto.status && { status: dto.status }),
      ...(dto.approvedBy !== undefined && { approvedBy: dto.approvedBy }),
      ...(dto.notes !== undefined && { notes: dto.notes?.trim() }),
      updatedBy: user?.sub ? new Types.ObjectId(user.sub) : undefined,
    });

    if (!expense) throw new NotFoundException(`Expense with id "${id}" not found`);
    return toExpenseDto(expense);
  }

  async remove(id: string, user?: AuthUser) {
    const existing = await this.expenseRepository.findById(id);
    if (!existing) throw new NotFoundException(`Expense with id "${id}" not found`);
    this.assertOwnerAccess(existing.createdBy?.toString(), user);

    const deleted = await this.expenseRepository.delete(
      id,
      user?.sub ? new Types.ObjectId(user.sub) : undefined,
    );
    if (!deleted) throw new NotFoundException(`Expense with id "${id}" not found`);
    return { deleted: true };
  }

  async getExpenseStatistics(dateFrom?: string, dateTo?: string): Promise<ExpenseStatistics> {
    const [statusAgg, monthlyExpenses] = await Promise.all([
      this.expenseRepository.getStatistics(dateFrom, dateTo),
      this.expenseRepository.getMonthlyExpenses(),
    ]);

    const [byStatus, byCategory, totals] = statusAgg;

    const statusMap = new Map(byStatus.map((s) => [s._id, s]));
    const totalExpenses = totals[0]?.total ?? 0;

    return {
      totalExpenses,
      pending: statusMap.get(ExpenseStatus.PENDING)?.total ?? 0,
      approved: statusMap.get(ExpenseStatus.APPROVED)?.total ?? 0,
      rejected: statusMap.get(ExpenseStatus.REJECTED)?.total ?? 0,
      expenseByCategory: byCategory.map((c) => ({
        type: c._id as ExpenseType,
        amount: c.amount,
        count: c.count,
      })),
      monthlyExpenses,
    };
  }

  async getTripExpenses(tripId: string) {
    const items = await this.expenseRepository.findByTrip(tripId);
    return toExpenseDtoList(items);
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
      throw new NotFoundException('Expense not found');
    }
  }
}
