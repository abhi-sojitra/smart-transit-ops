import type { Driver } from '@/types/driver';

export function getDriverDisplayName(
  driver: Pick<Driver, 'fullName' | 'firstName' | 'lastName' | 'name'>,
): string {
  if (driver.fullName?.trim()) return driver.fullName.trim();
  const composed = [driver.firstName, driver.lastName].filter(Boolean).join(' ').trim();
  if (composed) return composed;
  if (driver.name?.trim()) return driver.name.trim();
  return 'Unknown driver';
}

export function getInitials(name?: string | null): string {
  if (!name?.trim()) return '?';
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}
