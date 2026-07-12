# Settings & Administration Module

Enterprise administration center for TransitOps: users, roles, permissions, company/security/notification settings, profile, and audit logs.

## Architecture

```text
UsersModule          /api/users/*
RolesModule          /api/roles/*
PermissionsModule    /api/permissions/*
SettingsModule       /api/settings/*, /api/profile/*, /api/security/*
NotificationsModule  /api/notifications/settings
AuditModule          /api/audit/*
```

Existing Vehicle / Driver / Trip / Maintenance / Fuel / Dashboard modules are **not modified**.

## Key methods

| Method | Location |
|--------|----------|
| `getUserPermissions()` | `UsersService` |
| `assignRole()` / `removeRole()` | `UsersService` |
| `updatePermissions()` | `RolesService` |
| `getAuditLogs()` | `AuditService` |
| `updateCompanySettings()` | `SettingsService` |
| `updateNotificationSettings()` | `SettingsService` |
| `updateSecuritySettings()` | `SettingsService` |
| `updateProfile()` | `SettingsService` |
| `getSystemStatistics()` | `SettingsService` |

## Seed

```bash
yarn workspace @transitops/backend seed
```

Seeds roles (with RBAC matrix permissions), ~20 users, permission catalog (~60+), 50 audit logs, and default app settings.

## Tests

```bash
yarn workspace @transitops/backend test --testPathPatterns='users|roles|permissions|settings|audit'
```

## Frontend

- `/settings` — admin hub + stats
- `/settings/company`, `/settings/security`, `/settings/notifications`, `/settings/appearance`
- `/settings/users`, `/settings/roles`, `/settings/permissions`
- `/settings/audit`, `/settings/activity`
- `/profile` — profile + password
