import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { OperationalCost, TripCostSummary, VehicleCostHistory } from '@transitops/shared-types';
import { Fuel, FuelDocument } from '../../schemas/fuel.schema';
import { Expense, ExpenseDocument } from '../../schemas/expense.schema';
import { Maintenance, MaintenanceDocument } from '../../schemas/maintenance.schema';

@Injectable()
export class CostCalculationService {
  constructor(
    @InjectModel(Fuel.name) private readonly fuelModel: Model<FuelDocument>,
    @InjectModel(Expense.name) private readonly expenseModel: Model<ExpenseDocument>,
    @InjectModel(Maintenance.name) private readonly maintenanceModel: Model<MaintenanceDocument>,
  ) {}

  private notDeletedFilter = { isDeleted: { $ne: true } };

  async calculateOperationalCost(vehicleId?: string): Promise<OperationalCost> {
    const vehicleFilter = vehicleId
      ? { vehicleId: vehicleId.toUpperCase(), ...this.notDeletedFilter }
      : this.notDeletedFilter;

    const [fuelAgg, expenseAgg, maintenanceAgg] = await Promise.all([
      this.fuelModel.aggregate([
        { $match: vehicleFilter },
        { $group: { _id: null, total: { $sum: '$totalCost' } } },
      ]),
      this.expenseModel.aggregate([
        { $match: { ...vehicleFilter, status: 'APPROVED' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      this.maintenanceModel.aggregate([
        {
          $match: vehicleId
            ? { vehicleId: vehicleId.toUpperCase(), isDeleted: { $ne: true } }
            : { isDeleted: { $ne: true } },
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $ifNull: ['$actualCost', '$estimatedCost'] } },
          },
        },
      ]),
    ]);

    const fuelCost = fuelAgg[0]?.total ?? 0;
    const expenseCost = expenseAgg[0]?.total ?? 0;
    const maintenanceCost = maintenanceAgg[0]?.total ?? 0;

    return {
      fuelCost,
      maintenanceCost,
      expenseCost,
      totalCost: fuelCost + maintenanceCost + expenseCost,
    };
  }

  async calculateTripCost(tripId: string): Promise<TripCostSummary> {
    const normalizedTripId = tripId.toUpperCase();
    const filter = { tripId: normalizedTripId, ...this.notDeletedFilter };

    const [fuelAgg, expenseAgg] = await Promise.all([
      this.fuelModel.aggregate([
        { $match: filter },
        { $group: { _id: null, total: { $sum: '$totalCost' } } },
      ]),
      this.expenseModel.aggregate([
        { $match: { ...filter, status: 'APPROVED' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    const fuelCost = fuelAgg[0]?.total ?? 0;
    const expenseCost = expenseAgg[0]?.total ?? 0;

    return {
      tripId: normalizedTripId,
      fuelCost,
      expenseCost,
      totalCost: fuelCost + expenseCost,
    };
  }

  async calculateVehicleCost(vehicleId: string): Promise<OperationalCost> {
    return this.calculateOperationalCost(vehicleId);
  }

  async getVehicleCostHistory(vehicleId: string): Promise<VehicleCostHistory[]> {
    const normalizedVehicleId = vehicleId.toUpperCase();
    const filter = { vehicleId: normalizedVehicleId, ...this.notDeletedFilter };

    const [fuelByMonth, expenseByMonth, maintenanceByMonth] = await Promise.all([
      this.fuelModel.aggregate([
        { $match: filter },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$filledAt' } },
            fuelCost: { $sum: '$totalCost' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      this.expenseModel.aggregate([
        { $match: { ...filter, status: 'APPROVED' } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$expenseDate' } },
            expenseCost: { $sum: '$amount' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      this.maintenanceModel.aggregate([
        { $match: { vehicleId: normalizedVehicleId, isDeleted: { $ne: true } } },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m',
                date: { $ifNull: ['$completedDate', '$startDate'] },
              },
            },
            maintenanceCost: { $sum: { $ifNull: ['$actualCost', '$estimatedCost'] } },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const periods = new Set<string>();
    fuelByMonth.forEach((r) => periods.add(r._id));
    expenseByMonth.forEach((r) => periods.add(r._id));
    maintenanceByMonth.forEach((r) => periods.add(r._id));

    const fuelMap = new Map(fuelByMonth.map((r) => [r._id, r.fuelCost]));
    const expenseMap = new Map(expenseByMonth.map((r) => [r._id, r.expenseCost]));
    const maintenanceMap = new Map(maintenanceByMonth.map((r) => [r._id, r.maintenanceCost]));

    return Array.from(periods)
      .sort()
      .map((period) => {
        const fuelCost = fuelMap.get(period) ?? 0;
        const expenseCost = expenseMap.get(period) ?? 0;
        const maintenanceCost = maintenanceMap.get(period) ?? 0;
        return {
          vehicleId: normalizedVehicleId,
          period,
          fuelCost,
          maintenanceCost,
          expenseCost,
          totalCost: fuelCost + maintenanceCost + expenseCost,
        };
      });
  }
}
