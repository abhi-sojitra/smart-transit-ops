import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  DriverStatus,
  MaintenanceStatus,
  TripStatus,
  VehicleStatus,
} from '@transitops/shared-types';
import { Vehicle, VehicleDocument } from '../../vehicle/schema/vehicle.schema';
import { Driver, DriverDocument } from '../../driver/schema/driver.schema';
import { Trip, TripDocument } from '../../trip/schema/trip.schema';
import { Maintenance, MaintenanceDocument } from '../../maintenance/schema/maintenance.schema';
import { Fuel, FuelDocument } from '../../../schemas/fuel.schema';
import { Expense, ExpenseDocument } from '../../../schemas/expense.schema';
import type { ReportQueryDto } from '../dto/report-query.dto';
import {
  MAINTENANCE_COST,
  NOT_DELETED,
  TRIP_DISTANCE,
  TRIP_REVENUE,
  resolveDateRange,
  toObjectId,
  tripDateMatch,
} from '../aggregation/report-pipelines';

@Injectable()
export class ReportsRepository {
  constructor(
    @InjectModel(Vehicle.name) private readonly vehicleModel: Model<VehicleDocument>,
    @InjectModel(Driver.name) private readonly driverModel: Model<DriverDocument>,
    @InjectModel(Trip.name) private readonly tripModel: Model<TripDocument>,
    @InjectModel(Maintenance.name) private readonly maintenanceModel: Model<MaintenanceDocument>,
    @InjectModel(Fuel.name) private readonly fuelModel: Model<FuelDocument>,
    @InjectModel(Expense.name) private readonly expenseModel: Model<ExpenseDocument>,
  ) {}

  getDateRange(query: ReportQueryDto) {
    return resolveDateRange(query);
  }

