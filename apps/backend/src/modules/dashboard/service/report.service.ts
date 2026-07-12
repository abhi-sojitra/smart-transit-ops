import { Injectable } from '@nestjs/common';
import type {
  DashboardReportPayload,
  ReportFormat,
  ReportPeriod,
} from '@transitops/shared-types';
import { DashboardService } from './dashboard.service';

@Injectable()
export class ReportService {
  constructor(private readonly dashboardService: DashboardService) {}

  async buildPayload(period: ReportPeriod = 'monthly'): Promise<DashboardReportPayload> {
    const [summary, topDrivers, topVehicles] = await Promise.all([
      this.dashboardService.getBusinessSummary(period),
      this.dashboardService.getTopDrivers(5),
      this.dashboardService.getTopVehicles(5),
    ]);

    return {
      summary,
      topDrivers,
      topVehicles,
      generatedAt: new Date().toISOString(),
    };
  }

  async export(
    period: ReportPeriod = 'monthly',
    format: ReportFormat = 'csv',
  ): Promise<{ filename: string; contentType: string; body: Buffer }> {
    const payload = await this.buildPayload(period);
    if (format === 'pdf') {
      const body = this.toPdf(payload);
      return {
        filename: `transitops-${period}-report.pdf`,
        contentType: 'application/pdf',
        body,
      };
    }

    const body = Buffer.from(this.toCsv(payload), 'utf8');
    return {
      filename: `transitops-${period}-report.csv`,
      contentType: 'text/csv; charset=utf-8',
      body,
    };
  }

  private toCsv(payload: DashboardReportPayload): string {
    const { summary } = payload;
    const lines = [
      'TransitOps Business Report',
      `Period,${summary.period}`,
      `Period Start,${summary.periodStart}`,
      `Period End,${summary.periodEnd}`,
      `Generated At,${payload.generatedAt}`,
      '',
      'Metric,Value',
      `Trips Completed,${summary.tripsCompleted}`,
      `Trips Cancelled,${summary.tripsCancelled}`,
      `Revenue,${summary.revenue}`,
      `Fuel Cost,${summary.fuelCost}`,
      `Expense Cost,${summary.expenseCost}`,
      `Maintenance Cost,${summary.maintenanceCost}`,
      `Operational Cost,${summary.operationalCost}`,
      `Profit,${summary.profit}`,
      `Active Vehicles,${summary.activeVehicles}`,
      `Active Drivers,${summary.activeDrivers}`,
      `Utilization Rate %,${summary.utilizationRate}`,
      '',
      'Top Drivers',
      'Name,Employee Code,Completed Trips,Revenue,Safety Score,Distance',
      ...payload.topDrivers.map(
        (d) =>
          `"${d.name}",${d.employeeCode},${d.completedTrips},${d.revenue},${d.safetyScore},${d.distance}`,
      ),
      '',
      'Top Vehicles',
      'Label,Completed Trips,Revenue,Operational Cost,ROI %',
      ...payload.topVehicles.map(
        (v) =>
          `"${v.label}",${v.completedTrips},${v.revenue},${v.operationalCost},${v.roi}`,
      ),
    ];
    return lines.join('\n');
  }

  private toPdf(payload: DashboardReportPayload): Buffer {
    const { summary } = payload;
    const lines = [
      'TransitOps Business Report',
      `Period: ${summary.period}`,
      `Range: ${summary.periodStart} → ${summary.periodEnd}`,
      `Generated: ${payload.generatedAt}`,
      '',
      `Trips Completed: ${summary.tripsCompleted}`,
      `Trips Cancelled: ${summary.tripsCancelled}`,
      `Revenue: ${summary.revenue}`,
      `Operational Cost: ${summary.operationalCost}`,
      `Profit: ${summary.profit}`,
      `Utilization: ${summary.utilizationRate}%`,
      '',
      'Top Drivers:',
      ...payload.topDrivers.map(
        (d, i) => `${i + 1}. ${d.name} — ${d.completedTrips} trips / $${d.revenue}`,
      ),
      '',
      'Top Vehicles:',
      ...payload.topVehicles.map(
        (v, i) => `${i + 1}. ${v.label} — ROI ${v.roi}% / $${v.revenue}`,
      ),
    ];

    const content = lines
      .map((line, index) => {
        const escaped = line.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
        const y = 750 - index * 16;
        return `BT /F1 11 Tf 50 ${y} Td (${escaped}) Tj ET`;
      })
      .join('\n');

    const objects = [
      '<< /Type /Catalog /Pages 2 0 R >>',
      '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>`,
      `<< /Length ${Buffer.byteLength(content, 'utf8')} >>\nstream\n${content}\nendstream`,
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    ];

    let pdf = '%PDF-1.4\n';
    const offsets: number[] = [0];
    objects.forEach((obj, i) => {
      offsets.push(Buffer.byteLength(pdf, 'utf8'));
      pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
    });
    const xrefOffset = Buffer.byteLength(pdf, 'utf8');
    pdf += `xref\n0 ${objects.length + 1}\n`;
    pdf += '0000000000 65535 f \n';
    for (let i = 1; i <= objects.length; i += 1) {
      pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
    }
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    return Buffer.from(pdf, 'utf8');
  }
}
