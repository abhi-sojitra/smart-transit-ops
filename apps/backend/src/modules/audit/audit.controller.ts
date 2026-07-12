import { Controller, Get, Header, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard, PermissionsGuard, RolesGuard } from '../../common/guards/auth.guards';
import { AuditQueryDto } from './dto/audit-query.dto';
import { AuditService } from './audit.service';

@ApiTags('Audit')
@ApiBearerAuth()
@Controller('audit')
@UseGuards(JwtAuthGuard, PermissionsGuard, RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @RequirePermissions('AUDIT:VIEW')
  @ApiOperation({ summary: 'List audit logs' })
  findAll(@Query() query: AuditQueryDto) {
    return this.auditService.getAuditLogs(query);
  }

  @Get('export')
  @RequirePermissions('AUDIT:EXPORT')
  @ApiOperation({ summary: 'Export audit logs as CSV' })
  @ApiProduces('text/csv')
  @Header('Content-Type', 'text/csv')
  async export(@Query() query: AuditQueryDto, @Res() res: Response) {
    const csv = await this.auditService.exportCsv(query);
    res.setHeader('Content-Disposition', 'attachment; filename="audit-logs.csv"');
    res.send(csv);
  }
}
