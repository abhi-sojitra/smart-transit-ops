import { Injectable } from '@nestjs/common';
import type { BiInsight, BiLeaderboardRow, BiReportBase } from '@transitops/shared-types';
import { round2, safeDiv } from '../aggregation/report-pipelines';

@Injectable()
export class ReportInsightsService {
  build(report: Pick<BiReportBase, 'type' | 'kpis' | 'leaderboards' | 'charts'> & {
    extras?: Record<string, number>;
  }): BiInsight[] {
    const insights: BiInsight[] = [];
    const kpi = (key: string) => report.kpis.find((k) => k.key === key)?.value ?? 0;

    const utilization = kpi('fleetUtilization');
    if (utilization >= 70) {
      insights.push({
        id: 'util-high',
        severity: 'positive',
        title: 'Strong fleet utilization',
        detail: `Fleet utilization is ${utilization}%, indicating healthy dispatch throughput.`,
      });
    } else if (utilization > 0 && utilization < 40) {
      insights.push({
        id: 'util-low',
        severity: 'warning',
        title: 'Low fleet utilization',
        detail: `Fleet utilization is only ${utilization}%. Review idle vehicles and trip demand.`,
      });
    }

    const profit = kpi('profit');
    const revenue = kpi('totalRevenue') || kpi('revenue');
    const margin = safeDiv(profit * 100, revenue);
    if (revenue > 0 && margin < 10) {
      insights.push({
        id: 'margin-thin',
        severity: 'warning',
        title: 'Thin profit margin',
        detail: `Profit margin is ${margin}% of revenue. Review fuel, maintenance, and expense spend.`,
      });
    } else if (margin >= 25) {
      insights.push({
        id: 'margin-strong',
        severity: 'positive',
        title: 'Healthy profit margin',
        detail: `Profit margin is ${margin}% for the selected period.`,
      });
    }

    const maintRatio = safeDiv((kpi('maintenanceCost') || 0) * 100, revenue || 1);
    if (revenue > 0 && maintRatio > 20) {
      insights.push({
        id: 'maint-ratio',
        severity: 'critical',
        title: 'Maintenance cost pressure',
        detail: `Maintenance is ${maintRatio}% of revenue — above the 20% attention threshold.`,
      });
    }

    const topVehicle = first(report.leaderboards.topRevenueVehicles);
    if (topVehicle) {
      insights.push({
        id: 'top-vehicle',
        severity: 'info',
        title: 'Top revenue vehicle',
        detail: `${topVehicle.label} generated ${formatMoney(Number(topVehicle.value))} in revenue.`,
      });
    }

    const topDriver = first(report.leaderboards.topRevenueDrivers);
    if (topDriver) {
      insights.push({
        id: 'top-driver',
        severity: 'info',
        title: 'Top revenue driver',
        detail: `${topDriver.label} generated ${formatMoney(Number(topDriver.value))} this period.`,
      });
    }

    const highMaint = first(report.leaderboards.highestMaintenanceVehicles);
    if (highMaint) {
      insights.push({
        id: 'high-maint-vehicle',
        severity: 'warning',
        title: 'Highest maintenance vehicle',
        detail: `${highMaint.label} leads maintenance spend at ${formatMoney(Number(highMaint.secondary ?? highMaint.value))}.`,
      });
    }

    const highFuel = first(report.leaderboards.highestFuelVehicles);
    if (highFuel) {
      insights.push({
        id: 'high-fuel',
        severity: 'info',
        title: 'Highest fuel consumption',
        detail: `${highFuel.label} consumed ${round2(Number(highFuel.value))} L of fuel.`,
      });
    }

    const lowRoi = (report.leaderboards.lowestPerformingVehicles ?? []).filter(
      (row) => Number(row.value) < (revenue > 0 ? revenue / 20 : 0),
    );
    if (lowRoi.length >= 3) {
      insights.push({
        id: 'low-roi-cluster',
        severity: 'warning',
        title: 'Below-average vehicle returns',
        detail: `${lowRoi.length} vehicles are trailing peer revenue for this period.`,
      });
    }

    const licenseExpiring = report.extras?.licenseExpiringSoon ?? 0;
    if (licenseExpiring > 0) {
      insights.push({
        id: 'license-expiry',
        severity: 'critical',
        title: 'Licenses expiring soon',
        detail: `${licenseExpiring} driver license(s) expire within 30 days.`,
      });
    }

    const fuelTrend = report.charts.fuelCost ?? report.charts.fuelConsumption ?? [];
    if (fuelTrend.length >= 2) {
      const prev = Number(fuelTrend[fuelTrend.length - 2]?.value ?? 0);
      const curr = Number(fuelTrend[fuelTrend.length - 1]?.value ?? 0);
      if (prev > 0) {
        const change = round2(((curr - prev) / prev) * 100);
        if (Math.abs(change) >= 5) {
          insights.push({
            id: 'fuel-trend',
            severity: change > 0 ? 'warning' : 'positive',
            title: change > 0 ? 'Fuel spend rising' : 'Fuel spend declining',
            detail: `Fuel metrics changed by ${change}% versus the previous month in range.`,
          });
        }
      }
    }

    if (!insights.length) {
      insights.push({
        id: 'baseline',
        severity: 'info',
        title: 'Stable operations',
        detail: 'No exceptional variances detected for the selected filters.',
      });
    }

    return insights.slice(0, 8);
  }
}

function first(rows?: BiLeaderboardRow[]) {
  return rows?.[0];
}

function formatMoney(value: number) {
  return `$${round2(value).toLocaleString()}`;
}
