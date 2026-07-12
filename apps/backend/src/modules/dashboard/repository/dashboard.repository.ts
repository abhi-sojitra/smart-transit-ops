import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  DriverStatus,
  MaintenanceStatus,
  TripStatus,
  VehicleStatus,
  type ReportPeriod,
} from '@transitops/shared-types';
import { Vehicle, VehicleDocument } from '../../vehicle/schema/vehicle.schema';
import { Driver, DriverDocument } from '../../driver/schema/driver.schema';
import { Trip, TripDocument } from '../../trip/schema/trip.schema';
import { Maintenance, MaintenanceDocument } from '../../maintenance/schema/maintenance.schema';
import { Fuel, FuelDocument } from '../../../schemas/fuel.schema';
import { Expense, ExpenseDocument } from '../../../schemas/expense.schema';

const NOT_DELETED = { isDeleted: { $ne: true } };
const LICENSE_EXPIRING_DAYS = 30;
const MONTHS_LOOKBACK = 6;

export interface PeriodRange {
  start: Date;
  end: Date;
}

@Injectable()
export class DashboardRepository {
  constructor(
    @InjectModel(Vehicle.name) private readonly vehicleModel: Model<VehicleDocument>,
    @InjectModel(Driver.name) private readonly driverModel: Model<DriverDocument>,
    @InjectModel(Trip.name) private readonly tripModel: Model<TripDocument>,
    @InjectModel(Maintenance.name) private readonly maintenanceModel: Model<MaintenanceDocument>,
    @InjectModel(Fuel.name) private readonly fuelModel: Model<FuelDocument>,
    @InjectModel(Expense.name) private readonly expenseModel: Model<ExpenseDocument>,
  ) {}

  resolvePeriodRange(period: ReportPeriod, reference = new Date()): PeriodRange {
    const end = new Date(reference);
    end.setHours(23, 59, 59, 999);
    const start = new Date(reference);
    start.setHours(0, 0, 0, 0);

    if (period === 'weekly') {
      start.setDate(start.getDate() - 6);
    } else if (period === 'monthly') {
      start.setDate(1);
    }

    return { start, end };
  }

