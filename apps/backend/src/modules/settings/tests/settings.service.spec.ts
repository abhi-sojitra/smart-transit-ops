jest.mock('../../../repositories/app-settings.repository', () => ({
  AppSettingsRepository: class AppSettingsRepository {},
}));
jest.mock('../../../repositories/user.repository', () => ({
  UserRepository: class UserRepository {},
}));
jest.mock('../../../repositories/role.repository', () => ({
  RoleRepository: class RoleRepository {},
}));
jest.mock('../../../repositories/permission.repository', () => ({
  PermissionRepository: class PermissionRepository {},
}));
jest.mock('../../../repositories/audit-log.repository', () => ({
  AuditLogRepository: class AuditLogRepository {},
}));

import { Test, TestingModule } from '@nestjs/testing';
import { AppSettingsRepository } from '../../../repositories/app-settings.repository';
import { UserRepository } from '../../../repositories/user.repository';
import { RoleRepository } from '../../../repositories/role.repository';
import { PermissionRepository } from '../../../repositories/permission.repository';
import { AuditLogRepository } from '../../../repositories/audit-log.repository';
import { SettingsService } from '../settings.service';

describe('SettingsService', () => {
  let service: SettingsService;

  const settings = {
    getOrCreate: jest.fn(),
    updateCompany: jest.fn(),
  };

  const users = {
    countByStatus: jest.fn(),
    countByRole: jest.fn(),
  };

  const roles = { countAll: jest.fn() };
  const permissions = { countAll: jest.fn() };
  const audit = {
    create: jest.fn(),
    countToday: jest.fn(),
    loginActivity: jest.fn(),
    countByModule: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        { provide: AppSettingsRepository, useValue: settings },
        { provide: UserRepository, useValue: users },
        { provide: RoleRepository, useValue: roles },
        { provide: PermissionRepository, useValue: permissions },
        { provide: AuditLogRepository, useValue: audit },
      ],
    }).compile();

    service = module.get(SettingsService);
    jest.clearAllMocks();
  });

  it('returns company settings', async () => {
    settings.getOrCreate.mockResolvedValue({
      company: { companyName: 'TransitOps', country: 'US', currency: 'USD' },
      updatedAt: new Date(),
    });
    const result = await service.getCompanySettings();
    expect(result.companyName).toBe('TransitOps');
  });

  it('aggregates system statistics', async () => {
    users.countByStatus.mockResolvedValue([
      { _id: 'ACTIVE', count: 10 },
      { _id: 'INACTIVE', count: 2 },
    ]);
    users.countByRole.mockResolvedValue([{ role: 'ADMIN', count: 2 }]);
    roles.countAll.mockResolvedValue(8);
    permissions.countAll.mockResolvedValue(40);
    audit.countToday.mockResolvedValueOnce(1).mockResolvedValueOnce(12);
    audit.loginActivity.mockResolvedValue([]);
    audit.countByModule.mockResolvedValue([]);

    const stats = await service.getSystemStatistics();
    expect(stats.totalUsers).toBe(12);
    expect(stats.activeUsers).toBe(10);
    expect(stats.totalRoles).toBe(8);
  });
});
