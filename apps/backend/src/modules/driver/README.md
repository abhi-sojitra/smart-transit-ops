# Driver Module

Production-ready Driver Management for TransitOps (NestJS + Next.js).

## Backend

Path: `apps/backend/src/modules/driver`

```
driver/
  controller/     DriverController + Swagger
  service/        DriverService + mapper (Trip-ready helpers)
  repository/     DriverRepository (no mongoose in services)
  dto/            Create / Update / Query / Status / Safety Score
  schema/         Mongo Driver schema (soft delete)
  constants/      Sort fields, limits, enums helpers
  interfaces/     Shared module contracts
  validators/     Future-date + date-after validators
  seeds/          20 demo drivers
  tests/          Unit tests (service, repository, controller)
```

### APIs (`/api/drivers`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/drivers` | Create driver |
| GET | `/drivers` | List (search, filters, sort, pagination) |
| GET | `/drivers/available` | Available + valid license |
| GET | `/drivers/statistics` | Dashboard aggregates |
| GET | `/drivers/:id` | Details |
| PATCH | `/drivers/:id` | Update |
| DELETE | `/drivers/:id` | Soft delete |
| PATCH | `/drivers/:id/status` | Status update |
| PATCH | `/drivers/:id/safety-score` | Safety score 0–100 |

### Reusable service methods (Trip module)

- `getAvailableDrivers()`
- `validateDriverLicense(id)`
- `updateDriverStatus(id, status)`
- `getDriverStatistics()`
- `assertAssignableToTrip(id)`

### Business rules

- Unique: `employeeCode`, `email`, `phone`, `licenseNumber`
- License expiry must be greater than today on create
- Expired license / Suspended → cannot become `AVAILABLE` or be assigned to trips
- Soft-deleted drivers never appear in list/detail queries

### RBAC

| Role | Access |
|------|--------|
| Super Admin / Admin | Full |
| Fleet Manager | CRUD |
| Safety Officer | Read + status + safety score |
| Dispatcher | Read / available / statistics |
| Operator / Viewer | Read detail |

### Seed & tests

```bash
yarn workspace @transitops/backend seed
yarn workspace @transitops/backend test
yarn workspace @transitops/backend test:cov
```

Swagger: `http://localhost:4000/api/docs`

---

## Frontend

Routes (under protected shell):

- `/drivers` — list, filters, statistics, pagination
- `/drivers/new` — create form
- `/drivers/[id]` — detail + status update
- `/drivers/[id]/edit` — edit form

Components: `src/components/drivers/*`  
Hooks: `src/hooks/use-drivers.ts`  
API: `src/services/drivers.ts`  
Types: `src/types/driver.ts`

Stack: TanStack Query, React Hook Form + Zod, Sonner toasts, dark mode via existing theme tokens.
