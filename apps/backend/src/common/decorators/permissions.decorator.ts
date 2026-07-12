import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';
export const PERMISSIONS_MODE_KEY = 'permissions_mode';

export type PermissionMode = 'any' | 'all';

/**
 * Require one or more permission codes (e.g. VEHICLE:VIEW).
 * Default mode is "any" — user needs at least one listed permission.
 * Super Admin "*" always passes.
 */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

export const PermissionModeMeta = (mode: PermissionMode) =>
  SetMetadata(PERMISSIONS_MODE_KEY, mode);