  async getFleetStatusCounts() {
    const rows = await this.vehicleModel.aggregate<{ _id: string; count: number }>([
      { $match: NOT_DELETED },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const map = Object.fromEntries(rows.map((r) => [r._id, r.count]));
    return {
      total: rows.reduce((s, r) => s + r.count, 0),
      available: map[VehicleStatus.AVAILABLE] ?? 0,
      onTrip: map[VehicleStatus.ON_TRIP] ?? 0,
      maintenance: map[VehicleStatus.MAINTENANCE] ?? 0,
      retired: map[VehicleStatus.RETIRED] ?? 0,
    };
  }

  async getDriverStatusCounts() {
    const rows = await this.driverModel.aggregate<{ _id: string; count: number }>([
      { $match: NOT_DELETED },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const map = Object.fromEntries(rows.map((r) => [r._id, r.count]));
    return {
      total: rows.reduce((s, r) => s + r.count, 0),
      available: map[DriverStatus.AVAILABLE] ?? 0,
      onTrip: map[DriverStatus.ON_TRIP] ?? 0,
      suspended: map[DriverStatus.SUSPENDED] ?? 0,
      offDuty: map[DriverStatus.OFF_DUTY] ?? 0,
    };
  }

  private tripMatch(query: ReportQueryDto, start: Date, end: Date) {
    const match: Record<string, unknown> = { ...NOT_DELETED, ...tripDateMatch(start, end) };
    const vehicleOid = toObjectId(query.vehicleId);
    const driverOid = toObjectId(query.driverId);
    if (vehicleOid) match.vehicleId = vehicleOid;
    if (driverOid) match.driverId = driverOid;
    if (query.status) match.status = query.status;
    if (query.route) {
      const [source, destination] = query.route.split('→').map((s) => s.trim());
      if (source) match.source = new RegExp(source, 'i');
      if (destination) match.destination = new RegExp(destination, 'i');
    }
    if (query.search) {
      match.$and = [
        ...(Array.isArray(match.$and) ? (match.$and as object[]) : []),
        {
          $or: [
            { tripNumber: { $regex: query.search, $options: 'i' } },
            { source: { $regex: query.search, $options: 'i' } },
            { destination: { $regex: query.search, $options: 'i' } },
            { cargoName: { $regex: query.search, $options: 'i' } },
          ],
        },
      ];
    }
    return match;
  }

  async getTripFinancials(query: ReportQueryDto) {
    const { start, end } = resolveDateRange(query);
    const [row] = await this.tripModel.aggregate<{
      completed: number;
      cancelled: number;
      total: number;
      revenue: number;
      distance: number;
      fuel: number;
      delayed: number;
    }>([
      { $match: this.tripMatch(query, start, end) },
      {
        $group: {
          _id: null,
          completed: {
            $sum: { $cond: [{ $eq: ['$status', TripStatus.COMPLETED] }, 1, 0] },
          },
          cancelled: {
            $sum: { $cond: [{ $eq: ['$status', TripStatus.CANCELLED] }, 1, 0] },
          },
          total: { $sum: 1 },
          revenue: {
            $sum: {
              $cond: [
                { $eq: ['$status', TripStatus.COMPLETED] },
                TRIP_REVENUE,
                0,
              ],
            },
          },
          distance: {
            $sum: {
              $cond: [
                { $eq: ['$status', TripStatus.COMPLETED] },
                TRIP_DISTANCE,
                0,
              ],
            },
          },
          fuel: {
            $sum: {
              $cond: [
                { $eq: ['$status', TripStatus.COMPLETED] },
                { $ifNull: ['$fuelConsumed', 0] },
                0,
              ],
            },
          },
          delayed: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $in: ['$status', [TripStatus.DISPATCHED, TripStatus.IN_PROGRESS]] },
                    { $lt: ['$plannedEndDate', new Date()] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);
    return (
      row ?? {
        completed: 0,
        cancelled: 0,
        total: 0,
        revenue: 0,
        distance: 0,
        fuel: 0,
        delayed: 0,
      }
    );
  }

  async getOperationalCosts(query: ReportQueryDto) {
    const { start, end } = resolveDateRange(query);
    const vehicle = await this.resolveVehicleCode(query.vehicleId);

    const fuelMatch: Record<string, unknown> = {
      ...NOT_DELETED,
      filledAt: { $gte: start, $lte: end },
    };
    const expenseMatch: Record<string, unknown> = {
      ...NOT_DELETED,
      expenseDate: { $gte: start, $lte: end },
    };
    const maintenanceMatch: Record<string, unknown> = { ...NOT_DELETED };
    if (vehicle) {
      fuelMatch.vehicleId = vehicle;
      expenseMatch.vehicleId = vehicle;
    }
    if (query.fuelType) fuelMatch.fuelType = query.fuelType;
    if (query.expenseCategory) expenseMatch.expenseType = query.expenseCategory;
    if (query.status && ['PENDING', 'APPROVED', 'REJECTED'].includes(query.status)) {
      expenseMatch.status = query.status;
    }
    if (query.vehicleId && Types.ObjectId.isValid(query.vehicleId)) {
      maintenanceMatch.vehicleId = new Types.ObjectId(query.vehicleId);
    }
    if (query.maintenanceType) maintenanceMatch.maintenanceType = query.maintenanceType;
    if (query.vendor) maintenanceMatch.vendorName = new RegExp(query.vendor, 'i');

    maintenanceMatch.$expr = {
      $and: [
        {
          $gte: [
            { $ifNull: ['$completedDate', { $ifNull: ['$startDate', '$createdAt'] }] },
            start,
          ],
        },
        {
          $lte: [
            { $ifNull: ['$completedDate', { $ifNull: ['$startDate', '$createdAt'] }] },
            end,
          ],
        },
      ],
    };

    const [fuel, expense, maintenance] = await Promise.all([
      this.fuelModel.aggregate<{ total: number; qty: number }>([
        { $match: fuelMatch },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalCost' },
            qty: { $sum: '$quantity' },
          },
        },
      ]),
      this.expenseModel.aggregate<{ total: number }>([
        { $match: expenseMatch },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      this.maintenanceModel.aggregate<{ total: number; active: number; completed: number; overdue: number }>([
        { $match: maintenanceMatch },
        {
          $group: {
            _id: null,
            total: { $sum: MAINTENANCE_COST },
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
            completed: {
              $sum: { $cond: [{ $eq: ['$status', MaintenanceStatus.COMPLETED] }, 1, 0] },
            },
            overdue: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      {
                        $in: [
                          '$status',
                          [MaintenanceStatus.SCHEDULED, MaintenanceStatus.IN_PROGRESS],
                        ],
                      },
                      { $lt: [{ $ifNull: ['$expectedCompletionDate', '$startDate'] }, new Date()] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]),
    ]);

    return {
      fuelCost: fuel[0]?.total ?? 0,
      fuelQty: fuel[0]?.qty ?? 0,
      expenseCost: expense[0]?.total ?? 0,
      maintenanceCost: maintenance[0]?.total ?? 0,
      maintenanceActive: maintenance[0]?.active ?? 0,
      maintenanceCompleted: maintenance[0]?.completed ?? 0,
      maintenanceOverdue: maintenance[0]?.overdue ?? 0,
    };
  }

  private async resolveVehicleCode(vehicleObjectId?: string): Promise<string | undefined> {
    if (!vehicleObjectId || !Types.ObjectId.isValid(vehicleObjectId)) return undefined;
    const doc = await this.vehicleModel
      .findOne({ _id: vehicleObjectId, ...NOT_DELETED })
      .select('vehicleId')
      .lean();
    return doc?.vehicleId;
  }

  async getMonthlyTrends(query: ReportQueryDto) {
    const { start, end } = resolveDateRange(query);
    const [revenue, fuel, expenses, maintenance] = await Promise.all([
      this.tripModel.aggregate([
        {
          $match: {
            ...NOT_DELETED,
            status: TripStatus.COMPLETED,
            ...tripDateMatch(start, end),
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
            value: { $sum: TRIP_REVENUE },
            distance: { $sum: TRIP_DISTANCE },
            trips: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      this.fuelModel.aggregate([
        { $match: { ...NOT_DELETED, filledAt: { $gte: start, $lte: end } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$filledAt' } },
            value: { $sum: '$totalCost' },
            qty: { $sum: '$quantity' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      this.expenseModel.aggregate([
        { $match: { ...NOT_DELETED, expenseDate: { $gte: start, $lte: end } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$expenseDate' } },
            value: { $sum: '$amount' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      this.maintenanceModel.aggregate([
        {
          $match: {
            ...NOT_DELETED,
            $expr: {
              $and: [
                {
                  $gte: [
                    { $ifNull: ['$completedDate', { $ifNull: ['$startDate', '$createdAt'] }] },
                    start,
                  ],
                },
                {
                  $lte: [
                    { $ifNull: ['$completedDate', { $ifNull: ['$startDate', '$createdAt'] }] },
                    end,
                  ],
                },
              ],
            },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m',
                date: { $ifNull: ['$completedDate', { $ifNull: ['$startDate', '$createdAt'] }] },
              },
            },
            value: { $sum: MAINTENANCE_COST },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);
    return { revenue, fuel, expenses, maintenance };
  }

  async getTopVehiclesByRevenue(limit = 5, query: ReportQueryDto) {
    const { start, end } = resolveDateRange(query);
    return this.tripModel.aggregate([
      {
        $match: {
          ...NOT_DELETED,
          status: TripStatus.COMPLETED,
          ...tripDateMatch(start, end),
        },
      },
      {
        $group: {
          _id: '$vehicleId',
          revenue: { $sum: TRIP_REVENUE },
          trips: { $sum: 1 },
          distance: { $sum: TRIP_DISTANCE },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'vehicles',
          localField: '_id',
          foreignField: '_id',
          as: 'vehicle',
        },
      },
      { $unwind: { path: '$vehicle', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          id: { $toString: '$_id' },
          label: { $ifNull: ['$vehicle.vehicleId', 'Unknown'] },
          subtitle: {
            $concat: [
              { $ifNull: ['$vehicle.make', ''] },
              ' ',
              { $ifNull: ['$vehicle.model', ''] },
            ],
          },
          value: '$revenue',
          secondary: '$trips',
          meta: {
            distance: '$distance',
            revenue: '$revenue',
          },
        },
      },
    ]);
  }

  async getTopDriversByRevenue(limit = 5, query: ReportQueryDto) {
    const { start, end } = resolveDateRange(query);
    return this.tripModel.aggregate([
      {
        $match: {
          ...NOT_DELETED,
          status: TripStatus.COMPLETED,
          ...tripDateMatch(start, end),
        },
      },
      {
        $group: {
          _id: '$driverId',
          revenue: { $sum: TRIP_REVENUE },
          trips: { $sum: 1 },
          distance: { $sum: TRIP_DISTANCE },
          cancelled: { $sum: 0 },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'drivers',
          localField: '_id',
          foreignField: '_id',
          as: 'driver',
        },
      },
      { $unwind: { path: '$driver', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          id: { $toString: '$_id' },
          label: {
            $ifNull: [
              '$driver.fullName',
              {
                $trim: {
                  input: {
                    $concat: [
                      { $ifNull: ['$driver.firstName', ''] },
                      ' ',
                      { $ifNull: ['$driver.lastName', ''] },
                    ],
                  },
                },
              },
            ],
          },
          subtitle: { $ifNull: ['$driver.employeeCode', ''] },
          value: '$revenue',
          secondary: '$trips',
          meta: { distance: '$distance', revenue: '$revenue' },
        },
      },
    ]);
  }

  async getLowestVehiclesByRevenue(limit = 5, query: ReportQueryDto) {
    const top = await this.getTopVehiclesByRevenue(50, query);
    return [...top].sort((a, b) => Number(a.value) - Number(b.value)).slice(0, limit);
  }

  async getHighestCostVehicles(limit = 5, query: ReportQueryDto) {
    const { start, end } = resolveDateRange(query);
    const fuelByCode = await this.fuelModel.aggregate([
      { $match: { ...NOT_DELETED, filledAt: { $gte: start, $lte: end } } },
      { $group: { _id: '$vehicleId', fuel: { $sum: '$totalCost' }, qty: { $sum: '$quantity' } } },
    ]);
    const expenseByCode = await this.expenseModel.aggregate([
      { $match: { ...NOT_DELETED, expenseDate: { $gte: start, $lte: end } } },
      { $group: { _id: '$vehicleId', expense: { $sum: '$amount' } } },
    ]);
    const maint = await this.maintenanceModel.aggregate([
      {
        $match: {
          ...NOT_DELETED,
          $expr: {
            $and: [
              {
                $gte: [
                  { $ifNull: ['$completedDate', { $ifNull: ['$startDate', '$createdAt'] }] },
                  start,
                ],
              },
              {
                $lte: [
                  { $ifNull: ['$completedDate', { $ifNull: ['$startDate', '$createdAt'] }] },
                  end,
                ],
              },
            ],
          },
        },
      },
      {
        $group: {
          _id: '$vehicleId',
          maintenance: { $sum: MAINTENANCE_COST },
          count: { $sum: 1 },
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
      { $unwind: { path: '$vehicle', preserveNullAndEmptyArrays: true } },
    ]);

    const fuelMap = new Map(fuelByCode.map((r) => [String(r._id).toUpperCase(), r]));
    const expenseMap = new Map(expenseByCode.map((r) => [String(r._id).toUpperCase(), r]));

    const rows = maint.map((m) => {
      const code = String(m.vehicle?.vehicleId ?? '').toUpperCase();
      const fuel = fuelMap.get(code)?.fuel ?? 0;
      const expense = expenseMap.get(code)?.expense ?? 0;
      const maintenance = m.maintenance ?? 0;
      const total = fuel + expense + maintenance;
      return {
        id: String(m._id),
        label: m.vehicle?.vehicleId ?? 'Unknown',
        subtitle: `${m.vehicle?.make ?? ''} ${m.vehicle?.model ?? ''}`.trim(),
        value: total,
        secondary: maintenance,
        meta: { fuel, expense, maintenance, count: m.count },
      };
    });

    return rows.sort((a, b) => b.value - a.value).slice(0, limit);
  }

  async getHighestFuelVehicles(limit = 5, query: ReportQueryDto) {
    const { start, end } = resolveDateRange(query);
    return this.fuelModel.aggregate([
      { $match: { ...NOT_DELETED, filledAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: '$vehicleId',
          value: { $sum: '$quantity' },
          cost: { $sum: '$totalCost' },
        },
      },
      { $sort: { value: -1 } },
      { $limit: limit },
      {
        $project: {
          id: '$_id',
          label: '$_id',
          value: 1,
          secondary: '$cost',
          meta: { cost: '$cost', quantity: '$value' },
        },
      },
    ]);
  }

  async getExpenseByCategory(query: ReportQueryDto) {
    const { start, end } = resolveDateRange(query);
    return this.expenseModel.aggregate([
      { $match: { ...NOT_DELETED, expenseDate: { $gte: start, $lte: end } } },
      { $group: { _id: '$expenseType', value: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { value: -1 } },
      { $project: { _id: 0, label: '$_id', value: 1, secondary: '$count' } },
    ]);
  }

  async getExpenseApprovalBreakdown(query: ReportQueryDto) {
    const { start, end } = resolveDateRange(query);
    return this.expenseModel.aggregate([
      { $match: { ...NOT_DELETED, expenseDate: { $gte: start, $lte: end } } },
      { $group: { _id: '$status', value: { $sum: 1 }, amount: { $sum: '$amount' } } },
      { $project: { _id: 0, label: '$_id', value: 1, secondary: '$amount' } },
    ]);
  }

  async getRouteRevenue(query: ReportQueryDto, limit = 10) {
    const { start, end } = resolveDateRange(query);
    return this.tripModel.aggregate([
      {
        $match: {
          ...NOT_DELETED,
          status: TripStatus.COMPLETED,
          ...tripDateMatch(start, end),
        },
      },
      {
        $group: {
          _id: { $concat: ['$source', ' → ', '$destination'] },
          value: { $sum: TRIP_REVENUE },
          trips: { $sum: 1 },
          distance: { $sum: TRIP_DISTANCE },
        },
      },
      { $sort: { value: -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          label: '$_id',
          value: 1,
          secondary: '$trips',
        },
      },
    ]);
  }

  async getTripExtremes(query: ReportQueryDto) {
    const { start, end } = resolveDateRange(query);
    const match = {
      ...NOT_DELETED,
      status: TripStatus.COMPLETED,
      ...tripDateMatch(start, end),
    };
    const [longest] = await this.tripModel
      .aggregate([
        { $match: match },
        { $addFields: { distance: TRIP_DISTANCE } },
        { $sort: { distance: -1 } },
        { $limit: 1 },
        {
          $project: {
            tripNumber: 1,
            route: { $concat: ['$source', ' → ', '$destination'] },
            distance: 1,
            revenue: TRIP_REVENUE,
          },
        },
      ])
      .exec();
    const [shortest] = await this.tripModel
      .aggregate([
        { $match: match },
        { $addFields: { distance: TRIP_DISTANCE } },
        { $sort: { distance: 1 } },
        { $limit: 1 },
        {
          $project: {
            tripNumber: 1,
            route: { $concat: ['$source', ' → ', '$destination'] },
            distance: 1,
            revenue: TRIP_REVENUE,
          },
        },
      ])
      .exec();
    return { longest, shortest };
  }

  async getVendorPerformance(query: ReportQueryDto) {
    const { start, end } = resolveDateRange(query);
    return this.maintenanceModel.aggregate([
      {
        $match: {
          ...NOT_DELETED,
          vendorName: { $exists: true, $nin: [null, ''] },
          $expr: {
            $and: [
              {
                $gte: [
                  { $ifNull: ['$completedDate', { $ifNull: ['$startDate', '$createdAt'] }] },
                  start,
                ],
              },
              {
                $lte: [
                  { $ifNull: ['$completedDate', { $ifNull: ['$startDate', '$createdAt'] }] },
                  end,
                ],
              },
            ],
          },
        },
      },
      {
        $group: {
          _id: '$vendorName',
          value: { $sum: MAINTENANCE_COST },
          jobs: { $sum: 1 },
          avgRepairHours: {
            $avg: {
              $cond: [
                {
                  $and: [{ $ne: ['$completedDate', null] }, { $ne: ['$startDate', null] }],
                },
                {
                  $divide: [{ $subtract: ['$completedDate', '$startDate'] }, 1000 * 60 * 60],
                },
                null,
              ],
            },
          },
        },
      },
      { $sort: { value: -1 } },
      { $limit: 10 },
      {
        $project: {
          id: '$_id',
          label: '$_id',
          value: 1,
          secondary: '$jobs',
          meta: { avgRepairHours: { $ifNull: ['$avgRepairHours', 0] } },
        },
      },
    ]);
  }

  async getDriverLeaderboard(query: ReportQueryDto) {
    const { start, end } = resolveDateRange(query);
    const now = new Date();
    const in30 = new Date(now);
    in30.setDate(in30.getDate() + 30);

    return this.driverModel.aggregate([
      { $match: NOT_DELETED },
      {
        $lookup: {
          from: 'trips',
          let: { driverId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$driverId', '$$driverId'] },
                ...NOT_DELETED,
                ...tripDateMatch(start, end),
              },
            },
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                completed: {
                  $sum: { $cond: [{ $eq: ['$status', TripStatus.COMPLETED] }, 1, 0] },
                },
                cancelled: {
                  $sum: { $cond: [{ $eq: ['$status', TripStatus.CANCELLED] }, 1, 0] },
                },
                revenue: {
                  $sum: {
                    $cond: [{ $eq: ['$status', TripStatus.COMPLETED] }, TRIP_REVENUE, 0],
                  },
                },
                distance: {
                  $sum: {
                    $cond: [{ $eq: ['$status', TripStatus.COMPLETED] }, TRIP_DISTANCE, 0],
                  },
                },
              },
            },
          ],
          as: 'stats',
        },
      },
      {
        $addFields: {
          stats: { $ifNull: [{ $arrayElemAt: ['$stats', 0] }, {}] },
          licenseExpiringSoon: {
            $cond: [
              {
                $and: [
                  { $ne: ['$licenseExpiryDate', null] },
                  { $lte: ['$licenseExpiryDate', in30] },
                  { $gte: ['$licenseExpiryDate', now] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
      {
        $project: {
          id: { $toString: '$_id' },
          label: {
            $ifNull: [
              '$fullName',
              {
                $trim: {
                  input: {
                    $concat: [{ $ifNull: ['$firstName', ''] }, ' ', { $ifNull: ['$lastName', ''] }],
                  },
                },
              },
            ],
          },
          subtitle: { $ifNull: ['$employeeCode', ''] },
          value: { $ifNull: ['$stats.revenue', 0] },
          secondary: { $ifNull: ['$stats.completed', 0] },
          meta: {
            totalTrips: { $ifNull: ['$stats.total', 0] },
            cancelled: { $ifNull: ['$stats.cancelled', 0] },
            distance: { $ifNull: ['$stats.distance', 0] },
            safetyScore: { $ifNull: ['$safetyScore', 0] },
            status: '$status',
            licenseExpiringSoon: '$licenseExpiringSoon',
          },
        },
      },
      { $sort: { value: -1 } },
      { $limit: 50 },
    ]);
  }

  async getVehiclePerformanceTable(query: ReportQueryDto) {
    const { start, end } = resolveDateRange(query);
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const rows = await this.vehicleModel.aggregate([
      { $match: NOT_DELETED },
      {
        $lookup: {
          from: 'trips',
          let: { vid: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$vehicleId', '$$vid'] },
                ...NOT_DELETED,
                status: TripStatus.COMPLETED,
                ...tripDateMatch(start, end),
              },
            },
            {
              $group: {
                _id: null,
                trips: { $sum: 1 },
                revenue: { $sum: TRIP_REVENUE },
                distance: { $sum: TRIP_DISTANCE },
              },
            },
          ],
          as: 'trips',
        },
      },
      {
        $lookup: {
          from: 'maintenance',
          let: { vid: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$vehicleId', '$$vid'] },
                ...NOT_DELETED,
              },
            },
            {
              $group: {
                _id: null,
                cost: { $sum: MAINTENANCE_COST },
                count: { $sum: 1 },
              },
            },
          ],
          as: 'maintenance',
        },
      },
      {
        $addFields: {
          tripStats: { $ifNull: [{ $arrayElemAt: ['$trips', 0] }, {}] },
          maintStats: { $ifNull: [{ $arrayElemAt: ['$maintenance', 0] }, {}] },
        },
      },
      {
        $project: {
          vehicleId: 1,
          make: 1,
          model: 1,
          status: 1,
          trips: { $ifNull: ['$tripStats.trips', 0] },
          revenue: { $ifNull: ['$tripStats.revenue', 0] },
          distance: { $ifNull: ['$tripStats.distance', 0] },
          maintenanceCost: { $ifNull: ['$maintStats.cost', 0] },
          maintenanceCount: { $ifNull: ['$maintStats.count', 0] },
        },
      },
      { $sort: { revenue: -1 } },
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: limit }],
          total: [{ $count: 'count' }],
        },
      },
    ]);

    const facet = rows[0] ?? { data: [], total: [] };
    const total = facet.total[0]?.count ?? 0;
    return {
      rows: facet.data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async countLicenseExpiring(days = 30) {
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() + days);
    return this.driverModel.countDocuments({
      ...NOT_DELETED,
      licenseExpiryDate: { $gte: now, $lte: cutoff },
    });
  }
}
