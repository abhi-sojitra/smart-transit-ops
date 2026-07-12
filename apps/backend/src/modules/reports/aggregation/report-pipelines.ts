import { Types } from 'mongoose';
import type { ReportQueryDto } from '../dto/report-query.dto';

export const NOT_DELETED = { isDeleted: { $ne: true } };

export const MAINTENANCE_COST = {
  $ifNull: ['$actualCost', { $ifNull: ['$estimatedCost', 0] }],
};

export const TRIP_REVENUE = {
  $ifNull: ['$actualRevenue', { $ifNull: ['$estimatedRevenue', 0] }],
};

export const TRIP_DISTANCE = {
  $ifNull: ['$actualDistance', { $ifNull: ['$plannedDistance', 0] }],
};

export function resolveDateRange(query: ReportQueryDto): { start: Date; end: Date } {
  const end = query.endDate ? new Date(query.endDate) : new Date();
  end.setHours(23, 59, 59, 999);
  const start = query.startDate
    ? new Date(query.startDate)
    : new Date(end.getFullYear(), end.getMonth() - 1, end.getDate());
  start.setHours(0, 0, 0, 0);
  return { start, end };
}

export function tripDateMatch(start: Date, end: Date) {
  return {
    $or: [
      { actualEndDate: { $gte: start, $lte: end } },
      {
        actualEndDate: { $exists: false },
        plannedEndDate: { $gte: start, $lte: end },
      },
      {
        actualEndDate: null,
        plannedEndDate: { $gte: start, $lte: end },
      },
    ],
  };
}

export function toObjectId(id?: string): Types.ObjectId | undefined {
  if (!id || !Types.ObjectId.isValid(id)) return undefined;
  return new Types.ObjectId(id);
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function safeDiv(numerator: number, denominator: number): number {
  if (!denominator) return 0;
  return round2(numerator / denominator);
}
