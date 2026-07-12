jest.mock('../../../repositories/permission.repository', () => ({
  PermissionRepository: class PermissionRepository {},
}));
jest.mock('../../../repositories/role.repository', () => ({
  RoleRepository: class RoleRepository {},
}));

import { Test, TestingModule } from '@nestjs/testing';
import { PermissionRepository } from '../../../repositories/permission.repository';
import { RoleRepository } from '../../../repositories/role.repository';
import { PermissionsService } from '../permissions.service';

describe('PermissionsService', () => {
  let service: PermissionsService;

  const permissions = {
    countAll: jest.fn(),
    insertMany: jest.fn(),
    search: jest.fn(),
    findAll: jest.fn(),
  };

  const roles = {
    findAll: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsService,
        { provide: PermissionRepository, useValue: permissions },
        { provide: RoleRepository, useValue: roles },
      ],
    }).compile();

    service = module.get(PermissionsService);
    jest.clearAllMocks();
  });

  it('seeds catalog when empty', async () => {
    permissions.countAll.mockResolvedValue(0);
    permissions.insertMany.mockResolvedValue([]);
    const result = await service.ensureCatalog();
    expect(result.seeded).toBe(true);
    expect(permissions.insertMany).toHaveBeenCalled();
  });

  it('builds matrix', async () => {
    permissions.countAll.mockResolvedValue(1);
    permissions.findAll.mockResolvedValue([
      {
        _id: { toString: () => 'p1' },
        code: 'USERS:VIEW',
        module: 'USERS',
        action: 'VIEW',
        description: 'View users',
        group: 'Administration',
      },
    ]);
    roles.findAll.mockResolvedValue([
      {
        _id: { toString: () => 'r1' },
        code: 'ADMIN',
        name: 'Admin',
        permissions: ['USERS:VIEW'],
      },
    ]);

    const matrix = await service.matrix();
    expect(matrix.matrix.ADMIN).toEqual(['USERS:VIEW']);
  });
});
