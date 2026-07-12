jest.mock('../../../repositories/audit-log.repository', () => ({
  AuditLogRepository: class AuditLogRepository {},
}));

import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogRepository } from '../../../repositories/audit-log.repository';
import { AuditService } from '../audit.service';

describe('AuditService', () => {
  let service: AuditService;

  const audit = {
    findPaginated: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuditService, { provide: AuditLogRepository, useValue: audit }],
    }).compile();

    service = module.get(AuditService);
    jest.clearAllMocks();
  });

  it('maps audit logs', async () => {
    audit.findPaginated.mockResolvedValue({
      items: [
        {
          _id: { toString: () => 'a1' },
          action: 'LOGIN',
          module: 'AUTH',
          summary: 'User logged in',
          createdAt: new Date('2026-07-01'),
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
    });

    const result = await service.getAuditLogs({});
    expect(result.data[0].action).toBe('LOGIN');
    expect(result.meta.total).toBe(1);
  });

  it('exports csv', async () => {
    audit.findPaginated.mockResolvedValue({
      items: [
        {
          _id: { toString: () => 'a1' },
          action: 'LOGIN',
          module: 'AUTH',
          summary: 'User logged in',
          createdAt: new Date('2026-07-01'),
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
    });
    const csv = await service.exportCsv({});
    expect(csv).toContain('Action,Module');
    expect(csv).toContain('LOGIN');
  });
});
