import { Injectable } from '@nestjs/common';
import type { AuditLogItem } from '@transitops/shared-types';
import { AuditLogRepository, type AuditQueryOptions } from '../../repositories/audit-log.repository';

function mapAudit(doc: {
  _id: { toString(): string };
  action: AuditLogItem['action'];
  module: AuditLogItem['module'];
  entityType?: string;
  entityId?: string;
  summary: string;
  actorId?: { toString(): string };
  actorEmail?: string;
  actorName?: string;
  ip?: string;
  userAgent?: string;
  browser?: string;
  device?: string;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
}): AuditLogItem {
  return {
    id: doc._id.toString(),
    action: doc.action,
    module: doc.module,
    entityType: doc.entityType,
    entityId: doc.entityId,
    summary: doc.summary,
    actorId: doc.actorId?.toString(),
    actorEmail: doc.actorEmail,
    actorName: doc.actorName,
    ip: doc.ip,
    userAgent: doc.userAgent,
    browser: doc.browser,
    device: doc.device,
    metadata: doc.metadata,
    createdAt: doc.createdAt?.toISOString() ?? new Date().toISOString(),
  };
}

@Injectable()
export class AuditService {
  constructor(private readonly audit: AuditLogRepository) {}

  async getAuditLogs(query: AuditQueryOptions) {
    const result = await this.audit.findPaginated(query);
    return {
      data: result.items.map(mapAudit),
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit) || 1,
      },
    };
  }

  async exportCsv(query: AuditQueryOptions) {
    const result = await this.audit.findPaginated({ ...query, page: 1, limit: 1000 });
    const header =
      'Date,Action,Module,Summary,Actor,Email,IP,Browser,Device';
    const rows = result.items.map((item) => {
      const mapped = mapAudit(item);
      return [
        mapped.createdAt,
        mapped.action,
        mapped.module,
        `"${mapped.summary.replaceAll('"', '""')}"`,
        mapped.actorName ?? '',
        mapped.actorEmail ?? '',
        mapped.ip ?? '',
        mapped.browser ?? '',
        mapped.device ?? '',
      ].join(',');
    });
    return [header, ...rows].join('\n');
  }
}
