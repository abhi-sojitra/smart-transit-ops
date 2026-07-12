import { Controller, Get, Header, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';
import { RoleCode } from '@transitops/shared-types';
import type { Response } from 'express';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard, RolesGuard } from '../../common/guards/auth.guards';
import { AuditQueryDto } from './dto/audit-query.dto';
import { AuditService } from './audit.service';

const ADMIN_ROLES = [RoleCode.SUPER_ADMIN, RoleCode.ADMIN] as const;

@ApiTags('Audit')
@ApiBearerAuth()
@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'List audit logs' })
  findAll(@Query() query: AuditQueryDto) {
    return this.auditService.getAuditLogs(query);
  }

  @Get('export')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Export audit logs as CSV' })
  @ApiProduces('text/csv')
  @Header('Content-Type', 'text/csv')
  async export(@Query() query: AuditQueryDto, @Res() res: Response) {
    const csv = await this.auditService.exportCsv(query);
    res.setHeader('Content-Disposition', 'attachment; filename="audit-logs.csv"');
    res.send(csv);
  }
}
