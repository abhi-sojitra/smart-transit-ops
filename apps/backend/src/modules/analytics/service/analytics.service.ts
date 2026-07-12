import { Injectable } from '@nestjs/common';
import type { ReportPeriod } from '@transitops/shared-types';
import { DashboardService } from '../../dashboard/service/dashboard.service';
import { ReportService } from '../../dashboard/service/report.service';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly reportService: ReportService,
  ) {}

  getCharts(months = 6) {
    return this.dashboardService.getCharts(months);
  }

  getBusinessSummary(period: ReportPeriod = 'monthly') {
    return this.dashboardService.getBusinessSummary(period);
  }

  getReportPayload(period: ReportPeriod = 'monthly') {
    return this.reportService.buildPayload(period);
  }

  exportReport(period: ReportPeriod = 'monthly', format: 'csv' | 'pdf' = 'csv') {
    return this.reportService.export(period, format);
  }
}
