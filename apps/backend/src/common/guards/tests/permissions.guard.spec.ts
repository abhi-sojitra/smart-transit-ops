import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from '../permissions.guard';
import { PERMISSIONS_KEY, PERMISSIONS_MODE_KEY } from '../../decorators/permissions.decorator';

describe('PermissionsGuard', () => {
  const roles = {
    findByCodes: jest.fn(),
  };
  const reflector = {
    getAllAndOverride: jest.fn(),
  };

  const guard = new PermissionsGuard(
    reflector as unknown as Reflector,
    roles as never,
  );

  function context(user?: { sub: string; roles: string[]; permissions?: string[] }) {
    const request = { user };
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({ getRequest: () => request }),
    } as never;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    reflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === PERMISSIONS_MODE_KEY) return undefined;
      return undefined;
    });
  });

  it('allows when no permission metadata is set', async () => {
    await expect(guard.canActivate(context({ sub: '1', roles: ['VIEWER'] }))).resolves.toBe(
      true,
    );
  });

  it('blocks when required permission is missing from role', async () => {
    reflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === PERMISSIONS_KEY) return ['VEHICLE:CREATE'];
      return undefined;
    });
    roles.findByCodes.mockResolvedValue([
      { code: 'VIEWER', permissions: ['VEHICLE:VIEW', 'PROFILE:VIEW'] },
    ]);

    await expect(
      guard.canActivate(context({ sub: '1', roles: ['VIEWER'] })),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows when role includes required permission', async () => {
    reflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === PERMISSIONS_KEY) return ['VEHICLE:VIEW'];
      return undefined;
    });
    roles.findByCodes.mockResolvedValue([
      { code: 'VIEWER', permissions: ['VEHICLE:VIEW'] },
    ]);

    await expect(
      guard.canActivate(context({ sub: '1', roles: ['VIEWER'] })),
    ).resolves.toBe(true);
  });

  it('allows Super Admin wildcard', async () => {
    reflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === PERMISSIONS_KEY) return ['USERS:DELETE'];
      return undefined;
    });
    roles.findByCodes.mockResolvedValue([{ code: 'SUPER_ADMIN', permissions: ['*'] }]);

    await expect(
      guard.canActivate(context({ sub: '1', roles: ['SUPER_ADMIN'] })),
    ).resolves.toBe(true);
  });
});
