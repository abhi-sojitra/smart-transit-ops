import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiProduces,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { JwtAuthGuard, PermissionsGuard, RolesGuard } from '../../../common/guards/auth.guards';
import {
  DashboardActivityQueryDto,
  DashboardLimitQueryDto,
  ReportQueryDto,
} from '../dto/dashboard-query.dto';
import { DashboardService } from '../service/dashboard.service';
import { ReportService } from '../service/report.service';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
@UseGuards(JwtAuthGuard, PermissionsGuard, RolesGuard)
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly reportService: ReportService,
  ) {}

  @Get('overview')
  @RequirePermissions('DASHBOARD:VIEW')
  @ApiOperation({ summary: 'Fleet-wide operational overview cards' })
  @ApiResponse({ status: 200, description: 'Dashboard overview returned' })
  getOverview() {
    return this.dashboardService.getOverview();
  }

  @Get('recent-activity')
  @RequirePermissions('DASHBOARD:VIEW')
  @ApiOperation({ summary: 'Unified recent activity timeline' })
  getRecentActivity(@Query() query: DashboardActivityQueryDto) {
    return this.dashboardService.getRecentActivity(query.limit ?? 20);
  }

  @Get('charts')
  @RequirePermissions('DASHBOARD:VIEW')
  @ApiOperation({ summary: 'Dashboard chart datasets' })
  getCharts() {
    return this.dashboardService.getCharts();
  }

  @Get('alerts')
  @RequirePermissions('DASHBOARD:VIEW')
  @ApiOperation({ summary: 'Operational alerts (critical, warning, info)' })
  getAlerts() {
    return this.dashboardService.getAlerts();
  }

  @Get('top-drivers')
  @RequirePermissions('DASHBOARD:VIEW')
  @ApiOperation({ summary: 'Top performing drivers leaderboard' })
  getTopDrivers(@Query() query: DashboardLimitQueryDto) {
    return this.dashboardService.getTopDrivers(query.limit ?? 10);
  }

  @Get('top-vehicles')
  @RequirePermissions('DASHBOARD:VIEW')
  @ApiOperation({ summary: 'Top vehicles by ROI leaderboard' })
  getTopVehicles(@Query() query: DashboardLimitQueryDto) {
    return this.dashboardService.getTopVehicles(query.limit ?? 10);
  }

  @Get('upcoming-maintenance')
  @RequirePermissions('DASHBOARD:VIEW')
  @ApiOperation({ summary: 'Upcoming scheduled maintenance' })
  getUpcomingMaintenance(@Query() query: DashboardLimitQueryDto) {
    return this.dashboardService.getUpcomingMaintenance(query.limit ?? 10);
  }

  @Get('recent-trips')
  @RequirePermissions('DASHBOARD:VIEW')
  @ApiOperation({ summary: 'Most recent trips' })
  getRecentTrips(@Query() query: DashboardLimitQueryDto) {
    return this.dashboardService.getRecentTrips(query.limit ?? 10);
  }

  @Get('business-summary')
  @RequirePermissions('DASHBOARD:VIEW')
  @ApiOperation({ summary: 'Business summary for daily/weekly/monthly period' })
  getBusinessSummary(@Query() query: ReportQueryDto) {
    return this.dashboardService.getBusinessSummary(query.period ?? 'monthly');
  }

  @Get('reports/export')
  @RequirePermissions('REPORTS:EXPORT')
  @ApiOperation({ summary: 'Export business report as CSV or PDF' })
  @ApiProduces('text/csv', 'application/pdf')
  @ApiResponse({ status: 200, description: 'Report file download' })
  async exportReport(@Query() query: ReportQueryDto, @Res() res: Response) {
    const file = await this.reportService.export(query.period ?? 'monthly', query.format ?? 'csv');
    res.setHeader('Content-Type', file.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    res.send(file.body);
  }
}
