jest.mock('../../../repositories/role.repository', () => ({
  RoleRepository: class RoleRepository {},
}));
jest.mock('../../../repositories/user.repository', () => ({
  UserRepository: class UserRepository {},
}));
jest.mock('../../../repositories/audit-log.repository', () => ({
  AuditLogRepository: class AuditLogRepository {},
}));

import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RoleCode } from '@transitops/shared-types';
import { RoleRepository } from '../../../repositories/role.repository';
import { UserRepository } from '../../../repositories/user.repository';
import { AuditLogRepository } from '../../../repositories/audit-log.repository';
import { RolesService } from '../roles.service';

describe('RolesService', () => {
  let service: RolesService;

  const roles = {
    search: jest.fn(),
    findById: jest.fn(),
    findByCode: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const users = {
    countUsersWithRole: jest.fn(),
  };

  const audit = { create: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        { provide: RoleRepository, useValue: roles },
        { provide: UserRepository, useValue: users },
        { provide: AuditLogRepository, useValue: audit },
      ],
    }).compile();

    service = module.get(RolesService);
    jest.clearAllMocks();
  });

  it('blocks deleting system roles', async () => {
    roles.findById.mockResolvedValue({
      _id: { toString: () => '1' },
      code: RoleCode.ADMIN,
      isSystem: true,
    });
    await expect(service.remove('1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('clones permissions onto target role', async () => {
    roles.findById.mockResolvedValue({
      _id: { toString: () => '1' },
      code: RoleCode.ADMIN,
      permissions: ['USERS:VIEW'],
    });
    roles.findByCode.mockResolvedValue({
      _id: { toString: () => '2' },
      code: RoleCode.VIEWER,
    });
    roles.update.mockResolvedValue({
      _id: { toString: () => '2' },
      code: RoleCode.VIEWER,
      name: 'Viewer',
      permissions: ['USERS:VIEW'],
      isSystem: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    users.countUsersWithRole.mockResolvedValue(0);

    const result = await service.clonePermissions('1', { targetCode: RoleCode.VIEWER });
    expect(result.permissions).toEqual(['USERS:VIEW']);
  });
});
