import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiProduces,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RoleCode } from '@transitops/shared-types';
import type { Response } from 'express';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard, RolesGuard } from '../../../common/guards/auth.guards';
import {
  AnalyticsChartsQueryDto,
  ReportQueryDto,
} from '../../dashboard/dto/dashboard-query.dto';
import { AnalyticsService } from '../service/analytics.service';

const READ_ROLES = [
  RoleCode.SUPER_ADMIN,
  RoleCode.ADMIN,
  RoleCode.FLEET_MANAGER,
  RoleCode.DISPATCHER,
  RoleCode.FINANCIAL_ANALYST,
  RoleCode.SAFETY_OFFICER,
  RoleCode.OPERATOR,
  RoleCode.VIEWER,
] as const;

@ApiTags('Analytics')
@ApiBearerAuth()
@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('charts')
  @Roles(...READ_ROLES)
  @ApiOperation({ summary: 'Analytics chart datasets for trends and ROI' })
  @ApiResponse({ status: 200, description: 'Chart datasets returned' })
  getCharts(@Query() query: AnalyticsChartsQueryDto) {
    return this.analyticsService.getCharts(query.months ?? 6);
  }

  @Get('summary')
  @Roles(...READ_ROLES)
  @ApiOperation({ summary: 'Period business summary for analytics views' })
  getSummary(@Query() query: ReportQueryDto) {
    return this.analyticsService.getBusinessSummary(query.period ?? 'monthly');
  }

  @Get('reports')
  @Roles(...READ_ROLES)
  @ApiOperation({ summary: 'Structured report payload for reports UI' })
  getReports(@Query() query: ReportQueryDto) {
    return this.analyticsService.getReportPayload(query.period ?? 'monthly');
  }

  @Get('reports/export')
  @Roles(...READ_ROLES)
  @ApiOperation({ summary: 'Export analytics report as CSV or PDF' })
  @ApiProduces('text/csv', 'application/pdf')
  async exportReport(@Query() query: ReportQueryDto, @Res() res: Response) {
    const file = await this.analyticsService.exportReport(
      query.period ?? 'monthly',
      query.format ?? 'csv',
    );
    res.setHeader('Content-Type', file.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    res.send(file.body);
  }
}
