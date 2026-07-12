# Maintenance Module

Production-ready Preventive & Corrective Maintenance for TransitOps.

## Scope

- Full CRUD with soft delete
- Vehicle status automation (`AVAILABLE` ↔ `MAINTENANCE`)
- Duplicate active-maintenance prevention
- Search, filters, sorting, pagination
- File attachments
- Statistics KPIs
- RBAC + Swagger
- Next.js UI with TanStack Query
- Unit tests (repository, service, controller)

## Backend

Module path: `apps/backend/src/modules/maintenance/`

| Layer | Path |
|-------|------|
| Schema | `schema/maintenance.schema.ts` |
| DTOs | `dto/` |
| Repository | `repository/maintenance.repository.ts` |
| Service | `service/maintenance.service.ts` |
| Controller | `controller/maintenance.controller.ts` |
| Tests | `tests/*.spec.ts` |

Vehicle status updates use a shared `Vehicle` schema/repository (data layer only — not a full Vehicle Module).

### Reusable service methods (for Trip / Dispatch)

```ts
createMaintenance()
completeMaintenance()
cancelMaintenance()
getVehicleMaintenanceHistory()
getMaintenanceStatistics()
isVehicleInMaintenance()
```

Import `MaintenanceModule` and inject `MaintenanceService`.

### APIs

| Method | Path | Roles |
|--------|------|-------|
| POST | `/api/maintenance` | Admin, Fleet Manager |
| GET | `/api/maintenance` | Admin, Fleet Manager, Safety Officer, Financial Analyst |
| GET | `/api/maintenance/statistics` | same read roles |
| GET | `/api/maintenance/lookups/vehicles` | same read roles |
| GET | `/api/maintenance/:id` | same read roles |
| PATCH | `/api/maintenance/:id` | Admin, Fleet Manager |
| DELETE | `/api/maintenance/:id` | Admin, Fleet Manager |
| PATCH | `/api/maintenance/:id/complete` | Admin, Fleet Manager |
| PATCH | `/api/maintenance/:id/cancel` | Admin, Fleet Manager |
| POST | `/api/maintenance/:id/attachments` | Admin, Fleet Manager |
| GET | `/api/maintenance/vehicle/:vehicleId/history` | read roles |
| GET | `/api/maintenance/vehicle/:vehicleId/in-maintenance` | read roles |

Swagger: `http://localhost:4000/api/docs`

### Business rules

1. Creating active maintenance sets vehicle status to `MAINTENANCE` (In Shop).
2. Completing / cancelling restores `AVAILABLE` unless the vehicle is `RETIRED`.
3. Only one active (`SCHEDULED` / `IN_PROGRESS`) maintenance per vehicle.
4. Costs must be `> 0`.
5. `expectedCompletionDate` ≥ `startDate`.
6. Completed records may only update notes.

### Seed

```bash
yarn workspace @transitops/backend seed
```

Seeds 10 vehicles + 30 maintenance records (mix of preventive, emergency, scheduled, completed).

### Tests

```bash
yarn workspace @transitops/backend test
yarn workspace @transitops/backend test:cov
```

## Frontend

Routes (under protected shell):

- `/maintenance` — list + KPIs
- `/maintenance/new` — create
- `/maintenance/[id]` — details + timeline
- `/maintenance/[id]/edit` — edit

Components: `apps/frontend/src/components/maintenance/`

Hooks: `apps/frontend/src/hooks/use-maintenance.ts`

Service: `apps/frontend/src/services/maintenance.service.ts`

## Notes

- Driver role has no access (OPERATOR / VIEWER not granted maintenance roles).
- Auth JWT guards apply; ensure a valid bearer token for API calls.
- Uploads are stored under `uploads/maintenance/` and served at `/uploads/...`.
