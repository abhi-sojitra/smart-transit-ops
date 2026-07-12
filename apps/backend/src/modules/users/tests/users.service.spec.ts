jest.mock('../../../repositories/user.repository', () => ({
  UserRepository: class UserRepository {},
}));
jest.mock('../../../repositories/role.repository', () => ({
  RoleRepository: class RoleRepository {},
}));
jest.mock('../../../repositories/audit-log.repository', () => ({
  AuditLogRepository: class AuditLogRepository {},
}));

import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RoleCode, UserAccountStatus } from '@transitops/shared-types';
import { UserRepository } from '../../../repositories/user.repository';
import { RoleRepository } from '../../../repositories/role.repository';
import { AuditLogRepository } from '../../../repositories/audit-log.repository';
import { UsersService } from '../users.service';

jest.mock('bcryptjs', () => ({
  hash: jest.fn(async () => 'hashed'),
  compare: jest.fn(async () => true),
}));

describe('UsersService', () => {
  let service: UsersService;

  const users = {
    findPaginated: jest.fn(),
    findById: jest.fn(),
    findByEmail: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    softDeleteMany: jest.fn(),
    updateStatusMany: jest.fn(),
  };

  const roles = {
    findByCodes: jest.fn(),
  };

  const audit = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UserRepository, useValue: users },
        { provide: RoleRepository, useValue: roles },
        { provide: AuditLogRepository, useValue: audit },
      ],
    }).compile();

    service = module.get(UsersService);
    jest.clearAllMocks();
  });

  it('creates a user', async () => {
    users.findByEmail.mockResolvedValue(null);
    roles.findByCodes.mockResolvedValue([{ _id: { toString: () => 'r1' }, code: RoleCode.ADMIN }]);
    users.create.mockResolvedValue({ _id: { toString: () => 'u1' } });
    users.findById.mockResolvedValue({
      _id: { toString: () => 'u1' },
      email: 'a@test.com',
      firstName: 'A',
      lastName: 'B',
      roles: [{ _id: { toString: () => 'r1' }, code: RoleCode.ADMIN }],
      status: UserAccountStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.create({
      email: 'a@test.com',
      password: 'Password1!',
      firstName: 'A',
      lastName: 'B',
      roles: [RoleCode.ADMIN],
    });

    expect(result.email).toBe('a@test.com');
    expect(audit.create).toHaveBeenCalled();
  });

  it('rejects duplicate email', async () => {
    users.findByEmail.mockResolvedValue({ email: 'a@test.com' });
    await expect(
      service.create({
        email: 'a@test.com',
        password: 'Password1!',
        firstName: 'A',
        lastName: 'B',
        roles: [RoleCode.ADMIN],
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws when user missing', async () => {
    users.findById.mockResolvedValue(null);
    await expect(service.findById('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
