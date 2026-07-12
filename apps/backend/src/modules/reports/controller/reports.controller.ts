import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import { RoleCode, type BiReportType, type JwtPayload } from '@transitops/shared-types';
import type { Response } from 'express';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard, RolesGuard } from '../../../common/guards/auth.guards';
import { ReportsService } from '../service/reports.service';
import {
  BI_REPORT_TYPES,
  ExportReportDto,
  ReportQueryDto,
  ScheduleReportDto,
} from '../dto/report-query.dto';

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

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('catalog')
  @Roles(...READ_ROLES)
  @ApiOperation({ summary: 'List available BI report definitions' })
  catalog() {
    return this.reportsService.catalog();
  }

  @Get('schedules')
  @Roles(...READ_ROLES)
  @ApiOperation({ summary: 'List scheduled report jobs' })
  listSchedules(@CurrentUser() user?: JwtPayload) {
    return this.reportsService.listSchedules(user);
  }

  @Get('executive')
  @Roles(...READ_ROLES)
  getExecutive(@Query() query: ReportQueryDto, @CurrentUser() user?: JwtPayload) {
    return this.reportsService.getReport('executive', query, user);
  }

  @Get('fleet')
  @Roles(...READ_ROLES)
  getFleet(@Query() query: ReportQueryDto, @CurrentUser() user?: JwtPayload) {
    return this.reportsService.getReport('fleet', query, user);
  }

  @Get('drivers')
  @Roles(...READ_ROLES)
  getDrivers(@Query() query: ReportQueryDto, @CurrentUser() user?: JwtPayload) {
    return this.reportsService.getReport('drivers', query, user);
  }

  @Get('vehicles')
  @Roles(...READ_ROLES)
  getVehicles(@Query() query: ReportQueryDto, @CurrentUser() user?: JwtPayload) {
    return this.reportsService.getReport('vehicles', query, user);
  }

  @Get('trips')
  @Roles(...READ_ROLES)
  getTrips(@Query() query: ReportQueryDto, @CurrentUser() user?: JwtPayload) {
    return this.reportsService.getReport('trips', query, user);
  }

  @Get('maintenance')
  @Roles(...READ_ROLES)
  getMaintenance(@Query() query: ReportQueryDto, @CurrentUser() user?: JwtPayload) {
    return this.reportsService.getReport('maintenance', query, user);
  }

  @Get('fuel')
  @Roles(...READ_ROLES)
  getFuel(@Query() query: ReportQueryDto, @CurrentUser() user?: JwtPayload) {
    return this.reportsService.getReport('fuel', query, user);
  }

  @Get('expenses')
  @Roles(...READ_ROLES)
  getExpenses(@Query() query: ReportQueryDto, @CurrentUser() user?: JwtPayload) {
    return this.reportsService.getReport('expenses', query, user);
  }

  @Get('financial')
  @Roles(...READ_ROLES)
  getFinancial(@Query() query: ReportQueryDto, @CurrentUser() user?: JwtPayload) {
    return this.reportsService.getReport('financial', query, user);
  }

  @Get('profitability')
  @Roles(...READ_ROLES)
  getProfitability(@Query() query: ReportQueryDto, @CurrentUser() user?: JwtPayload) {
    return this.reportsService.getReport('profitability', query, user);
  }

  @Get(':type')
  @Roles(...READ_ROLES)
  @ApiOperation({ summary: 'Fetch any report by type param' })
  getByType(
    @Param('type') type: string,
    @Query() query: ReportQueryDto,
    @CurrentUser() user?: JwtPayload,
  ) {
    if (!(BI_REPORT_TYPES as readonly string[]).includes(type)) {
      return this.reportsService.getReport('executive', query, user);
    }
    return this.reportsService.getReport(type as BiReportType, query, user);
  }

  @Post('export')
  @Roles(...READ_ROLES)
  @ApiProduces('text/csv', 'application/pdf', 'application/vnd.ms-excel')
  @ApiOperation({ summary: 'Export a BI report as CSV, PDF, or Excel' })
  async export(
    @Body() dto: ExportReportDto,
    @CurrentUser() user: JwtPayload | undefined,
    @Res() res: Response,
  ) {
    const file = await this.reportsService.export(dto, user);
    res.setHeader('Content-Type', file.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    res.send(file.body);
  }

  @Post('schedule')
  @Roles(
    RoleCode.SUPER_ADMIN,
    RoleCode.ADMIN,
    RoleCode.FLEET_MANAGER,
    RoleCode.FINANCIAL_ANALYST,
  )
  @ApiOperation({ summary: 'Create a scheduled report generation job' })
  schedule(@Body() dto: ScheduleReportDto, @CurrentUser() user?: JwtPayload) {
    return this.reportsService.schedule(dto, user);
  }
}