  monthStart(reference = new Date()): Date {
    return new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth(), 1));
  }

  getFleetStatusCounts() {
    return this.vehicleModel.aggregate<{ _id: string; count: number }>([
      { $match: NOT_DELETED },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
  }

  getDriverStatusCounts() {
    return this.driverModel.aggregate<{ _id: string; count: number; avgSafety: number }>([
      { $match: NOT_DELETED },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgSafety: { $avg: '$safetyScore' },
        },
      },
    ]);
  }

  getLicenseExpiringCount(withinDays = LICENSE_EXPIRING_DAYS) {
    const now = new Date();
    const until = new Date();
    until.setDate(until.getDate() + withinDays);

    return this.driverModel.aggregate<{ count: number }>([
      {
        $match: {
          ...NOT_DELETED,
          status: { $ne: DriverStatus.SUSPENDED },
          licenseExpiryDate: { $gte: now, $lte: until },
        },
      },
      { $count: 'count' },
    ]);
  }

  getTripOverview(todayStart: Date, todayEnd: Date) {
    return this.tripModel.aggregate<{
      active: number;
      completedToday: number;
      cancelled: number;
      total: number;
      revenue: number;
    }>([
      { $match: NOT_DELETED },
      {
        $group: {
          _id: null,
          active: {
            $sum: {
              $cond: [
                {
                  $in: ['$status', [TripStatus.DISPATCHED, TripStatus.IN_PROGRESS]],
                },
                1,
                0,
              ],
            },
          },
          completedToday: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$status', TripStatus.COMPLETED] },
                    { $gte: ['$actualEndDate', todayStart] },
                    { $lte: ['$actualEndDate', todayEnd] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          cancelled: {
            $sum: { $cond: [{ $eq: ['$status', TripStatus.CANCELLED] }, 1, 0] },
          },
          total: { $sum: 1 },
          revenue: {
            $sum: {
              $cond: [
                { $eq: ['$status', TripStatus.COMPLETED] },
                { $ifNull: ['$actualRevenue', '$estimatedRevenue'] },
                0,
              ],
            },
          },
        },
      },
      { $project: { _id: 0 } },
    ]);
  }

  getMaintenanceOverview(now: Date) {
    return this.maintenanceModel.aggregate<{
      active: number;
      overdue: number;
      completed: number;
      cost: number;
    }>([
      { $match: NOT_DELETED },
      {
        $group: {
          _id: null,
          active: {
            $sum: {
              $cond: [
                {
                  $in: ['$status', [MaintenanceStatus.SCHEDULED, MaintenanceStatus.IN_PROGRESS]],
                },
                1,
                0,
              ],
            },
          },
          overdue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    {
                      $in: ['$status', [MaintenanceStatus.SCHEDULED, MaintenanceStatus.IN_PROGRESS]],
                    },
                    { $lt: ['$date', now] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', MaintenanceStatus.COMPLETED] }, 1, 0] },
          },
          cost: { $sum: { $ifNull: ['$cost', 0] } },
        },
      },
      { $project: { _id: 0 } },
    ]);
  }

  getFuelMonthlyStats(monthStart: Date) {
    return this.fuelModel.aggregate<{ monthlyCost: number; monthlyQuantity: number }>([
      { $match: { ...NOT_DELETED, filledAt: { $gte: monthStart } } },
      {
        $group: {
          _id: null,
          monthlyCost: { $sum: '$totalCost' },
          monthlyQuantity: { $sum: '$quantity' },
        },
      },
      { $project: { _id: 0 } },
    ]);
  }

  getFuelEfficiency() {
    return this.tripModel.aggregate<{ fuelEfficiency: number }>([
      {
        $match: {
          ...NOT_DELETED,
          status: TripStatus.COMPLETED,
          fuelConsumed: { $gt: 0 },
          actualDistance: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: null,
          totalDistance: { $sum: '$actualDistance' },
          totalFuel: { $sum: '$fuelConsumed' },
        },
      },
      {
        $project: {
          _id: 0,
          fuelEfficiency: {
            $cond: [
              { $gt: ['$totalFuel', 0] },
              { $divide: ['$totalDistance', '$totalFuel'] },
              0,
            ],
          },
        },
      },
    ]);
  }

  getExpenseMonthlyStats(monthStart: Date) {
    return this.expenseModel.aggregate<{
      monthlyExpense: number;
      pending: number;
      approved: number;
    }>([
      { $match: { ...NOT_DELETED, expenseDate: { $gte: monthStart } } },
      {
        $group: {
          _id: null,
          monthlyExpense: { $sum: '$amount' },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'PENDING'] }, '$amount', 0] },
          },
          approved: {
            $sum: { $cond: [{ $eq: ['$status', 'APPROVED'] }, '$amount', 0] },
          },
        },
      },
      { $project: { _id: 0 } },
    ]);
  }

  getOperationalCostTotals(start?: Date, end?: Date) {
    const fuelMatch: Record<string, unknown> = { ...NOT_DELETED };
    const expenseMatch: Record<string, unknown> = { ...NOT_DELETED };
    const maintenanceMatch: Record<string, unknown> = { ...NOT_DELETED };

    if (start || end) {
      const fuelRange: Record<string, Date> = {};
      const expenseRange: Record<string, Date> = {};
      const maintenanceRange: Record<string, Date> = {};
      if (start) {
        fuelRange.$gte = start;
        expenseRange.$gte = start;
        maintenanceRange.$gte = start;
      }
      if (end) {
        fuelRange.$lte = end;
        expenseRange.$lte = end;
        maintenanceRange.$lte = end;
      }
      fuelMatch.filledAt = fuelRange;
      expenseMatch.expenseDate = expenseRange;
      maintenanceMatch.date = maintenanceRange;
    }

    return Promise.all([
      this.fuelModel.aggregate<{ total: number }>([
        { $match: fuelMatch },
        { $group: { _id: null, total: { $sum: '$totalCost' } } },
      ]),
      this.expenseModel.aggregate<{ total: number }>([
        { $match: expenseMatch },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      this.maintenanceModel.aggregate<{ total: number }>([
        { $match: maintenanceMatch },
        { $group: { _id: null, total: { $sum: '$cost' } } },
      ]),
    ]);
  }

  getRecentActivity(limit = 20) {
    return this.tripModel.aggregate([
      { $match: NOT_DELETED },
      {
        $project: {
          id: { $toString: '$_id' },
          type: { $literal: 'TRIP' },
          title: { $concat: ['Trip ', '$tripNumber'] },
          description: { $concat: ['$source', ' → ', '$destination'] },
          status: '$status',
          occurredAt: { $ifNull: ['$updatedAt', '$createdAt'] },
          entityId: { $toString: '$_id' },
        },
      },
      {
        $unionWith: {
          coll: 'maintenance',
          pipeline: [
            { $match: NOT_DELETED },
            {
              $project: {
                id: { $toString: '$_id' },
                type: { $literal: 'MAINTENANCE' },
                title: { $concat: ['Maintenance · ', '$serviceType'] },
                description: { $concat: ['Status: ', '$status'] },
                status: '$status',
                occurredAt: { $ifNull: ['$updatedAt', '$date'] },
                entityId: { $toString: '$_id' },
              },
            },
          ],
        },
      },
      {
        $unionWith: {
          coll: 'fuel_logs',
          pipeline: [
            { $match: NOT_DELETED },
            {
              $project: {
                id: { $toString: '$_id' },
                type: { $literal: 'FUEL' },
                title: { $concat: ['Fuel · ', '$fuelStation'] },
                description: {
                  $concat: [
                    '$vehicleId',
                    ' · ',
                    { $toString: '$quantity' },
                    ' L',
                  ],
                },
                status: '$fuelType',
                occurredAt: { $ifNull: ['$filledAt', '$createdAt'] },
                entityId: { $toString: '$_id' },
              },
            },
          ],
        },
      },
      {
        $unionWith: {
          coll: 'expenses',
          pipeline: [
            { $match: NOT_DELETED },
            {
              $project: {
                id: { $toString: '$_id' },
                type: { $literal: 'EXPENSE' },
                title: { $ifNull: ['$title', '$expenseType'] },
                description: {
                  $concat: ['$vehicleId', ' · $', { $toString: '$amount' }],
                },
                status: '$status',
                occurredAt: { $ifNull: ['$expenseDate', '$createdAt'] },
                entityId: { $toString: '$_id' },
              },
            },
          ],
        },
      },
      {
        $unionWith: {
          coll: 'drivers',
          pipeline: [
            { $match: NOT_DELETED },
            {
              $project: {
                id: { $toString: '$_id' },
                type: { $literal: 'DRIVER' },
                title: { $concat: ['Driver · ', '$fullName'] },
                description: {
                  $concat: ['$employeeCode', ' · ', '$status'],
                },
                status: '$status',
                occurredAt: { $ifNull: ['$updatedAt', '$createdAt'] },
                entityId: { $toString: '$_id' },
              },
            },
          ],
        },
      },
      {
        $unionWith: {
          coll: 'vehicles',
          pipeline: [
            { $match: NOT_DELETED },
            {
              $project: {
                id: { $toString: '$_id' },
                type: { $literal: 'VEHICLE' },
                title: {
                  $concat: [
                    'Vehicle · ',
                    { $ifNull: ['$vehicleNumber', '$vehicleId'] },
                  ],
                },
                description: {
                  $concat: [{ $ifNull: ['$model', 'Fleet unit'] }, ' · ', '$status'],
                },
                status: '$status',
                occurredAt: { $ifNull: ['$updatedAt', '$createdAt'] },
                entityId: { $toString: '$_id' },
              },
            },
          ],
        },
      },
      { $sort: { occurredAt: -1 } },
      { $limit: limit },
    ]);
  }

  getLicenseExpiringAlerts(withinDays = LICENSE_EXPIRING_DAYS) {
    const now = new Date();
    const until = new Date();
    until.setDate(until.getDate() + withinDays);

    return this.driverModel.aggregate([
      {
        $match: {
          ...NOT_DELETED,
          licenseExpiryDate: { $gte: now, $lte: until },
        },
      },
      {
        $project: {
          id: { $concat: ['license-', { $toString: '$_id' }] },
          severity: { $literal: 'WARNING' },
          category: { $literal: 'LICENSE' },
          title: { $literal: 'Driver license expiring' },
          message: {
            $concat: ['$fullName', ' license expires soon'],
          },
          entityId: { $toString: '$_id' },
          entityLabel: '$fullName',
          dueDate: '$licenseExpiryDate',
        },
      },
      { $sort: { dueDate: 1 } },
      { $limit: 25 },
    ]);
  }

  getSuspendedDriverAlerts() {
    return this.driverModel.aggregate([
      { $match: { ...NOT_DELETED, status: DriverStatus.SUSPENDED } },
      {
        $project: {
          id: { $concat: ['suspended-', { $toString: '$_id' }] },
          severity: { $literal: 'CRITICAL' },
          category: { $literal: 'DRIVER' },
          title: { $literal: 'Suspended driver' },
          message: { $concat: ['$fullName', ' is currently suspended'] },
          entityId: { $toString: '$_id' },
          entityLabel: '$fullName',
        },
      },
      { $limit: 25 },
    ]);
  }

  getMaintenanceDueAlerts(now: Date) {
    return this.maintenanceModel.aggregate([
      {
        $match: {
          ...NOT_DELETED,
          status: { $in: [MaintenanceStatus.SCHEDULED, MaintenanceStatus.IN_PROGRESS] },
        },
      },
      {
        $lookup: {
          from: 'vehicles',
          localField: 'vehicleId',
          foreignField: '_id',
          as: 'vehicle',
        },
      },
      { $unwind: { path: '$vehicle', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          id: { $concat: ['maint-', { $toString: '$_id' }] },
          severity: {
            $cond: [{ $lt: ['$date', now] }, 'CRITICAL', 'WARNING'],
          },
          category: { $literal: 'MAINTENANCE' },
          title: {
            $cond: [
              { $lt: ['$date', now] },
              'Overdue maintenance',
              'Upcoming maintenance',
            ],
          },
          message: {
            $concat: [
              { $ifNull: ['$vehicle.vehicleId', 'Vehicle'] },
              ' · ',
              '$serviceType',
            ],
          },
          entityId: { $toString: '$_id' },
          entityLabel: { $ifNull: ['$vehicle.vehicleId', ''] },
          dueDate: '$date',
        },
      },
      { $sort: { dueDate: 1 } },
      { $limit: 25 },
    ]);
  }

  getDelayedTripAlerts(now: Date) {
    return this.tripModel.aggregate([
      {
        $match: {
          ...NOT_DELETED,
          status: { $in: [TripStatus.DISPATCHED, TripStatus.IN_PROGRESS] },
          plannedEndDate: { $lt: now },
        },
      },
      {
        $project: {
          id: { $concat: ['delayed-', { $toString: '$_id' }] },
          severity: { $literal: 'CRITICAL' },
          category: { $literal: 'TRIP' },
          title: { $literal: 'Trip delayed' },
          message: {
            $concat: ['$tripNumber', ' exceeded planned end time'],
          },
          entityId: { $toString: '$_id' },
          entityLabel: '$tripNumber',
          dueDate: '$plannedEndDate',
        },
      },
      { $sort: { dueDate: 1 } },
      { $limit: 25 },
    ]);
  }

  getOverCapacityTripAlerts() {
    return this.tripModel.aggregate([
      {
        $match: {
          ...NOT_DELETED,
          status: { $in: [TripStatus.DISPATCHED, TripStatus.IN_PROGRESS, TripStatus.DRAFT] },
        },
      },
      {
        $lookup: {
          from: 'vehicles',
          localField: 'vehicleId',
          foreignField: '_id',
          as: 'vehicle',
        },
      },
      { $unwind: '$vehicle' },
      {
        $match: {
          $expr: { $gt: ['$cargoWeight', '$vehicle.maxCapacity'] },
        },
      },
      {
        $project: {
          id: { $concat: ['capacity-', { $toString: '$_id' }] },
          severity: { $literal: 'WARNING' },
          category: { $literal: 'CAPACITY' },
          title: { $literal: 'Over capacity trip' },
          message: {
            $concat: [
              '$tripNumber',
              ' cargo exceeds ',
              '$vehicle.vehicleId',
              ' capacity',
            ],
          },
          entityId: { $toString: '$_id' },
          entityLabel: '$tripNumber',
        },
      },
      { $limit: 25 },
    ]);
  }

  getFuelMissingAlerts() {
    return this.tripModel.aggregate([
      {
        $match: {
          ...NOT_DELETED,
          status: TripStatus.COMPLETED,
          $or: [{ fuelConsumed: { $exists: false } }, { fuelConsumed: null }, { fuelConsumed: 0 }],
        },
      },
      {
        $project: {
          id: { $concat: ['fuel-missing-', { $toString: '$_id' }] },
          severity: { $literal: 'INFORMATION' },
          category: { $literal: 'FUEL' },
          title: { $literal: 'Fuel data missing' },
          message: {
            $concat: ['Completed trip ', '$tripNumber', ' has no fuel consumption'],
          },
          entityId: { $toString: '$_id' },
          entityLabel: '$tripNumber',
          dueDate: '$actualEndDate',
        },
      },
      { $sort: { dueDate: -1 } },
      { $limit: 25 },
    ]);
  }

  getTopDrivers(limit = 10) {
    return this.tripModel.aggregate([
      { $match: { ...NOT_DELETED, status: TripStatus.COMPLETED } },
      {
        $group: {
          _id: '$driverId',
          completedTrips: { $sum: 1 },
          revenue: {
            $sum: { $ifNull: ['$actualRevenue', '$estimatedRevenue'] },
          },
          distance: {
            $sum: { $ifNull: ['$actualDistance', '$plannedDistance'] },
          },
        },
      },
      { $sort: { revenue: -1, completedTrips: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'drivers',
          localField: '_id',
          foreignField: '_id',
          as: 'driver',
        },
      },
      { $unwind: '$driver' },
      {
        $project: {
          _id: 0,
          driverId: { $toString: '$_id' },
          name: '$driver.fullName',
          employeeCode: '$driver.employeeCode',
          completedTrips: 1,
          revenue: 1,
          distance: 1,
          safetyScore: '$driver.safetyScore',
        },
      },
    ]);
  }

  getTopVehicles(limit = 10) {
    return this.tripModel.aggregate([
      { $match: { ...NOT_DELETED, status: TripStatus.COMPLETED } },
      {
        $group: {
          _id: '$vehicleId',
          completedTrips: { $sum: 1 },
          revenue: {
            $sum: { $ifNull: ['$actualRevenue', '$estimatedRevenue'] },
          },
        },
      },
      {
        $lookup: {
          from: 'vehicles',
          localField: '_id',
          foreignField: '_id',
          as: 'vehicle',
        },
      },
      { $unwind: '$vehicle' },
      {
        $lookup: {
          from: 'fuel_logs',
          let: { vid: '$vehicle.vehicleId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$vehicleId', '$$vid'] },
                    { $ne: ['$isDeleted', true] },
                  ],
                },
              },
            },
            { $group: { _id: null, total: { $sum: '$totalCost' } } },
          ],
          as: 'fuelCost',
        },
      },
      {
        $lookup: {
          from: 'expenses',
          let: { vid: '$vehicle.vehicleId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$vehicleId', '$$vid'] },
                    { $ne: ['$isDeleted', true] },
                  ],
                },
              },
            },
            { $group: { _id: null, total: { $sum: '$amount' } } },
          ],
          as: 'expenseCost',
        },
      },
      {
        $lookup: {
          from: 'maintenance',
          let: { oid: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$vehicleId', '$$oid'] },
                    { $ne: ['$isDeleted', true] },
                  ],
                },
              },
            },
            { $group: { _id: null, total: { $sum: '$cost' } } },
          ],
          as: 'maintenanceCost',
        },
      },
      {
        $addFields: {
          operationalCost: {
            $add: [
              { $ifNull: [{ $arrayElemAt: ['$fuelCost.total', 0] }, 0] },
              { $ifNull: [{ $arrayElemAt: ['$expenseCost.total', 0] }, 0] },
              { $ifNull: [{ $arrayElemAt: ['$maintenanceCost.total', 0] }, 0] },
            ],
          },
        },
      },
      {
        $addFields: {
          roi: {
            $cond: [
              { $gt: ['$operationalCost', 0] },
              {
                $multiply: [
                  { $divide: [{ $subtract: ['$revenue', '$operationalCost'] }, '$operationalCost'] },
                  100,
                ],
              },
              { $cond: [{ $gt: ['$revenue', 0] }, 100, 0] },
            ],
          },
        },
      },
      { $sort: { roi: -1, revenue: -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          vehicleId: { $toString: '$_id' },
          label: {
            $ifNull: ['$vehicle.vehicleNumber', '$vehicle.vehicleId'],
          },
          completedTrips: 1,
          revenue: 1,
          operationalCost: 1,
          roi: 1,
          utilizationTrips: '$completedTrips',
        },
      },
    ]);
  }

  getUpcomingMaintenance(limit = 10, now = new Date()) {
    return this.maintenanceModel.aggregate([
      {
        $match: {
          ...NOT_DELETED,
          status: { $in: [MaintenanceStatus.SCHEDULED, MaintenanceStatus.IN_PROGRESS] },
          date: { $gte: now },
        },
      },
      { $sort: { date: 1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'vehicles',
          localField: 'vehicleId',
          foreignField: '_id',
          as: 'vehicle',
        },
      },
      { $unwind: { path: '$vehicle', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          id: { $toString: '$_id' },
          vehicleId: { $toString: '$vehicleId' },
          vehicleLabel: {
            $ifNull: ['$vehicle.vehicleNumber', '$vehicle.vehicleId'],
          },
          serviceType: 1,
          status: 1,
          date: 1,
          cost: { $ifNull: ['$cost', 0] },
        },
      },
    ]);
  }

  getRecentTrips(limit = 10) {
    return this.tripModel.aggregate([
      { $match: NOT_DELETED },
      { $sort: { createdAt: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'drivers',
          localField: 'driverId',
          foreignField: '_id',
          as: 'driver',
        },
      },
      {
        $lookup: {
          from: 'vehicles',
          localField: 'vehicleId',
          foreignField: '_id',
          as: 'vehicle',
        },
      },
      {
        $project: {
          _id: 0,
          id: { $toString: '$_id' },
          tripNumber: 1,
          source: 1,
          destination: 1,
          status: 1,
          plannedStartDate: 1,
          createdAt: 1,
          revenue: { $ifNull: ['$actualRevenue', '$estimatedRevenue'] },
          driverName: { $arrayElemAt: ['$driver.fullName', 0] },
          vehicleLabel: {
            $ifNull: [
              { $arrayElemAt: ['$vehicle.vehicleNumber', 0] },
              { $arrayElemAt: ['$vehicle.vehicleId', 0] },
            ],
          },
        },
      },
    ]);
  }

  getMonthlyRevenue(months = MONTHS_LOOKBACK) {
    const start = this.monthsAgoStart(months);
    return this.tripModel.aggregate([
      {
        $match: {
          ...NOT_DELETED,
          status: TripStatus.COMPLETED,
          $or: [
            { actualEndDate: { $gte: start } },
            { plannedEndDate: { $gte: start } },
          ],
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m',
              date: { $ifNull: ['$actualEndDate', '$plannedEndDate'] },
            },
          },
          value: {
            $sum: { $ifNull: ['$actualRevenue', '$estimatedRevenue'] },
          },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, label: '$_id', value: 1 } },
    ]);
  }

  getMonthlyExpense(months = MONTHS_LOOKBACK) {
    const start = this.monthsAgoStart(months);
    return Promise.all([
      this.fuelModel.aggregate([
        { $match: { ...NOT_DELETED, filledAt: { $gte: start } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$filledAt' } },
            value: { $sum: '$totalCost' },
          },
        },
      ]),
      this.expenseModel.aggregate([
        { $match: { ...NOT_DELETED, expenseDate: { $gte: start } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$expenseDate' } },
            value: { $sum: '$amount' },
          },
        },
      ]),
      this.maintenanceModel.aggregate([
        { $match: { ...NOT_DELETED, date: { $gte: start } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
            value: { $sum: '$cost' },
          },
        },
      ]),
    ]);
  }

  getFuelConsumptionTrend(months = MONTHS_LOOKBACK) {
    const start = this.monthsAgoStart(months);
    return this.fuelModel.aggregate([
      { $match: { ...NOT_DELETED, filledAt: { $gte: start } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$filledAt' } },
          value: { $sum: '$quantity' },
          secondary: { $sum: '$totalCost' },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, label: '$_id', value: 1, secondary: 1 } },
    ]);
  }

  getMaintenanceCostTrend(months = MONTHS_LOOKBACK) {
    const start = this.monthsAgoStart(months);
    return this.maintenanceModel.aggregate([
      { $match: { ...NOT_DELETED, date: { $gte: start } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
          value: { $sum: '$cost' },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, label: '$_id', value: 1 } },
    ]);
  }

  getTripStatusBreakdown() {
    return this.tripModel.aggregate([
      { $match: NOT_DELETED },
      { $group: { _id: '$status', value: { $sum: 1 } } },
      { $project: { _id: 0, label: '$_id', value: 1 } },
      { $sort: { value: -1 } },
    ]);
  }

  getTripTrend(months = MONTHS_LOOKBACK) {
    const start = this.monthsAgoStart(months);
    return this.tripModel.aggregate([
      {
        $match: {
          ...NOT_DELETED,
          plannedStartDate: { $gte: start },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m', date: '$plannedStartDate' },
          },
          value: { $sum: 1 },
          secondary: {
            $sum: {
              $cond: [{ $eq: ['$status', TripStatus.COMPLETED] }, 1, 0],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, label: '$_id', value: 1, secondary: 1 } },
    ]);
  }

  getFleetUtilizationChart() {
    return this.vehicleModel.aggregate([
      { $match: NOT_DELETED },
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $eq: ['$status', VehicleStatus.AVAILABLE] }, then: 'Available' },
                { case: { $eq: ['$status', VehicleStatus.ON_TRIP] }, then: 'On Trip' },
                {
                  case: {
                    $in: [
                      '$status',
                      [VehicleStatus.MAINTENANCE, VehicleStatus.IN_SERVICE],
                    ],
                  },
                  then: 'In Shop',
                },
                { case: { $eq: ['$status', VehicleStatus.RETIRED] }, then: 'Retired' },
              ],
              default: 'Other',
            },
          },
          value: { $sum: 1 },
        },
      },
      { $project: { _id: 0, label: '$_id', value: 1 } },
      { $sort: { value: -1 } },
    ]);
  }

  getBusinessPeriodStats(range: PeriodRange) {
    return this.tripModel.aggregate<{
      tripsCompleted: number;
      tripsCancelled: number;
      revenue: number;
    }>([
      {
        $match: {
          ...NOT_DELETED,
          $or: [
            {
              actualEndDate: { $gte: range.start, $lte: range.end },
            },
            {
              plannedEndDate: { $gte: range.start, $lte: range.end },
              status: { $in: [TripStatus.COMPLETED, TripStatus.CANCELLED] },
            },
          ],
        },
      },
      {
        $group: {
          _id: null,
          tripsCompleted: {
            $sum: { $cond: [{ $eq: ['$status', TripStatus.COMPLETED] }, 1, 0] },
          },
          tripsCancelled: {
            $sum: { $cond: [{ $eq: ['$status', TripStatus.CANCELLED] }, 1, 0] },
          },
          revenue: {
            $sum: {
              $cond: [
                { $eq: ['$status', TripStatus.COMPLETED] },
                { $ifNull: ['$actualRevenue', '$estimatedRevenue'] },
                0,
              ],
            },
          },
        },
      },
      { $project: { _id: 0 } },
    ]);
  }

  getActiveCounts() {
    return Promise.all([
      this.vehicleModel.aggregate<{ count: number }>([
        {
          $match: {
            ...NOT_DELETED,
            status: {
              $in: [
                VehicleStatus.AVAILABLE,
                VehicleStatus.ON_TRIP,
                VehicleStatus.ACTIVE,
                VehicleStatus.IN_SERVICE,
              ],
            },
          },
        },
        { $count: 'count' },
      ]),
      this.driverModel.aggregate<{ count: number }>([
        {
          $match: {
            ...NOT_DELETED,
            status: { $in: [DriverStatus.AVAILABLE, DriverStatus.ON_TRIP] },
          },
        },
        { $count: 'count' },
      ]),
      this.vehicleModel.aggregate<{ total: number; onTrip: number }>([
        { $match: NOT_DELETED },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            onTrip: {
              $sum: { $cond: [{ $eq: ['$status', VehicleStatus.ON_TRIP] }, 1, 0] },
            },
          },
        },
      ]),
    ]);
  }

  private monthsAgoStart(months: number): Date {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1));
  }
}
