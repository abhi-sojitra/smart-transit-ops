# Software Requirements Specification (SRS / SRD)

# TransitOps

**Enterprise Fleet & Transport Management System**

---

| Field | Value |
|-------|-------|
| **Document Title** | Software Requirements Specification |
| **Document ID** | TO-SRS-001 |
| **Project Name** | TransitOps |
| **Version** | 1.0.0 |
| **Status** | Released — Reflects Current Implementation |
| **Author** | TransitOps Software Architecture Team |
| **Date** | 12 July 2026 |
| **Audience** | Developers · QA · DevOps · Architects · Hackathon Judges · Client Technical Teams |
| **Companion Document** | `FRD.md` (TO-FRD-001) |
| **Source of Truth** | `apps/frontend`, `apps/backend`, `packages/shared-types` |
| **API Base** | `http://localhost:4000/api` |
| **Swagger** | `http://localhost:4000/api/docs` |
| **Frontend** | `http://localhost:3000` |

---

## Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 0.1.0 | 2026-07-01 | Engineering | Skeleton SRS |
| 0.7.0 | 2026-07-09 | Software Architect | Mapped NestJS modules, schemas, and Next.js routes |
| 1.0.0 | 2026-07-12 | Technical Writer | Full production SRS: field catalogs, endpoint matrices, sequence diagrams, FRD traceability |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [System Overview](#2-system-overview)
3. [Modules (Technical)](#3-modules-technical)
4. [Database Design](#4-database-design)
5. [API Design](#5-api-design)
6. [Business Logic](#6-business-logic)
7. [Frontend Architecture](#7-frontend-architecture)
8. [Backend Architecture](#8-backend-architecture)
9. [Security](#9-security)
10. [Performance](#10-performance)
11. [Testing](#11-testing)
12. [Deployment](#12-deployment)
13. [Coding Standards](#13-coding-standards)
13A. [Extended Technical Annex](#13a-extended-technical-annex-normative)
14. [Future Enhancements](#14-future-enhancements)
15. [Appendix](#15-appendix)

---

# 1. Introduction

## 1.1 Purpose

This Software Requirements Specification (SRS) defines the **technical** requirements, architecture, data model, API contracts, security controls, performance indexes, testing inventory, and implementation conventions of TransitOps **as built in the repository**. It complements the Functional Requirements Document (`FRD.md` / TO-FRD-001) and is intended to enable:

- Correct feature implementation and extension without inventing undocumented behavior
- QA test design against real HTTP contracts, permissions, and validation rules
- Client technical due diligence and architecture review
- Onboarding of maintainers to NestJS 11 / Next.js 15 / MongoDB layers
- Traceability from FRD functional IDs (`US-*`, `AC-*`, `TD-*`, etc.) to technical artifacts

## 1.2 Scope

### 1.2.1 In Scope

| Area | Coverage in this SRS |
|------|----------------------|
| Monorepo | Yarn workspaces: `apps/frontend`, `apps/backend`, `packages/shared-types` |
| Auth & RBAC | JWT access + refresh rotation, bcrypt cost 12, `JwtAuthGuard`, `PermissionsGuard`, permission catalog |
| Domain modules | Fleet (Vehicle), Driver, Trip, Maintenance, Fuel, Expense, Dashboard, Analytics/Reports, Settings/Admin, Notifications preferences, Audit, Health |
| Data model | Every important Mongoose collection field with types, indexes, soft-delete, audit actors |
| REST API | Full endpoint catalogs under global prefix `/api`; Swagger at `/api/docs` |
| Frontend | App Router routes, services, React Query hooks, Zustand auth, permission-filtered nav |
| Backend layering | Controllers → services → repositories → schemas; DTOs; guards; interceptors; filters |
| Cross-cutting | Security threat/control map, index rationale, test file inventory, env vars, coding standards |
| Traceability | Mapping to FRD §§4–8, business rules, user stories, acceptance criteria |

### 1.2.2 Out of Scope (Confirmed Absent from Codebase)

| Item | Status in repo |
|------|----------------|
| Docker / Kubernetes manifests | **Not present** |
| Rate limiting middleware | **Not present** |
| Real-time GPS / WebSocket tracking | **Not present** |
| Notification delivery workers / email/SMS senders | **Not present** (preferences only) |
| Multi-tenant data isolation | **Not present** |
| Public self-registration | **Not present** |
| Frontend automated test suite | **Not present** (`*.test.*` / `*.spec.*` under frontend = 0) |
| Dedicated `@RequirePermissions('EXPENSE:APPROVE')` endpoint | Catalog lists `EXPENSE:APPROVE`; approval is via `PATCH /expenses/:id` with `EXPENSE:UPDATE` setting `status` |
| `ROLES:CREATE` / `PERMISSIONS:UPDATE` HTTP endpoints | Catalog codes exist; no create-role or update-permission controllers |

## 1.3 Audience

| Audience | Primary use of this document |
|----------|------------------------------|
| Backend developers | Module boundaries, schemas, business rules, API contracts, guards |
| Frontend developers | Routes → services → API mapping, hooks, permission gating limits |
| QA engineers | Endpoint matrix, status codes, sample JSON, AC-* mapping to specs |
| DevOps | Env vars, build/run/seed/wipe scripts, ports, absence of containerization |
| Architects / judges | HLD, sequence diagrams, RBAC, index rationale, threat model |

## 1.4 Definitions

| Term | Definition |
|------|------------|
| SRS / SRD | Software Requirements Specification |
| FRD | Functional Requirements Document (`FRD.md`) |
| Access JWT | Short-lived Bearer token (default 15m); payload `{ sub, email, roles }` |
| Refresh JWT | Longer-lived token (default 7d); payload `{ sub, tokenId }`; stored hashed |
| Refresh rotation | Each refresh issues a new pair; previous refresh hash replaced; reuse → revoke |
| Business ID | Human-readable string key (e.g. `VH-1001`, `TR-0001`, `employeeCode`) |
| ObjectId | MongoDB `_id` used as API path param for most CRUD resources |
| Soft delete | `isDeleted=true` + `deletedAt`; excluded from default queries |
| Permission code | `MODULE:ACTION` string, e.g. `TRIP:DISPATCH` |
| RoleCode | Enum stored on JWT and Role documents |
| `ApiResponse` | Envelope `{ success, message, data, meta }` via `ResponseInterceptor` |
| ProtectedShell | Frontend layout gate requiring Zustand `isAuthenticated` |
| OPERATOR scoping | Fuel/Expense list/mutate limited to `createdBy === user.sub` for OPERATOR-only users |

## 1.5 References

| Reference | Location |
|-----------|----------|
| FRD | `/FRD.md` |
| README | `/README.md` |
| Backend bootstrap | `apps/backend/src/main.ts` |
| Env validation | `apps/backend/src/config/env.validation.ts` |
| Permission catalog | `apps/backend/src/modules/rbac/permission.catalog.ts` (or equivalent RBAC catalog path) |
| Shared types | `packages/shared-types` |
| Swagger UI | `/api/docs` |

## 1.6 Document Conventions

- Paths without host imply prefix `/api` unless stated otherwise.
- Permission strings are exact codes enforced by `PermissionsGuard`.
- Field tables use Mongoose/TypeScript types as implemented.
- Sample JSON uses illustrative IDs; shapes match interceptor + DTO contracts.
- Features not found in the codebase are explicitly marked **Out of Scope** rather than speculated.

## 1.7 Compliance Statement

This SRS version **1.0.0** (12 July 2026) is aligned to:

- NestJS **11.x** (`@nestjs/common` ^11.0.12)
- Next.js **15.2.4**
- React **19**
- Mongoose **8.x**
- JWT refresh rotation with SHA-256 stored refresh hash
- bcryptjs cost factor **12**
- Global API prefix **`api`**; Swagger at **`api/docs`**
- Guards: **`JwtAuthGuard` + `PermissionsGuard`** (+ unused `RolesGuard` unless `@Roles` metadata set)

---

# 2. System Overview

## 2.1 Architecture Summary

TransitOps is a **monorepo** fleet operations platform:

```
┌─────────────────────────────────────────────────────────────────┐
│                     Browser (Next.js 15 App Router)              │
│  ProtectedShell · Zustand auth · React Query · Axios apiClient  │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS / JSON  Bearer JWT
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              NestJS 11 API  (:4000)  prefix /api                 │
│  Helmet · Compression · CORS · ValidationPipe · Winston          │
│  JwtAuthGuard · PermissionsGuard · ResponseInterceptor           │
│  Controllers → Services → Repositories → Mongoose                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                    MongoDB (transitops DB)
```

## 2.2 Technology Stack

| Layer | Technology | Version / notes |
|-------|------------|-----------------|
| Package manager | Yarn workspaces | Root `engines.node >= 20` |
| Frontend framework | Next.js | 15.2.4 (App Router) |
| UI | React 19, Tailwind, Radix, Framer Motion | — |
| Data fetching | TanStack React Query 5 | staleTime 30s |
| Auth client state | Zustand + persist | key `transitops-auth` |
| Forms | react-hook-form + Zod | — |
| Backend framework | NestJS | 11.x |
| ODM | Mongoose via `@nestjs/mongoose` | 8.x |
| Auth | Passport JWT, `@nestjs/jwt` | Access + refresh |
| Password hashing | bcryptjs | **cost 12** |
| Validation | class-validator / class-transformer | whitelist + forbidNonWhitelisted |
| API docs | `@nestjs/swagger` | `/api/docs` |
| Logging | nest-winston / Winston | — |
| Security headers | helmet | enabled in `main.ts` |
| Compression | compression | enabled |
| Shared contracts | `@transitops/shared-types` | enums, DTOs-as-types, ApiResponse |
| Tests | Jest (backend only) | 32 `*.spec.ts` files |

## 2.3 Detailed Monorepo Folder Tree

```
smart-transit-ops/
├── package.json                 # workspaces, concurrent dev
├── FRD.md
├── SRS.md                       # this document
├── README.md
├── packages/
│   └── shared-types/
│       ├── package.json
│       └── src/
│           ├── index.ts
│           ├── api.ts           # ApiResponse, PaginationMeta
│           ├── auth.ts          # RoleCode, JwtPayload, AuthTokens
│           ├── status.ts        # Vehicle/Driver/Trip/Maintenance/Expense statuses
│           ├── domain.ts
│           ├── driver.ts
│           ├── vehicle.ts
│           ├── fuel-expense.ts
│           ├── dashboard.ts
│           └── settings.ts
├── apps/
│   ├── backend/
│   │   ├── package.json
│   │   ├── .env.example
│   │   ├── jest.config.ts
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── health.controller.ts
│   │   │   ├── common/
│   │   │   │   ├── guards/          # jwt, permissions, roles
│   │   │   │   ├── filters/         # AllExceptionsFilter
│   │   │   │   ├── interceptors/    # ResponseInterceptor
│   │   │   │   ├── decorators/
│   │   │   │   └── mixins/          # SoftDeleteFields (defined, unused by schemas)
│   │   │   ├── config/
│   │   │   ├── database/
│   │   │   │   └── seeds/           # run-seed, fuel-expense, wipe-db
│   │   │   ├── schemas/             # shared schema re-exports + fuel/expense/user/...
│   │   │   └── modules/
│   │   │       ├── auth/
│   │   │       ├── users/
│   │   │       ├── roles/
│   │   │       ├── permissions/
│   │   │       ├── rbac/            # global guards + Role repo
│   │   │       ├── settings/        # company, profile, security
│   │   │       ├── audit/
│   │   │       ├── notifications/
│   │   │       ├── fleet/           # Vehicle controller (primary)
│   │   │       ├── vehicle/         # schema re-export for Maintenance
│   │   │       ├── driver/
│   │   │       ├── trip/
│   │   │       ├── maintenance/
│   │   │       ├── fuel/
│   │   │       ├── expense/
│   │   │       ├── integration/     # ReferenceValidation, CostCalculation
│   │   │       ├── dashboard/
│   │   │       └── analytics/
│   │   └── uploads/                 # static assets served at /uploads
│   └── frontend/
│       ├── package.json
│       └── src/
│           ├── app/                 # App Router (public + protected)
│           ├── components/
│           ├── hooks/
│           ├── services/
│           ├── store/
│           ├── providers/
│           ├── constants/
│           ├── utils/
│           ├── types/
│           └── lib/
```

## 2.4 High-Level Design (HLD)

| Concern | Design choice | Rationale |
|---------|---------------|-----------|
| SPA + API | Separate Next.js and NestJS apps | Clear BFF-less REST boundary; Swagger for contracts |
| Auth | Stateless access JWT + server-stored refresh hash | Short exposure window + rotation/reuse detection |
| Authorization | Permission strings on roles, not per-route role lists | Fine-grained `MODULE:ACTION`; SUPER_ADMIN `*` |
| Identity refs | Mixed ObjectId vs business string IDs | Trip/Maintenance need relational integrity; Fuel/Expense denormalize operational IDs |
| Soft delete | Flag-based | Preserve audit history; unique indexes still apply carefully |
| Read models | Dashboard/Analytics aggregate across collections | No separate OLAP store in current scope |

## 2.5 Deployment Topology (As Implemented)

```
Developer machine / single host
├── Next.js  :3000   (yarn workspace @transitops/frontend dev)
├── NestJS   :4000   (yarn workspace @transitops/backend start:dev)
└── MongoDB  :27017  (MONGODB_URI → transitops)

No Docker Compose, no K8s manifests, no reverse-proxy config in repo.
Production checklist is documented in §12; containerization is Future Work.
```

## 2.6 Component Diagram (Logical)

| Component | Responsibility |
|-----------|----------------|
| `ProtectedShell` | Redirect unauthenticated users to `/login` after Zustand rehydrate |
| `apiClient` | Axios instance; attach Bearer; 401 → single-flight refresh |
| `authHttp` | Bare Axios for refresh (no interceptors; avoids loops) |
| Domain services (FE) | `fleetApi`, `tripService`, `fuelService`, `adminService`, … |
| Nest controllers | HTTP + Swagger + `@RequirePermissions` |
| Nest services | Business rules, status sync, cost computation |
| Repositories | Mongoose queries with `isDeleted: false` filters |
| `IntegrationModule` | Cross-entity reference validation & cost helpers for Fuel/Expense |
| `RbacModule` | Global `PermissionsGuard` / Role repository |

## 2.7 Module Dependency Notes (Backend)

| Module | Imports / depends on | Exports / provides |
|--------|----------------------|--------------------|
| `AppModule` | Config, Logger, Database, Rbac, Auth, Users, Roles, Permissions, Settings, Audit, Notifications, Driver, Fleet, Fuel, Expense, Vehicle, Maintenance, Trip, Dashboard, Analytics | `HealthController` |
| `DatabaseModule` | `MONGODB_URI` | Mongoose root connection |
| `RbacModule` | Role schema | **Global** RoleRepository, PermissionsGuard, RolesGuard |
| `AuthModule` | User, Role, Passport, Jwt | AuthController/Service |
| `UsersModule` | User, Role, AuditLog | Users CRUD + role assignment |
| `RolesModule` | Role, User, AuditLog | Role update/clone/assign (no create endpoint) |
| `PermissionsModule` | Permission, Role | List/grouped/matrix (read-only) |
| `SettingsModule` | AppSettings, User, Role, Permission, AuditLog | Company, appearance, profile, security |
| `NotificationsModule` | SettingsModule | Preference GET/PATCH only |
| `AuditModule` | AuditLog | List + CSV export |
| `FleetModule` | Vehicle schema | VehicleController + service/repo |
| `VehicleModule` | Fleet vehicle schema re-export | Used by Maintenance (no HTTP controller) |
| `DriverModule` | Driver schema | DriverController + exports |
| `MaintenanceModule` | VehicleModule + Maintenance schema | Maintenance lifecycle + attachments |
| `TripModule` | Trip + FleetModule + DriverModule + MaintenanceModule | Dispatch/start/complete/cancel |
| `FuelModule` | Fuel + IntegrationModule | Fuel CRUD + stats |
| `ExpenseModule` | Expense, Fuel + IntegrationModule | Expense CRUD + stats |
| `IntegrationModule` | Vehicle, Driver, Trip, Maintenance, Fuel, Expense | ReferenceValidation, CostCalculation |
| `DashboardModule` | Vehicle, Driver, Trip, Maintenance, Fuel, Expense | Overview aggregates + report export |
| `AnalyticsModule` | DashboardModule | Charts/summary/reports |

**Circular-risk note:** Trip depends on Maintenance (dispatch validation for in-maintenance vehicles). Integration is not registered directly on `AppModule`; it is pulled in via Fuel/Expense.

## 2.8 Database ER (Logical)

```
users ──< roles (ObjectId[])     roles.permissions: string[]
users.refreshTokenHash           permissions (catalog docs)
audit_logs.actorId → users
app_settings (singleton key=default)

vehicles (_id, vehicleId business)
drivers  (_id, employeeCode business)

trips.vehicleId  → vehicles._id (ObjectId)
trips.driverId   → drivers._id  (ObjectId)

maintenance.vehicleId → vehicles._id (ObjectId)

fuel_logs.vehicleId  = vehicles.vehicleId (STRING)
fuel_logs.driverId   = drivers.employeeCode (STRING, optional)
fuel_logs.tripId     = trips.tripNumber (STRING, optional)

expenses.vehicleId / driverId / tripId  = same STRING pattern as fuel
```

## 2.9 API Architecture Conventions

| Convention | Implementation |
|------------|----------------|
| Global prefix | `app.setGlobalPrefix('api')` |
| Auth header | `Authorization: Bearer <accessToken>` |
| Success envelope | `{ success: true, message: 'OK', data, meta }` |
| Pagination meta | Typically `{ page, limit, total, totalPages }` inside `meta` or nested `data` per service |
| Validation | Global `ValidationPipe`: whitelist, forbidNonWhitelisted, transform |
| Errors | `AllExceptionsFilter` → structured error payload |
| Docs | Swagger Bearer auth; version string in DocumentBuilder `0.1.0` |
| Static files | `/uploads` from `process.cwd()/uploads` |
| File downloads | Dashboard/Analytics/Audit export may bypass envelope via `@Res()` |

## 2.10 Authentication Flow (Overview)

1. `POST /api/auth/login` with email + password (≥8) → verify ACTIVE user → bcrypt.compare → issue access + refresh → store SHA-256(refresh) on user.
2. Client stores both tokens in Zustand persist.
3. API calls send access JWT; `JwtStrategy` validates `JWT_SECRET`.
4. On 401, frontend refreshes via `POST /api/auth/refresh` using `authHttp`.
5. Refresh verifies JWT + timing-safe hash compare; mismatch clears hash (reuse detection); success rotates tokens.
6. `POST /api/auth/logout` (JWT required) unsets `refreshTokenHash`.

See §6 ASCII sequence for refresh detail.

## 2.11 RBAC Flow (Overview)

1. Endpoint decorated with `@RequirePermissions('TRIP:DISPATCH')` (example).
2. `PermissionsGuard` loads Role documents for JWT `roles: RoleCode[]`.
3. Unions permission string arrays; if any role has `*`, allow.
4. Default mode **any** (OR); optional **all** via permission mode metadata.
5. Attaches effective `user.permissions` for downstream use.
6. Frontend filters **sidebar nav only** via `filterNavByPermissions`; pages are **not** individually RBAC-gated (auth-only via ProtectedShell).

---

# 3. Modules (Technical)

## 3.0 Authentication Module

| Aspect | Detail |
|--------|--------|
| FRD trace | FRD §4.1, US-AUTH-01…04, AC-AUTH-01…04 |
| Controller | `AuthController` |
| Paths | `/api/auth/login`, `/refresh`, `/logout` |
| Guards | Login/refresh public; logout requires `JwtAuthGuard` only (no permission code) |
| Password | bcryptjs cost **12** |
| Lockout fields | `failedLoginAttempts`, `lockedUntil` exist on User; **login does not enforce lockout** in current service logic (FRD notes same) |

### 3.0.1 Token Issuance Fields

| Token | Secret env | Expiry env | Default | Payload |
|-------|------------|------------|---------|---------|
| Access | `JWT_SECRET` | `JWT_EXPIRES_IN` | `15m` | `sub`, `email`, `roles` |
| Refresh | `JWT_REFRESH_SECRET` | `JWT_REFRESH_EXPIRES_IN` | `7d` | `sub`, `tokenId` (UUID) |

Refresh persistence: `SHA-256` hex of refresh JWT in `users.refreshTokenHash` (not bcrypt — avoids 72-byte truncation breaking reuse detection).

## 3.1 Vehicle (Fleet) Module

| Aspect | Detail |
|--------|--------|
| FRD | §4.3, VR-01…08, US-VEH-*, AC-VEH-* |
| Permission family | `VEHICLE:VIEW\|CREATE\|UPDATE\|DELETE` |
| Collection | `vehicles` |
| ID in paths | Mongo ObjectId |
| Business key | `vehicleId` (unique, uppercase) |

**Endpoints:** see §5.7.1.

**Key rules:** unique `vehicleId` / `registrationNumber` / sparse `vin`; soft delete; status/mileage patches; list filters + text search; statistics & available listing.

## 3.2 Driver Module

| Aspect | Detail |
|--------|--------|
| FRD | §4.4, DV-01…06 |
| Permissions | `DRIVER:VIEW\|CREATE\|UPDATE\|DELETE` |
| Collection | `drivers` |
| Business key | `employeeCode` |
| Extra patches | `status`, `safetyScore` (0–100) |

## 3.3 Trip Module

| Aspect | Detail |
|--------|--------|
| FRD | §4.5, TD-01…14 |
| Permissions | `TRIP:VIEW\|CREATE\|UPDATE\|DELETE\|DISPATCH\|COMPLETE\|CANCEL` |
| Collection | `trips` |
| Refs | `vehicleId`, `driverId` as **ObjectIds** |
| Number | Auto `TR-####` |
| Lifecycle | DRAFT → DISPATCHED → IN_PROGRESS → COMPLETED \| CANCELLED |

Dispatch sets vehicle & driver to `ON_TRIP`. Complete/cancel (when active) restores `AVAILABLE`.

## 3.4 Maintenance Module

| Aspect | Detail |
|--------|--------|
| FRD | §4.6, MN-01…06 |
| Permissions | `MAINTENANCE:VIEW\|CREATE\|UPDATE\|DELETE\|COMPLETE` |
| Collection | `maintenance` |
| Number | `MNT-YYYY-####` |
| Attachments | multipart, max 10 files, 10MB, images/PDF |
| Vehicle ref | ObjectId |

Start/in-progress aligns vehicle to `MAINTENANCE`; complete restores availability per service rules.

## 3.5 Fuel Module

| Aspect | Detail |
|--------|--------|
| FRD | §4.7, FL-01…04 |
| Permissions | `FUEL:VIEW\|CREATE\|UPDATE\|DELETE` |
| Collection | `fuel_logs` |
| Refs | **Business string IDs** (`vehicleId`, optional `tripId`/`driverId`) |
| Cost | `pre('save')` → `totalCost = round(quantity * pricePerLiter, 2)` |
| Scoping | OPERATOR limited to own `createdBy` |

## 3.6 Expense Module

| Aspect | Detail |
|--------|--------|
| FRD | §4.8, EX-01…05 |
| Permissions | `EXPENSE:VIEW\|CREATE\|UPDATE\|DELETE` (+ catalog `APPROVE` unused on controllers) |
| Collection | `expenses` |
| Approval | `PATCH` with `status: APPROVED\|REJECTED` and optional `approvedBy` |
| Default status | `PENDING` |
| Cost rollups | Approved expenses participate in operational cost helpers |

## 3.7 Dashboard Module

| Aspect | Detail |
|--------|--------|
| FRD | §4.2, DB-01…03 |
| Permission | `DASHBOARD:VIEW`; export `REPORTS:EXPORT` |
| Aggregates | overview, activity, charts, alerts, leaders, upcoming maintenance, recent trips, business-summary |

## 3.8 Reports / Analytics Module

| Aspect | Detail |
|--------|--------|
| FRD | §4.9, RP-01…03 |
| Permissions | `REPORTS:VIEW`, `REPORTS:EXPORT` |
| Charts | `months` query 3–24 (default 6) |
| Reports | `period`: daily \| weekly \| monthly; export csv \| pdf |

## 3.9 Settings & Related Modules

| Subsystem | Paths | Permissions |
|-----------|-------|-------------|
| Company | `/settings/company` | `SETTINGS:VIEW\|UPDATE` |
| Appearance | `/settings/appearance` | `PROFILE:VIEW\|UPDATE` |
| Statistics | `/settings/statistics` | `SETTINGS:VIEW` |
| Profile | `/profile`, `/profile/password` | `PROFILE:VIEW\|UPDATE` |
| Security | `/security` | `SETTINGS:VIEW\|UPDATE` |
| Users | `/users` | `USERS:*` |
| Roles | `/roles` | `ROLES:VIEW\|UPDATE\|DELETE` |
| Permissions | `/permissions` | `PERMISSIONS:VIEW` |
| Notifications prefs | `/notifications/settings` | `NOTIFICATIONS:VIEW\|UPDATE` |
| Audit | `/audit`, `/audit/export` | `AUDIT:VIEW\|EXPORT` |
| Health | `/health` | public |

---

# 4. Database Design

## 4.1 Collection Inventory

| Collection | Schema class | Soft delete | Primary consumers |
|------------|--------------|-------------|-------------------|
| `users` | User | yes | Auth, Users, Settings |
| `roles` | Role | no | Auth, RBAC, Roles |
| `permissions` | Permission | no | Permissions, Settings |
| `audit_logs` | AuditLog | n/a (append-only) | Audit, admin mutations |
| `app_settings` | AppSettings | no | Settings, Notifications |
| `vehicles` | Vehicle | yes | Fleet, Trip, Maintenance, Dashboard |
| `drivers` | Driver | yes | Driver, Trip, Dashboard |
| `trips` | Trip | yes | Trip, Dashboard, Integration |
| `maintenance` | Maintenance | yes | Maintenance, Trip validation, Dashboard |
| `fuel_logs` | Fuel | yes | Fuel, Expense, Dashboard |
| `expenses` | Expense | yes | Expense, Dashboard |

## 4.2 Complete Field Catalogs

### 4.2.1 `users`

| Field | Type | Required | Default / constraints |
|-------|------|----------|----------------------|
| email | String | yes | unique, lowercase, trim |
| passwordHash | String | yes | bcrypt hash |
| firstName | String | yes | trim |
| lastName | String | yes | trim |
| phone | String | no | trim |
| avatarUrl | String | no | trim |
| roles | ObjectId[] → Role | — | default `[]` |
| status | enum `ACTIVE\|INACTIVE` | — | default `ACTIVE`, indexed |
| lastLoginAt | Date | no | set on successful login |
| failedLoginAttempts | Number | no | present; not incremented by current login failure path |
| lockedUntil | Date | no | cleared on login success |
| refreshTokenHash | String | no | SHA-256 hex of refresh JWT |
| isDeleted | Boolean | — | default false, indexed |
| deletedAt | Date | no | — |
| createdAt / updatedAt | Date | auto | timestamps: true |

**Indexes:** `{ email: 1, isDeleted: 1 }`, `{ status: 1, isDeleted: 1 }`, field indexes on `status`, `isDeleted`.

### 4.2.2 `roles`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| code | enum RoleCode | yes | unique |
| name | String | yes | trim |
| description | String | no | — |
| permissions | String[] | — | default `[]`; may include `*` |
| isSystem | Boolean | — | default true; system roles not deletable |
| createdAt / updatedAt | Date | auto | — |

**RoleCode values:** `SUPER_ADMIN`, `ADMIN`, `FLEET_MANAGER`, `DISPATCHER`, `SAFETY_OFFICER`, `FINANCIAL_ANALYST`, `OPERATOR`, `VIEWER`.

### 4.2.3 `permissions`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| code | String | yes | unique, uppercase (e.g. `VEHICLE:VIEW`) |
| module | String | yes | indexed |
| action | String | yes | — |
| description | String | yes | — |
| group | String | yes | indexed |

**Index:** `{ module: 1, action: 1 }`.

### 4.2.4 `audit_logs`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| action | AuditAction | yes | indexed |
| module | AuditModule | yes | indexed |
| entityType | String | no | — |
| entityId | String | no | — |
| summary | String | yes | — |
| actorId | ObjectId → User | no | indexed |
| actorEmail / actorName | String | no | denormalized |
| ip / userAgent / browser / device | String | no | — |
| metadata | Object | no | — |
| createdAt | Date | auto | updatedAt disabled |

**Indexes:** `{ createdAt: -1 }`, `{ module: 1, action: 1, createdAt: -1 }`.

**AuditAction:** `LOGIN`, `LOGOUT`, `LOGIN_FAILED`, `CREATE`, `UPDATE`, `DELETE`, `STATUS_CHANGE`, `ROLE_CHANGE`, `PERMISSION_CHANGE`, `PASSWORD_CHANGE`, `SETTINGS_UPDATE`.

**AuditModule:** `AUTH`, `USERS`, `ROLES`, `PERMISSIONS`, `SETTINGS`, `PROFILE`, `SECURITY`, `NOTIFICATIONS`, `SYSTEM`.

### 4.2.5 `app_settings`

| Field | Type | Notes |
|-------|------|-------|
| key | String | unique; typically `'default'` |
| company | embedded | name, logo, contact, country, currency, timezone, dateFormat, language |
| notifications | embedded | channel flags + event flags |
| security | embedded | password policy, session timeout, lock settings, twoFactorReady |
| appearance | embedded | theme `light\|dark\|system`, sidebarCollapsed, compactTables |

**Security defaults (schema):** `minPasswordLength=8`, uppercase/number/special required true, `sessionTimeoutMinutes=60`, `maxLoginAttempts=5`, `lockDurationMinutes=30`, `twoFactorReady=true`.

### 4.2.6 `vehicles`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| vehicleId | String | yes | unique, uppercase — **business ID** |
| registrationNumber | String | yes | unique, uppercase |
| vin | String | no | unique sparse, uppercase |
| make | String | yes | — |
| model | String | yes | indexed |
| year | Number | no | 1980–2100 |
| vehicleType | VehicleType | yes | indexed |
| fuelType | FuelType | yes | — |
| color | String | no | — |
| seatingCapacity | Number | no | min 1 |
| maxCapacity | Number | yes | 1–500 (kg) |
| mileage | Number | yes | default 0, min 0 |
| purchaseDate | Date | no | — |
| registrationExpiryDate | Date | yes | indexed |
| insuranceExpiryDate | Date | yes | indexed |
| fitnessCertificateExpiryDate | Date | yes | indexed |
| lastServiceDate | Date | no | — |
| nextServiceDueDate | Date | no | indexed |
| depotCity / depotState | String | no | indexed |
| country | String | no | default `'India'` |
| photo | String | no | — |
| documents | VehicleDocumentFile[] | — | name, url required |
| status | VehicleStatus | yes | default AVAILABLE, indexed |
| remarks | String | no | — |
| isDeleted | Boolean | — | default false, indexed |
| createdBy / updatedBy / deletedBy | **String** | no | actor ids as strings |
| deletedAt | Date | no | — |
| createdAt / updatedAt | Date | auto | — |

**VehicleType:** `BUS`, `MINIBUS`, `TRUCK`, `VAN`, `SEDAN`, `SUV`, `OTHER`.

**VehicleStatus:** `AVAILABLE`, `ON_TRIP`, `MAINTENANCE`, `RETIRED`, `ACTIVE`, `IN_SERVICE`.

**Compound/text indexes:** `{ isDeleted: 1, status: 1 }`, `{ isDeleted: 1, make: 1, model: 1 }`, `{ isDeleted: 1, nextServiceDueDate: 1 }`, text `vehicle_search_text` on vehicleId, registrationNumber, make, model, vin.

### 4.2.7 `drivers`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| employeeCode | String | yes | unique, uppercase — **business ID** |
| firstName / lastName | String | yes | — |
| fullName | String | yes | indexed; set in pre-validate |
| email | String | yes | unique, lowercase |
| phone | String | yes | unique |
| alternatePhone | String | no | — |
| dateOfBirth | Date | no | — |
| joiningDate | Date | yes | — |
| licenseNumber | String | yes | unique, uppercase |
| licenseCategory | LicenseCategory | yes | — |
| licenseIssueDate | Date | no | — |
| licenseExpiryDate | Date | yes | indexed |
| experienceYears | Number | yes | default 0 |
| address / city / state / postalCode | String | no | city/state indexed |
| country | String | no | default `'India'` |
| emergencyName / emergencyPhone | String | no | — |
| bloodGroup | BloodGroup | no | default UNKNOWN |
| photo | String | no | — |
| documents | DriverDocumentFile[] | — | — |
| status | DriverStatus | yes | default AVAILABLE, indexed |
| safetyScore | Number | yes | default 100, 0–100 |
| remarks | String | no | — |
| isDeleted | Boolean | — | default false |
| createdBy / updatedBy / deletedBy | String | no | — |
| deletedAt | Date | no | — |

**LicenseCategory:** `LMV`, `HMV`, `CDL_A`, `CDL_B`, `CDL_C`, `MCWG`, `OTHER`.

**BloodGroup:** `A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`, `UNKNOWN`.

**DriverStatus:** `AVAILABLE`, `ON_TRIP`, `SUSPENDED`, `OFF_DUTY`.

**Indexes:** `{ isDeleted: 1, status: 1 }`, `{ isDeleted: 1, fullName: 1 }`, `{ isDeleted: 1, licenseExpiryDate: 1 }`, text `driver_search_text`.

### 4.2.8 `trips`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| tripNumber | String | yes | unique, indexed; auto `TR-####` |
| source / destination | String | yes | — |
| vehicleId | ObjectId → Vehicle | yes | indexed — **not** business string |
| driverId | ObjectId → Driver | yes | indexed |
| cargoName | String | yes | — |
| cargoWeight | Number | yes | min 0 |
| cargoType | CargoType | — | default GENERAL |
| plannedDistance | Number | yes | min 0 |
| actualDistance | Number | no | set on complete |
| plannedStartDate / plannedEndDate | Date | yes | — |
| actualStartDate / actualEndDate | Date | no | — |
| fuelConsumed | Number | no | — |
| estimatedRevenue | Number | yes | min 0 |
| actualRevenue | Number | no | — |
| notes | String | no | — |
| status | TripStatus | — | default DRAFT, indexed |
| tripDocuments | TripDocumentMeta[] | — | name, url |
| createdBy / updatedBy / deletedBy | ObjectId → User | no | — |
| isDeleted | Boolean | — | default false |
| deletedAt | Date | no | — |

**TripStatus:** `DRAFT`, `DISPATCHED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`.

**CargoType:** `GENERAL`, `FRAGILE`, `HAZARDOUS`, `PERISHABLE`, `BULK`, `OTHER`.

**Indexes:** text on source/destination/tripNumber/cargoName; `{ status: 1, plannedStartDate: -1 }`; `{ vehicleId: 1, status: 1, isDeleted: 1 }`; `{ driverId: 1, status: 1, isDeleted: 1 }`.

### 4.2.9 `maintenance`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| vehicleId | ObjectId → Vehicle | yes | indexed |
| maintenanceNumber | String | yes | unique uppercase `MNT-YYYY-####` |
| maintenanceType | MaintenanceType | yes | — |
| title | String | yes | max 100 |
| description | String | no | max 500 |
| priority | MaintenancePriority | — | default MEDIUM |
| status | MaintenanceStatus | — | default SCHEDULED, indexed |
| startDate / expectedCompletionDate | Date | yes | — |
| completedDate | Date | no | — |
| estimatedCost | Number | yes | min 0.01 |
| actualCost | Number | no | min 0 |
| vendorName / vendorPhone / serviceCenter | String | no | — |
| odometerReading | Number | no | min 0 |
| nextServiceDue | Date | no | — |
| attachments | embedded[] | — | filename, originalName, mimeType, size, url |
| notes | String | no | max 500 |
| createdBy / updatedBy / deletedBy | String | no | — |
| isDeleted | Boolean | — | default false |
| deletedAt | Date | no | — |

**MaintenanceType:** `PREVENTIVE`, `CORRECTIVE`, `EMERGENCY`, `OIL_CHANGE`, `TYRE_REPLACEMENT`, `ENGINE_REPAIR`, `BRAKE_SERVICE`, `BATTERY_REPLACEMENT`, `INSPECTION`.

**MaintenancePriority:** `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.

**MaintenanceStatus:** `SCHEDULED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`.

**Indexes:** `{ vehicleId: 1, status: 1, isDeleted: 1 }`, `{ status: 1, isDeleted: 1 }`, priority, type, startDate, expectedCompletionDate, text search fields.

### 4.2.10 `fuel_logs`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| vehicleId | String | yes | **business** vehicleId |
| tripId | String | no | tripNumber |
| driverId | String | no | employeeCode |
| fuelStation | String | yes | — |
| fuelType | FuelType | yes | — |
| quantity | Number | yes | min 0.01 |
| pricePerLiter | Number | yes | min 0.01 |
| totalCost | Number | yes | recomputed on save |
| odometerReading | Number | no | min 0 |
| filledAt | Date | yes | — |
| receiptImage / notes | String | no | — |
| createdBy / updatedBy / deletedBy | ObjectId → User | no | — |
| deletedAt | Date | no | — |
| isDeleted | Boolean | — | default false |

**FuelType:** `DIESEL`, `PETROL`, `CNG`, `ELECTRIC`, `HYBRID`, `OTHER`.

**Indexes:** `{ vehicleId: 1, filledAt: -1 }`, `{ tripId: 1 }`, `{ driverId: 1 }`, `{ isDeleted: 1, filledAt: -1 }`.

### 4.2.11 `expenses`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| vehicleId | String | yes | business id |
| tripId / driverId | String | no | business ids |
| expenseType | ExpenseType | yes | — |
| title | String | yes | — |
| description | String | no | — |
| amount | Number | yes | min 0.01 |
| expenseDate | Date | yes | — |
| receiptImage | String | no | — |
| approvedBy | String | no | — |
| status | ExpenseStatus | — | default PENDING |
| notes | String | no | — |
| createdBy / updatedBy / deletedBy | ObjectId → User | no | — |
| deletedAt / isDeleted | Date / Boolean | — | soft delete |

**ExpenseType:** `TOLL`, `PARKING`, `REPAIR`, `MAINTENANCE`, `INSURANCE`, `CLEANING`, `TAX`, `PERMIT`, `FINE`, `OTHER`.

**ExpenseStatus:** `PENDING`, `APPROVED`, `REJECTED`.

**Indexes:** `{ vehicleId: 1, expenseDate: -1 }`, tripId, driverId, status, `{ isDeleted: 1, expenseDate: -1 }`.

## 4.3 Relationships & ID Strategy

| From | Field | Stores | Resolves to |
|------|-------|--------|-------------|
| Trip | vehicleId / driverId | ObjectId | vehicles._id / drivers._id |
| Maintenance | vehicleId | ObjectId | vehicles._id |
| Fuel / Expense | vehicleId | String | vehicles.vehicleId |
| Fuel / Expense | driverId | String | drivers.employeeCode |
| Fuel / Expense | tripId | String | trips.tripNumber |
| User | roles | ObjectId[] | roles._id |
| JWT | roles | RoleCode strings | Role.code |

**Implication:** Cross-module aggregations that join Fuel (string vehicleId) to Maintenance (ObjectId vehicleId) must resolve via Vehicle document; naive string==ObjectId joins are incorrect.

## 4.4 Soft Delete Pattern

| Entity | Flags | Actor fields |
|--------|-------|--------------|
| User, Vehicle, Driver, Trip, Maintenance, Fuel, Expense | `isDeleted`, `deletedAt` | Vehicle/Driver/Maintenance: string actors; Trip/Fuel/Expense: ObjectId actors (User) where present |
| Role, Permission, AppSettings | hard constraints / no soft delete | Role `isSystem` protects delete |

Repositories filter `isDeleted: false` on reads. Soft-deleted records remain for audit.

## 4.5 Constraints Summary

| Constraint | Enforcement |
|------------|-------------|
| Unique business keys | Mongo unique indexes |
| Enum domains | Mongoose enum + class-validator DTOs |
| Capacity / cargo weight | Trip validators at create/dispatch |
| One active trip per vehicle/driver | `hasActiveTripFor*` checks |
| No dispatch while vehicle in maintenance | TripModule → MaintenanceModule |
| Fuel totalCost | Schema pre-save hook |
| Password min length on login DTO | class-validator min 8 |

---

# 5. API Design

## 5.1 Conventions

| Item | Value |
|------|-------|
| Base URL | `{HOST}/api` |
| Content-Type | `application/json` (multipart for maintenance attachments) |
| Auth | Bearer access JWT except login, refresh, health |
| Success | `ApiResponse` envelope |
| Validation failure | 400 with field errors |
| Unauthorized | 401 |
| Forbidden (missing permission) | 403 |
| Not found | 404 |

## 5.2 Sample JSON — Authentication

### Login request

```http
POST /api/auth/login
Content-Type: application/json
```

```json
{
  "email": "admin@transitops.com",
  "password": "Admin@12345"
}
```

### Login response (shape)

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "15m"
  },
  "meta": {}
}
```

### Refresh request

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Refresh response

Same token pair shape as login; prior refresh hash replaced (rotation).

### Logout

```http
POST /api/auth/logout
Authorization: Bearer <accessToken>
```

Clears `refreshTokenHash`; response envelope with success flag.

## 5.3 Sample JSON — Trip Dispatch

```http
PATCH /api/trips/665f0c2a1a2b3c4d5e6f7081/dispatch
Authorization: Bearer <accessToken>
```

No body. Preconditions: trip status in dispatchable set (typically `DRAFT`); vehicle/driver available; capacity OK; no overlapping active trips; vehicle not in active maintenance.

### Response (illustrative)

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "_id": "665f0c2a1a2b3c4d5e6f7081",
    "tripNumber": "TR-0042",
    "status": "DISPATCHED",
    "vehicleId": "665f0c2a1a2b3c4d5e6f7001",
    "driverId": "665f0c2a1a2b3c4d5e6f7002",
    "source": "Mumbai",
    "destination": "Pune",
    "cargoWeight": 1200
  },
  "meta": {}
}
```

Side effects: vehicle.status → `ON_TRIP`; driver.status → `ON_TRIP`.

## 5.4 Sample JSON — Fuel Create

```http
POST /api/fuel
Authorization: Bearer <accessToken>
Content-Type: application/json
```

```json
{
  "vehicleId": "VH-1001",
  "tripId": "TR-0042",
  "driverId": "EMP-1001",
  "fuelStation": "IOCL Andheri",
  "fuelType": "DIESEL",
  "quantity": 40.5,
  "pricePerLiter": 92.1,
  "odometerReading": 48210,
  "filledAt": "2026-07-12T10:30:00.000Z",
  "notes": "Full tank"
}
```

### Response (illustrative)

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "_id": "665f0c2a1a2b3c4d5e6f80aa",
    "vehicleId": "VH-1001",
    "quantity": 40.5,
    "pricePerLiter": 92.1,
    "totalCost": 3730.05,
    "fuelType": "DIESEL",
    "isDeleted": false
  },
  "meta": {}
}
```

Note: `totalCost` is server-computed (`round(40.5 * 92.1, 2)`).

## 5.5 Sample JSON — Expense Approve

Approval is performed by updating status (requires `EXPENSE:UPDATE`), not a dedicated approve route:

```http
PATCH /api/expenses/665f0c2a1a2b3c4d5e6f90bb
Authorization: Bearer <accessToken>
Content-Type: application/json
```

```json
{
  "status": "APPROVED",
  "approvedBy": "admin@transitops.com",
  "notes": "Receipt verified"
}
```

### Response (illustrative)

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "_id": "665f0c2a1a2b3c4d5e6f90bb",
    "title": "Toll — Mumbai Entry",
    "amount": 350,
    "status": "APPROVED",
    "approvedBy": "admin@transitops.com",
    "expenseType": "TOLL",
    "vehicleId": "VH-1001"
  },
  "meta": {}
}
```

## 5.6 Authorization Summary

| Guard | When |
|-------|------|
| None | `/health`, `/auth/login`, `/auth/refresh` |
| JwtAuthGuard only | `/auth/logout` |
| JwtAuthGuard + PermissionsGuard (+ RolesGuard shell) | All other module controllers |

`RolesGuard` is registered but inactive unless `@Roles(...)` metadata is present (currently unused on endpoints).

## 5.7 Full Endpoint Catalog

### 5.7.1 Health

| Method | Path | Permission | Body | Response notes |
|--------|------|------------|------|----------------|
| GET | `/api/health` | public | — | `{ status: 'ok', service: 'transitops-api', timestamp }` |

### 5.7.2 Auth

| Method | Path | Permission | Request fields | Response notes |
|--------|------|------------|----------------|----------------|
| POST | `/api/auth/login` | public | email, password (≥8) | accessToken, refreshToken, expiresIn |
| POST | `/api/auth/refresh` | public | refreshToken (≥20) | rotated tokens |
| POST | `/api/auth/logout` | JWT | — | clears refresh hash |

### 5.7.3 Vehicles `/api/vehicles`

| Method | Path | Permission | Request / query | Notes |
|--------|------|------------|-----------------|-------|
| POST | `/vehicles` | VEHICLE:CREATE | CreateVehicleDto | creates vehicle |
| GET | `/vehicles` | VEHICLE:VIEW | page, limit, search, status, vehicleType, fuelType, depotCity/State, yearMin/Max, mileageMin/Max, sortBy, sortOrder | paginated |
| GET | `/vehicles/available` | VEHICLE:VIEW | — | assignable vehicles |
| GET | `/vehicles/statistics` | VEHICLE:VIEW | — | counts by status/type |
| GET | `/vehicles/:id` | VEHICLE:VIEW | ObjectId | detail |
| PATCH | `/vehicles/:id` | VEHICLE:UPDATE | UpdateVehicleDto | partial |
| DELETE | `/vehicles/:id` | VEHICLE:DELETE | — | soft delete |
| PATCH | `/vehicles/:id/status` | VEHICLE:UPDATE | `{ status }` | status enum |
| PATCH | `/vehicles/:id/mileage` | VEHICLE:UPDATE | `{ mileage }` | |

### 5.7.4 Drivers `/api/drivers`

| Method | Path | Permission | Notes |
|--------|------|------------|-------|
| POST | `/drivers` | DRIVER:CREATE | CreateDriverDto |
| GET | `/drivers` | DRIVER:VIEW | QueryDriverDto filters |
| GET | `/drivers/available` | DRIVER:VIEW | — |
| GET | `/drivers/statistics` | DRIVER:VIEW | — |
| GET | `/drivers/:id` | DRIVER:VIEW | ObjectId |
| PATCH | `/drivers/:id` | DRIVER:UPDATE | UpdateDriverDto |
| DELETE | `/drivers/:id` | DRIVER:DELETE | soft delete |
| PATCH | `/drivers/:id/status` | DRIVER:UPDATE | `{ status }` |
| PATCH | `/drivers/:id/safety-score` | DRIVER:UPDATE | `{ safetyScore: 0–100 }` |

### 5.7.5 Trips `/api/trips`

| Method | Path | Permission | Body / query | Notes |
|--------|------|------------|--------------|-------|
| POST | `/trips` | TRIP:CREATE | source, destination, vehicleId, driverId (ObjectIds), cargo*, planned*, estimatedRevenue, notes?, tripDocuments? | creates DRAFT |
| GET | `/trips` | TRIP:VIEW | pagination + status + driverId + vehicleId + dates | |
| GET | `/trips/statistics` | TRIP:VIEW | — | |
| GET | `/trips/available/vehicles` | TRIP:DISPATCH | — | |
| GET | `/trips/available/drivers` | TRIP:DISPATCH | — | |
| GET | `/trips/:id` | TRIP:VIEW | — | |
| PATCH | `/trips/:id` | TRIP:UPDATE | partial UpdateTripDto | |
| DELETE | `/trips/:id` | TRIP:DELETE | soft delete | |
| PATCH | `/trips/:id/dispatch` | TRIP:DISPATCH | empty | status sync ON_TRIP |
| PATCH | `/trips/:id/start` | TRIP:DISPATCH | empty | IN_PROGRESS + actualStartDate |
| PATCH | `/trips/:id/complete` | TRIP:COMPLETE | actualDistance, fuelConsumed, actualRevenue, notes? | AVAILABLE restore |
| PATCH | `/trips/:id/cancel` | TRIP:CANCEL | reason?, notes? | |

### 5.7.6 Maintenance `/api/maintenance`

| Method | Path | Permission | Notes |
|--------|------|------------|-------|
| POST | `/maintenance` | MAINTENANCE:CREATE | vehicleId ObjectId |
| GET | `/maintenance` | MAINTENANCE:VIEW | rich QueryMaintenanceDto |
| GET | `/maintenance/statistics` | MAINTENANCE:VIEW | |
| GET | `/maintenance/lookups/vehicles` | MAINTENANCE:VIEW | |
| GET | `/maintenance/vehicle/:vehicleId/history` | MAINTENANCE:VIEW | |
| GET | `/maintenance/vehicle/:vehicleId/in-maintenance` | MAINTENANCE:VIEW | `{ vehicleId, inMaintenance }` |
| GET | `/maintenance/:id` | MAINTENANCE:VIEW | includes timeline |
| PATCH | `/maintenance/:id` | MAINTENANCE:UPDATE | no vehicle reassignment |
| DELETE | `/maintenance/:id` | MAINTENANCE:DELETE | soft delete |
| PATCH | `/maintenance/:id/start` | MAINTENANCE:UPDATE | |
| PATCH | `/maintenance/:id/complete` | MAINTENANCE:COMPLETE | actualCost?, notes?, completedDate? |
| PATCH | `/maintenance/:id/cancel` | MAINTENANCE:UPDATE | notes? |
| POST | `/maintenance/:id/attachments` | MAINTENANCE:UPDATE | multipart files ≤10 × 10MB |

### 5.7.7 Fuel `/api/fuel`

| Method | Path | Permission | Notes |
|--------|------|------------|-------|
| POST | `/fuel` | FUEL:CREATE | business string refs |
| GET | `/fuel` | FUEL:VIEW | FuelQueryDto |
| GET | `/fuel/statistics` | FUEL:VIEW | dateFrom?, dateTo? |
| GET | `/fuel/vehicle/:vehicleId/history` | FUEL:VIEW | business id |
| GET | `/fuel/vehicle/:vehicleId/cost` | FUEL:VIEW | |
| GET | `/fuel/trip/:tripId/cost` | FUEL:VIEW | tripNumber |
| GET | `/fuel/comparison/vehicles` | FUEL:VIEW | |
| GET | `/fuel/:id` | FUEL:VIEW | fuel log ObjectId |
| PATCH | `/fuel/:id` | FUEL:UPDATE | |
| DELETE | `/fuel/:id` | FUEL:DELETE | soft delete |

### 5.7.8 Expenses `/api/expenses`

| Method | Path | Permission | Notes |
|--------|------|------------|-------|
| POST | `/expenses` | EXPENSE:CREATE | |
| GET | `/expenses` | EXPENSE:VIEW | + status, expenseType |
| GET | `/expenses/statistics` | EXPENSE:VIEW | |
| GET | `/expenses/trip/:tripId` | EXPENSE:VIEW | |
| GET | `/expenses/vehicle/:vehicleId/cost` | EXPENSE:VIEW | |
| GET | `/expenses/:id` | EXPENSE:VIEW | |
| PATCH | `/expenses/:id` | EXPENSE:UPDATE | may set status / approvedBy |
| DELETE | `/expenses/:id` | EXPENSE:DELETE | soft delete |

### 5.7.9 Dashboard `/api/dashboard`

| Method | Path | Permission | Query |
|--------|------|------------|-------|
| GET | `/dashboard/overview` | DASHBOARD:VIEW | — |
| GET | `/dashboard/recent-activity` | DASHBOARD:VIEW | limit 1–100 (default 20) |
| GET | `/dashboard/charts` | DASHBOARD:VIEW | — |
| GET | `/dashboard/alerts` | DASHBOARD:VIEW | — |
| GET | `/dashboard/top-drivers` | DASHBOARD:VIEW | limit 1–50 (default 10) |
| GET | `/dashboard/top-vehicles` | DASHBOARD:VIEW | limit |
| GET | `/dashboard/upcoming-maintenance` | DASHBOARD:VIEW | limit |
| GET | `/dashboard/recent-trips` | DASHBOARD:VIEW | limit |
| GET | `/dashboard/business-summary` | DASHBOARD:VIEW | period daily\|weekly\|monthly |
| GET | `/dashboard/reports/export` | REPORTS:EXPORT | period, format csv\|pdf |

### 5.7.10 Analytics `/api/analytics`

| Method | Path | Permission | Query |
|--------|------|------------|-------|
| GET | `/analytics/charts` | REPORTS:VIEW | months 3–24 (default 6) |
| GET | `/analytics/summary` | REPORTS:VIEW | period |
| GET | `/analytics/reports` | REPORTS:VIEW | period |
| GET | `/analytics/reports/export` | REPORTS:EXPORT | period, format |

### 5.7.11 Users `/api/users`

| Method | Path | Permission | Body highlights |
|--------|------|------------|----------------|
| GET | `/users` | USERS:VIEW | UserQueryDto |
| POST | `/users` | USERS:CREATE | email, password, names, roles: RoleCode[], status? |
| POST | `/users/bulk/status` | USERS:UPDATE | ids[], status |
| POST | `/users/bulk/delete` | USERS:DELETE | ids[] |
| GET | `/users/:id` | USERS:VIEW | |
| GET | `/users/:id/permissions` | USERS:VIEW | effective permissions |
| PATCH | `/users/:id` | USERS:UPDATE | UpdateUserDto |
| POST | `/users/:id/roles` | USERS:UPDATE | `{ roles: RoleCode[] }` |
| DELETE | `/users/:id/roles/:roleCode` | USERS:UPDATE | |
| DELETE | `/users/:id` | USERS:DELETE | soft delete |

### 5.7.12 Roles `/api/roles`

| Method | Path | Permission | Notes |
|--------|------|------------|-------|
| GET | `/roles` | ROLES:VIEW | search? |
| GET | `/roles/:id` | ROLES:VIEW | |
| PATCH | `/roles/:id` | ROLES:UPDATE | name?, description?, permissions? |
| POST | `/roles/:id/clone-permissions` | ROLES:UPDATE | `{ targetCode }` |
| POST | `/roles/:id/assign-users` | ROLES:UPDATE | `{ userIds }` |
| DELETE | `/roles/:id` | ROLES:DELETE | non-system only |

### 5.7.13 Permissions `/api/permissions`

| Method | Path | Permission | Notes |
|--------|------|------------|-------|
| GET | `/permissions` | PERMISSIONS:VIEW | search?, module? |
| GET | `/permissions/grouped` | PERMISSIONS:VIEW | |
| GET | `/permissions/matrix` | PERMISSIONS:VIEW | role×permission matrix |

### 5.7.14 Settings / Profile / Security / Notifications / Audit

| Method | Path | Permission |
|--------|------|------------|
| GET/PATCH | `/settings/company` | SETTINGS:VIEW / UPDATE |
| GET/PATCH | `/settings/appearance` | PROFILE:VIEW / UPDATE |
| GET | `/settings/statistics` | SETTINGS:VIEW |
| GET/PATCH | `/profile` | PROFILE:VIEW / UPDATE |
| POST | `/profile/password` | PROFILE:UPDATE | currentPassword, newPassword |
| GET/PATCH | `/security` | SETTINGS:VIEW / UPDATE |
| GET/PATCH | `/notifications/settings` | NOTIFICATIONS:VIEW / UPDATE |
| GET | `/audit` | AUDIT:VIEW |
| GET | `/audit/export` | AUDIT:EXPORT | CSV |

## 5.8 Status Codes

| Code | Typical cause |
|------|---------------|
| 200 | Successful GET/PATCH/DELETE |
| 201 | Successful POST create (where annotated) |
| 400 | Validation, illegal status transition, failed business rule |
| 401 | Missing/invalid/expired access token; refresh failure |
| 403 | Authenticated but missing required permission |
| 404 | Entity not found or soft-deleted |
| 409 | Unique constraint conflicts (where mapped) |
| 500 | Unhandled server error (filtered) |

## 5.9 Swagger

- URL: `/api/docs`
- Bearer auth scheme configured
- Controllers annotated with `@ApiOperation` / `@ApiResponse` in domain modules
- DocumentBuilder title: `TransitOps API`; description fleet management; version `0.1.0` in swagger metadata (product SRS version remains 1.0.0)

---

# 6. Business Logic

## 6.1 Trip Lifecycle

```
DRAFT ──dispatch──► DISPATCHED ──start──► IN_PROGRESS ──complete──► COMPLETED
   │                    │                      │
   └──── cancel ────────┴────── cancel ────────┘──────────────► CANCELLED
```

| Transition | Permission | Vehicle/Driver side effects |
|------------|------------|----------------------------|
| → DISPATCHED | TRIP:DISPATCH | both → ON_TRIP |
| → IN_PROGRESS | TRIP:DISPATCH | dates: actualStartDate=now |
| → COMPLETED | TRIP:COMPLETE | both → AVAILABLE; actual* fields |
| → CANCELLED | TRIP:CANCEL | if DISPATCHED/IN_PROGRESS → AVAILABLE |

## 6.2 Sequence — Auth Refresh (ASCII)

```
Client                apiClient              authHttp            AuthController         UserRepo
  |                       |                     |                      |                   |
  |  API call + access    |                     |                      |                   |
  |---------------------->|                     |                      |                   |
  |                       |  401 Unauthorized   |                      |                   |
  |                       |<--------------------|                      |                   |
  |                       |  POST /auth/refresh |                      |                   |
  |                       |-------------------->|                      |                   |
  |                       |                     |  { refreshToken }    |                   |
  |                       |                     |--------------------->|                   |
  |                       |                     |                      | verify JWT         |
  |                       |                     |                      | load user          |
  |                       |                     |                      |------------------>|
  |                       |                     |                      | timingSafeEqual   |
  |                       |                     |                      | hash == stored?   |
  |                       |                     |                      | if NO: unset hash |
  |                       |                     |                      | reject reuse      |
  |                       |                     |                      | if YES: issue new |
  |                       |                     |                      | store new SHA-256 |
  |                       |                     |  new tokens          |                   |
  |                       |                     |<---------------------|                   |
  |                       |  update Zustand     |                      |                   |
  |                       |  retry original req |                      |                   |
  |  200 + data           |                     |                      |                   |
  |<----------------------|                     |                      |                   |
```

## 6.3 Sequence — Trip Dispatch (ASCII)

```
Dispatcher UI          tripService           TripController         TripService
     |                      |                      |                     |
     | PATCH .../dispatch   |                      |                     |
     |--------------------->|                      |                     |
     |                      | Jwt + TRIP:DISPATCH  |                     |
     |                      |--------------------->|                     |
     |                      |                      | requireTrip         |
     |                      |                      | status ∈ DISPATCHABLE
     |                      |                      | validateTrip:       |
     |                      |                      |  - capacity         |
     |                      |                      |  - active trip?     |
     |                      |                      |  - maintenance?     |
     |                      |                      |  - driver license   |
     |                      |                      | vehicle → ON_TRIP   |
     |                      |                      | driver  → ON_TRIP   |
     |                      |                      | trip → DISPATCHED   |
     |                      |  ApiResponse(trip)   |                     |
     |  invalidate queries  |<---------------------|                     |
     |<---------------------|                      |                     |
```

## 6.4 Sequence — Maintenance Complete (ASCII)

```
Technician UI       maintenanceService      MaintenanceController      MaintenanceService
     |                      |                        |                        |
     | PATCH /:id/complete  |                        |                        |
     | { actualCost?... }   |                        |                        |
     |--------------------->|                        |                        |
     |                      | MAINTENANCE:COMPLETE   |                        |
     |                      |----------------------->|                        |
     |                      |                        | load maintenance       |
     |                      |                        | assert completable     |
     |                      |                        | set COMPLETED          |
     |                      |                        | set completedDate      |
     |                      |                        | apply actualCost/notes |
     |                      |                        | restore vehicle status |
     |                      |                        |   (AVAILABLE when safe)|
     |                      |  ApiResponse           |                        |
     |  UI timeline update  |<-----------------------|                        |
     |<---------------------|                        |                        |
```

## 6.5 Fuel Cost Rule

`totalCost = round(quantity * pricePerLiter, 2)` enforced in Mongoose `pre('save')` on `fuel_logs`. Clients may send totalCost but server recomputes.

## 6.6 Expense Approval Rule

- Create defaults to `PENDING`.
- Approval/rejection via update of `status` (+ optional `approvedBy`).
- Operational cost calculations that filter expenses use **APPROVED** status (per FRD / cost helpers).
- Catalog permission `EXPENSE:APPROVE` is seeded for roles but **not** bound to a distinct controller decorator in the current API.

## 6.7 Status Synchronization Matrix

| Event | Vehicle | Driver |
|-------|---------|--------|
| Trip dispatch | ON_TRIP | ON_TRIP |
| Trip complete | AVAILABLE | AVAILABLE |
| Trip cancel (active) | AVAILABLE | AVAILABLE |
| Maintenance start / in progress | MAINTENANCE | (unchanged) |
| Maintenance complete | AVAILABLE (when applicable) | (unchanged) |

## 6.8 Business Rule ID Mapping (FRD → Implementation)

| FRD Rule IDs | Technical locus |
|--------------|-----------------|
| VR-01…VR-08 | Fleet validators + vehicle schema unique indexes |
| DV-01…DV-06 | Driver validators + license expiry checks in trip validation |
| TD-01…TD-14 | `trip.service` + `trip.validators` + maintenance in-maintenance check |
| MN-01…MN-06 | `maintenance.service` + attachment limits |
| FL-01…FL-04 | Fuel schema hook + ReferenceValidationService |
| EX-01…EX-05 | Expense service status + cost filters |
| RB-01…RB-06 | PermissionsGuard + ROLE_PERMISSION_DEFAULTS |
| DB-01…DB-03 | Dashboard aggregations exclude soft-deleted |
| RP-01…RP-03 | Analytics period/format handling |

---

# 7. Frontend Architecture

## 7.1 App Router Tree

```
src/app/
├── layout.tsx, page.tsx (→ /dashboard), loading.tsx, error.tsx, not-found.tsx, globals.css
├── (public)/login/page.tsx
└── (protected)/
    ├── layout.tsx → ProtectedShell
    ├── dashboard, analytics, reports, fuel-expenses, profile
    ├── fleet/{page,new,[id], [id]/edit}
    ├── drivers/{page,new,[id], [id]/edit}
    ├── trips/{page,new,[id], [id]/edit}
    ├── maintenance/{page,new,[id], [id]/edit}
    ├── fuel/{page,new,[id], [id]/edit}
    ├── expenses/{page,new,[id], [id]/edit}
    └── settings/{company,users,roles,permissions,notifications,security,appearance,audit,activity}
```

No `middleware.ts`. Auth gate is client-side ProtectedShell.

## 7.2 Components (Major Folders)

`charts/`, `dashboard/`, `data-table/`, `drivers/`, `expenses/`, `feedback/`, `filters/`, `fleet/`, `forms/`, `fuel/`, `layout/`, `maintenance/`, `settings/`, `trips/`, `ui/` — domain cards/tables/forms/dialogs plus shared Radix-based UI primitives.

## 7.3 Route → Service → API Mapping

| Route | Primary service methods | Backend paths |
|-------|-------------------------|---------------|
| `/login` | `authApi.login` | `POST /auth/login` |
| `/dashboard` | `dashboardService.getOverview/Activity/Charts/Alerts/Top*/Upcoming*/RecentTrips` | `GET /dashboard/*` |
| `/analytics` | `analyticsService.getCharts`, `dashboardService.getOverview` | `GET /analytics/charts`, `/dashboard/overview` |
| `/reports` | `getReports`, `exportReport` | `GET /analytics/reports`, `/analytics/reports/export` |
| `/fleet` | `fleetApi.list/getStatistics/remove` | `GET/DELETE /vehicles*` |
| `/fleet/new` | `create` | `POST /vehicles` |
| `/fleet/:id` | `getById`, `remove`, `updateStatus` | `GET/DELETE/PATCH .../status` |
| `/fleet/:id/edit` | `getById`, `update` | `GET/PATCH /vehicles/:id` |
| `/drivers*` | `driversApi.*` | `/drivers*` |
| `/trips` | list, statistics, dispatch, start, complete, cancel | `/trips*` lifecycle |
| `/trips/new` | create + availableVehicles/Drivers | `POST /trips`, `GET /trips/available/*` |
| `/maintenance*` | `maintenanceService.*` + attachments | `/maintenance*` |
| `/fuel-expenses` | fuel/expense statistics + vehicle comparison | `/fuel/statistics`, `/expenses/statistics`, `/fuel/comparison/vehicles` |
| `/fuel*` | `fuelService.*` | `/fuel*` |
| `/expenses*` | `expenseService.*` | `/expenses*` |
| `/settings/company` | get/update company | `/settings/company` |
| `/settings/users` | users + roles | `/users*`, `/roles` |
| `/settings/roles` | roles update/clone | `/roles*` |
| `/settings/permissions` | matrix + updateRole | `/permissions/matrix`, `PATCH /roles/:id` |
| `/settings/notifications` | notification settings | `/notifications/settings` |
| `/settings/security` | security settings | `/security` |
| `/settings/appearance` | appearance | `/settings/appearance` |
| `/settings/audit` | list + export | `/audit`, `/audit/export` |
| `/settings/activity` | listAudit | `/audit` |
| `/profile` | profile + password | `/profile`, `/profile/password` |

## 7.4 State Management

| Store / lib | Purpose |
|-------------|---------|
| `useAuthStore` | accessToken, refreshToken, isAuthenticated (persisted) |
| `useUiStore` | sidebar collapsed / mobile open |
| React Query | server state; staleTime 30_000; retry 1; refetchOnWindowFocus false |
| ThemeProvider | next-themes; defaultTheme dark; enableSystem false |

## 7.5 Permission Gating (Frontend Reality)

- Nav items declare permission codes in `constants/nav.ts`.
- Sidebar filters via `filterNavByPermissions` / `useUserPermissions` (from `GET /profile`).
- **Pages are not RBAC-blocked**; deep links work if authenticated; API returns 403 if unauthorized.
- Settings sub-nav is **not** permission-filtered.

## 7.6 Forms & Validation

- Zod builders in `utils/form-validation.ts` (email, phone, password strength, amounts, codes).
- Sanitizers in `form-sanitize.ts` + `enhanceRegister`.
- `DEFAULT_FORM_OPTIONS`: mode `onBlur`, reValidateMode `onChange`.
- File upload constant: max 10MB; images + PDF.

## 7.7 Shared Types Package

`@transitops/shared-types` exports API envelope, auth payloads, all major domain enums/interfaces used by both apps — single source for RoleCode, TripStatus, FuelType, etc.

---

# 8. Backend Architecture

## 8.1 Layering Pattern

```
Controller (HTTP, Swagger, permissions)
    → Service (business rules, orchestration)
        → Repository (Mongoose queries)
            → Schema (collection definition)
```

Cross-cutting: `IntegrationModule` services called from Fuel/Expense for reference checks and cost math.

## 8.2 DTO Pattern

- `Create*Dto` / `Update*Dto` / `Query*Dto` with class-validator
- Global ValidationPipe strips unknown properties (`whitelist`) and rejects extras (`forbidNonWhitelisted`)
- Implicit conversion enabled for query primitives

## 8.3 Guards & Decorators

| Artifact | Role |
|----------|------|
| `JwtAuthGuard` | Passport JWT access validation |
| `PermissionsGuard` | `@RequirePermissions` enforcement |
| `RolesGuard` | Optional `@Roles` (unused on routes today) |
| `@RequirePermissions` | Metadata for permission codes |
| `@PermissionModeMeta` | `any` vs `all` |

Guards are **not** registered as `APP_GUARD` globally — applied per controller so auth/health remain public.

## 8.4 Interceptors & Filters

| Artifact | Behavior |
|----------|----------|
| `ResponseInterceptor` | Wrap payloads into `ApiResponse`; respect pre-shaped `{success,data}` or `{data,meta}` |
| `AllExceptionsFilter` | Normalize exceptions to client-safe error JSON |

## 8.5 Logging & Hardening at Bootstrap

From `main.ts`: Helmet, compression, CORS from `CORS_ORIGINS`, Winston logger, static `/uploads`, Swagger setup.

## 8.6 Seed & Wipe Tooling

| Script | Purpose |
|--------|---------|
| `yarn workspace @transitops/backend seed` | Core seed (roles, permissions, admin, demo data) |
| `seed:fuel-expense` | Demo fuel/expense |
| `seed:all` | both |
| `wipe` | `wipe-db.ts` development wipe |

---

# 9. Security

## 9.1 Control Summary

| Control | Implementation |
|---------|----------------|
| Transport security (prod expectation) | TLS termination outside app (not bundled); Helmet headers on API |
| Password storage | bcryptjs cost **12** |
| Session | Stateless JWT access + rotating refresh |
| Refresh theft mitigation | Rotation + reuse detection clears hash |
| AuthZ | PermissionsGuard on controllers |
| Input validation | ValidationPipe whitelist/forbid |
| CORS | Explicit origin list |
| Soft secrets | `.env` not committed; `.env.example` provided |
| Audit | audit_logs for admin/auth events |
| File upload | MIME/size limits on maintenance attachments |

## 9.2 Threat → Control Mapping

| Threat | Risk | Control in codebase | Residual gap |
|--------|------|---------------------|--------------|
| Credential stuffing | High | bcrypt 12; ACTIVE check | No rate limit; lockout fields not enforced on failure |
| JWT theft (XSS) | High | Short access TTL; tokens in persisted Zustand (localStorage risk) | Prefer httpOnly cookies (future) |
| Refresh token replay | High | Rotation + hash compare + revoke on mismatch | — |
| Privilege escalation | High | Server-side permission checks | FE pages not gated (API still enforces) |
| IDOR on fuel/expense | Medium | OPERATOR createdBy scoping | Broader roles see all |
| Mass assignment | Medium | DTO whitelist | — |
| Path traversal on uploads | Medium | Multer constrained upload pipeline | Continue hardening review |
| CSRF | Low/Med | Bearer token (not cookie session) reduces classic CSRF | — |
| Dependency vulns | Med | Regular audit (process) | No Dependabot config mandated in repo |
| Data scrape via API | Med | RBAC | **No rate limiting** in repo |
| Soft-delete bypass | Low | Repositories filter isDeleted | Direct DB access out of band |

## 9.3 Permission Catalog (Complete Codes)

```
VEHICLE:VIEW|CREATE|UPDATE|DELETE
DRIVER:VIEW|CREATE|UPDATE|DELETE
TRIP:VIEW|CREATE|DISPATCH|COMPLETE|CANCEL|UPDATE|DELETE
MAINTENANCE:VIEW|CREATE|UPDATE|DELETE|COMPLETE
FUEL:VIEW|CREATE|UPDATE|DELETE
EXPENSE:VIEW|CREATE|UPDATE|DELETE|APPROVE
DASHBOARD:VIEW
REPORTS:VIEW|EXPORT
SETTINGS:VIEW|UPDATE
USERS:VIEW|CREATE|UPDATE|DELETE
ROLES:VIEW|CREATE|UPDATE|DELETE
PERMISSIONS:VIEW|UPDATE
NOTIFICATIONS:VIEW|UPDATE
AUDIT:VIEW|EXPORT
PROFILE:VIEW|UPDATE
```

`SUPER_ADMIN` default: `['*']`. `ADMIN` receives full catalog codes.

## 9.4 Security Settings Document

`app_settings.security` stores policy knobs (min length, character classes, session timeout, max attempts, lock duration, twoFactorReady). These influence admin UI / future enforcement; **login lockout is not fully wired** to failed attempts in the current auth service.

---

# 10. Performance

## 10.1 Index Rationale

| Index | Collection | Why |
|-------|------------|-----|
| `{ isDeleted: 1, status: 1 }` | vehicles, drivers | Default list filters |
| Text search indexes | vehicles, drivers, trips, maintenance | UI search boxes |
| `{ vehicleId: 1, filledAt: -1 }` | fuel_logs | History & cost by vehicle over time |
| `{ vehicleId: 1, expenseDate: -1 }` | expenses | Same for expenses |
| `{ status: 1, plannedStartDate: -1 }` | trips | Dispatch boards / schedules |
| `{ vehicleId: 1, status: 1, isDeleted: 1 }` | trips, maintenance | Active assignment checks |
| `{ createdAt: -1 }` | audit_logs | Recent activity / export |
| Unique keys | vehicleId, tripNumber, email, etc. | Integrity + O(1)-ish lookups |

## 10.2 Application Performance Practices

| Practice | Detail |
|----------|--------|
| Compression | `compression()` middleware |
| Aggregation pushdown | Dashboard/Analytics use Mongo aggregations |
| FE caching | React Query staleTime 30s |
| Pagination | List endpoints accept page/limit |
| Selective exports | Report/audit export on demand |

## 10.3 NFR Mapping

| FRD NFR | SRS note |
|---------|----------|
| NFR-P-01…04 | Indexes + pagination + aggregations support list/dashboard latency goals on single-node Mongo |
| Scalability | Vertical/single DB; no shard/ redis layer in repo |
| Availability | Process-level; no HA manifests |

---

# 11. Testing

## 11.1 Strategy

| Layer | Tooling | Coverage reality |
|-------|---------|------------------|
| Backend unit/integration-style | Jest + `@nestjs/testing` | 32 spec files under `apps/backend` |
| Frontend | — | **No** `*.test.*` / `*.spec.*` |
| E2E | — | Not in repo |
| Manual | Swagger + UI flows | Documented via AC-* |

## 11.2 Backend Test File Inventory

```
apps/backend/src/common/guards/tests/permissions.guard.spec.ts
apps/backend/src/modules/analytics/tests/analytics.controller.spec.ts
apps/backend/src/modules/audit/tests/audit.service.spec.ts
apps/backend/src/modules/dashboard/tests/dashboard.controller.spec.ts
apps/backend/src/modules/dashboard/tests/dashboard.repository.spec.ts
apps/backend/src/modules/dashboard/tests/report.service.spec.ts
apps/backend/src/modules/dashboard/tests/statistics.service.spec.ts
apps/backend/src/modules/driver/tests/driver.controller.spec.ts
apps/backend/src/modules/driver/tests/driver.repository.spec.ts
apps/backend/src/modules/driver/tests/driver.service.spec.ts
apps/backend/src/modules/driver/tests/driver.validators.spec.ts
apps/backend/src/modules/expense/tests/expense.controller.spec.ts
apps/backend/src/modules/expense/tests/expense.repository.spec.ts
apps/backend/src/modules/expense/tests/expense.service.spec.ts
apps/backend/src/modules/fleet/tests/vehicle.controller.spec.ts
apps/backend/src/modules/fleet/tests/vehicle.repository.spec.ts
apps/backend/src/modules/fleet/tests/vehicle.service.spec.ts
apps/backend/src/modules/fleet/tests/vehicle.validators.spec.ts
apps/backend/src/modules/fuel/tests/fuel.controller.spec.ts
apps/backend/src/modules/fuel/tests/fuel.repository.spec.ts
apps/backend/src/modules/fuel/tests/fuel.service.spec.ts
apps/backend/src/modules/maintenance/tests/maintenance.controller.spec.ts
apps/backend/src/modules/maintenance/tests/maintenance.repository.spec.ts
apps/backend/src/modules/maintenance/tests/maintenance.service.spec.ts
apps/backend/src/modules/permissions/tests/permissions.service.spec.ts
apps/backend/src/modules/roles/tests/roles.service.spec.ts
apps/backend/src/modules/settings/tests/settings.service.spec.ts
apps/backend/src/modules/trip/tests/trip.controller.spec.ts
apps/backend/src/modules/trip/tests/trip.repository.spec.ts
apps/backend/src/modules/trip/tests/trip.service.spec.ts
apps/backend/src/modules/trip/tests/trip.validators.spec.ts
apps/backend/src/modules/users/tests/users.service.spec.ts
```

**Pattern:** `*.controller.spec.ts`, `*.service.spec.ts`, `*.repository.spec.ts`, `*.validators.spec.ts` colocated under `modules/<domain>/tests/`.

**Gaps:** No dedicated `auth.service.spec.ts`; no notifications specs; no frontend tests.

## 11.3 Scripts

```bash
yarn workspace @transitops/backend test
yarn workspace @transitops/backend test:watch
yarn workspace @transitops/backend test:cov
yarn workspace @transitops/backend test:trip
```

## 11.4 AC → Test Mapping (Representative)

| Acceptance ID | Suggested / existing test locus |
|---------------|----------------------------------|
| AC-AUTH-* | Manual + auth flows; lockout gap acknowledged |
| AC-VEH-* | `vehicle.*.spec.ts` |
| AC-DRV-* | `driver.*.spec.ts` |
| AC-TRP-* | `trip.*.spec.ts` |
| AC-MNT-* | `maintenance.*.spec.ts` |
| AC-FUL-* | `fuel.*.spec.ts` |
| AC-EXP-* | `expense.*.spec.ts` |
| AC-RPT-* | `analytics.controller.spec.ts`, dashboard report specs |
| AC-SET-* | `settings.service.spec.ts`, users/roles/permissions specs |

---

# 12. Deployment

## 12.1 Docker

**Not included in the repository.** Deployment is bare Node processes + managed MongoDB (or local Mongo).

## 12.2 Environment Variables

### Backend (`apps/backend/.env.example` + Joi validation)

| Variable | Required | Example / default | Purpose |
|----------|----------|-------------------|---------|
| `NODE_ENV` | no | `development` | development\|production\|test |
| `PORT` | no | `4000` | HTTP port |
| `MONGODB_URI` | **yes** | `mongodb://localhost:27017/transitops` | DB connection |
| `JWT_SECRET` | **yes** | min 16 chars | Access token signing |
| `JWT_EXPIRES_IN` | no | `15m` | Access TTL |
| `JWT_REFRESH_SECRET` | **yes** | min 16 chars | Refresh signing |
| `JWT_REFRESH_EXPIRES_IN` | no | `7d` | Refresh TTL |
| `CORS_ORIGINS` | no | `http://localhost:3000` | Comma-separated |
| `SEED_ADMIN_EMAIL` | no | `admin@transitops.com` | Seed admin |
| `SEED_ADMIN_PASSWORD` | no | `Admin@12345` | Seed admin |
| `SEED_ADMIN_FIRST_NAME` | no | `System` | Seed admin |
| `SEED_ADMIN_LAST_NAME` | no | `Admin` | Seed admin |

### Frontend

| Variable | Required | Default / notes |
|----------|----------|-----------------|
| `NEXT_PUBLIC_API_URL` | no | `http://localhost:4000/api` (`services/api.ts`) |
| `NEXT_PUBLIC_APP_NAME` | no | Used locally as `TransitOps`; not validated by backend |

Note: README mentions copying `apps/frontend/.env.example`; that file may be absent — create `.env.local` with the variables above.

## 12.3 Build & Run

```bash
yarn install
cp apps/backend/.env.example apps/backend/.env
# create apps/frontend/.env.local with NEXT_PUBLIC_API_URL

yarn dev                 # both apps
yarn build               # shared-types → backend → frontend
yarn workspace @transitops/backend seed:all
```

| URL | Purpose |
|-----|---------|
| http://localhost:3000 | Frontend |
| http://localhost:4000/api | API |
| http://localhost:4000/api/docs | Swagger |
| http://localhost:4000/api/health | Liveness |

## 12.4 Production Checklist

- [ ] Strong unique `JWT_SECRET` / `JWT_REFRESH_SECRET`
- [ ] `NODE_ENV=production`
- [ ] Restrict `CORS_ORIGINS`
- [ ] MongoDB auth + backups
- [ ] TLS terminator
- [ ] Consider rate limiting (not in repo)
- [ ] Seed only in controlled environments; protect wipe script
- [ ] Serve frontend build (`next start`) and API (`node dist/main`)

---

# 13. Coding Standards

## 13.1 Naming

| Artifact | Convention | Example |
|----------|------------|---------|
| Nest module folder | kebab domain | `modules/trip` |
| Controller | `*.controller.ts` | `trip.controller.ts` |
| Service | `*.service.ts` | `trip.service.ts` |
| Schema | `*.schema.ts` | `trip.schema.ts` |
| DTO | `create-*.dto.ts` | `create-trip.dto.ts` |
| Spec | `*.spec.ts` under `tests/` | `trip.service.spec.ts` |
| FE service | `*.service.ts` or domain `fleet.ts` | `trip.service.ts` |
| FE hook | `use-*.ts` | `use-trips.ts` |
| Permission | `MODULE:ACTION` | `TRIP:DISPATCH` |
| Enums | PascalCase union/enum | `TripStatus.DISPATCHED` |

## 13.2 Coding Standards Examples

### Backend — permission-decorated handler

```typescript
@Patch(':id/dispatch')
@RequirePermissions('TRIP:DISPATCH')
dispatch(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
  return this.tripService.dispatchTrip(id, user);
}
```

### Backend — soft delete filter (repository pattern)

```typescript
this.model.find({ isDeleted: false, status: VehicleStatus.AVAILABLE });
```

### Frontend — React Query key + service

```typescript
export const tripKeys = {
  all: ['trips'] as const,
  detail: (id: string) => ['trips', id] as const,
};

export function useTrip(id: string) {
  return useQuery({
    queryKey: tripKeys.detail(id),
    queryFn: () => tripService.getById(id),
    enabled: Boolean(id),
  });
}
```

### Frontend — Zod field helper usage

```typescript
const schema = z.object({
  email: emailField(),
  password: passwordField(),
});
```

## 13.3 Git & Commits

- Follow existing conventional, imperative commit messages in repo history.
- Do not commit `.env` secrets.
- Prefer small PR-sized commits by domain (fleet, trip, auth).

## 13.4 Lint / Format / Typecheck

| Command | Scope |
|---------|-------|
| `yarn lint` | all workspaces |
| `yarn format` / `format:check` | Prettier |
| `yarn typecheck` | all workspaces tsc |

---



# 13A. Extended Technical Annex (Normative)

This annex is part of SRS v1.0.0 and expands contracts that appear throughout §§3–12. It exists to satisfy implementation and QA needs for field-level and permission-level precision without inventing product features beyond the TransitOps codebase.

## A.1 CreateVehicleDto — Request Field Table

| Field | Type | Required | Validation notes (as implemented) |
|-------|------|----------|-----------------------------------|
| vehicleId | string | yes | unique business id, normalized uppercase |
| registrationNumber | string | yes | unique |
| vin | string | no | sparse unique when present |
| make | string | yes | — |
| model | string | yes | — |
| year | number | no | 1980–2100 |
| vehicleType | VehicleType enum | yes | BUS…OTHER |
| fuelType | FuelType enum | yes | DIESEL…OTHER |
| color | string | no | — |
| seatingCapacity | number | no | min 1 |
| maxCapacity | number | yes | 1–500 kg |
| mileage | number | no | default 0 |
| purchaseDate | ISO date string | no | — |
| registrationExpiryDate | ISO date string | yes | — |
| insuranceExpiryDate | ISO date string | yes | — |
| fitnessCertificateExpiryDate | ISO date string | yes | — |
| lastServiceDate | ISO date string | no | — |
| nextServiceDueDate | ISO date string | no | — |
| depotCity | string | no | — |
| depotState | string | no | — |
| country | string | no | default India in schema |
| photo | string | no | URL/path |
| documents | array | no | `{ name, url, type?, uploadedAt? }` |
| status | VehicleStatus | no | default AVAILABLE |
| remarks | string | no | — |

## A.2 CreateDriverDto — Request Field Table

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| employeeCode | string | yes | unique business id |
| firstName | string | yes | — |
| lastName | string | yes | fullName derived |
| email | string | yes | unique |
| phone | string | yes | unique |
| alternatePhone | string | no | — |
| dateOfBirth | ISO date | no | — |
| joiningDate | ISO date | yes | — |
| licenseNumber | string | yes | unique |
| licenseCategory | LicenseCategory | yes | — |
| licenseIssueDate | ISO date | no | — |
| licenseExpiryDate | ISO date | yes | — |
| experienceYears | number | no | default 0 |
| address, city, state, postalCode | string | no | — |
| country | string | no | — |
| emergencyName, emergencyPhone | string | no | — |
| bloodGroup | BloodGroup | no | — |
| photo | string | no | — |
| documents | array | no | — |
| status | DriverStatus | no | default AVAILABLE |
| safetyScore | number | no | default 100 |
| remarks | string | no | — |

## A.3 CreateTripDto — Request Field Table

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| source | string | yes | origin |
| destination | string | yes | destination |
| vehicleId | MongoId string | yes | **ObjectId**, not VH-* |
| driverId | MongoId string | yes | **ObjectId**, not EMP-* |
| cargoName | string | yes | — |
| cargoWeight | number | yes | must fit vehicle maxCapacity |
| cargoType | CargoType | no | default GENERAL |
| plannedDistance | number | yes | ≥ 0 |
| plannedStartDate | ISO date | yes | — |
| plannedEndDate | ISO date | yes | ≥ start |
| estimatedRevenue | number | yes | ≥ 0 |
| notes | string | no | — |
| tripDocuments | array | no | `{ name, url }` |

## A.4 CompleteTripDto / CancelTripDto

| DTO | Fields |
|-----|--------|
| CompleteTripDto | `actualDistance` (number), `fuelConsumed` (number), `actualRevenue` (number), `notes?` (string) |
| CancelTripDto | `reason?` (string), `notes?` (string) |

## A.5 CreateMaintenanceDto — Request Field Table

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| vehicleId | MongoId | yes | ObjectId |
| maintenanceType | MaintenanceType | yes | — |
| title | string | yes | max 100 |
| description | string | no | max 500 |
| priority | MaintenancePriority | no | default MEDIUM |
| startDate | ISO date | yes | — |
| expectedCompletionDate | ISO date | yes | — |
| estimatedCost | number | yes | min 0.01 |
| vendorName / vendorPhone / serviceCenter | string | no | — |
| odometerReading | number | no | — |
| nextServiceDue | ISO date | no | — |
| notes | string | no | max 500 |

Complete body: `actualCost?`, `notes?`, `completedDate?`.

## A.6 CreateFuelDto — Request Field Table

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| vehicleId | string | yes | business VH-* |
| tripId | string | no | TR-* |
| driverId | string | no | employeeCode |
| fuelStation | string | yes | — |
| fuelType | FuelType | yes | — |
| quantity | number | yes | min 0.01 |
| pricePerLiter | number | yes | min 0.01 |
| odometerReading | number | no | — |
| filledAt | ISO date | yes | — |
| receiptImage | string | no | — |
| notes | string | no | — |

## A.7 CreateExpenseDto — Request Field Table

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| vehicleId | string | yes | business id |
| tripId | string | no | — |
| driverId | string | no | — |
| expenseType | ExpenseType | yes | — |
| title | string | yes | — |
| description | string | no | — |
| amount | number | yes | min 0.01 |
| expenseDate | ISO date | yes | — |
| receiptImage | string | no | — |
| status | ExpenseStatus | no | default PENDING |
| notes | string | no | — |

Update may additionally set `approvedBy` and change `status` to APPROVED/REJECTED.

## A.8 CreateUserDto / Profile / Password

| Endpoint body | Fields |
|---------------|--------|
| POST /users | email, password, firstName, lastName, phone?, roles: RoleCode[], status? |
| PATCH /profile | firstName?, lastName?, phone?, avatarUrl? (per UpdateProfileDto) |
| POST /profile/password | currentPassword, newPassword |

## A.9 Default Role Permission Matrix (Conceptual)

Exact defaults live in the RBAC permission catalog (`ROLE_PERMISSION_DEFAULTS`). Behavior:

| RoleCode | Access pattern |
|----------|----------------|
| SUPER_ADMIN | `*` wildcard — bypasses individual checks |
| ADMIN | Full explicit catalog (all MODULE:ACTION codes) |
| FLEET_MANAGER | Fleet, drivers, trips, maintenance, fuel, expense view/manage subset, dashboard |
| DISPATCHER | Trip lifecycle + vehicle/driver view + dashboard |
| SAFETY_OFFICER | Drivers, maintenance, compliance-oriented views |
| FINANCIAL_ANALYST | Fuel, expense, reports/export, dashboard |
| OPERATOR | Create/view own operational fuel/expense (scoped); limited trip/fleet view as seeded |
| VIEWER | Read-oriented VIEW permissions |

QA must verify seeded role documents after `yarn seed`, not only this summary table.

## A.10 Frontend Service Inventory (Method Catalog)

### authApi (`services/auth.ts`)
`login`, `refresh`, `logout`

### fleetApi (`services/fleet.ts`)
`list`, `getById`, `create`, `update`, `remove`, `updateStatus`, `updateMileage`, `getAvailable`, `getStatistics`

### driversApi (`services/drivers.ts`)
`list`, `getById`, `create`, `update`, `remove`, `updateStatus`, `updateSafetyScore`, `getAvailable`, `getStatistics`

### tripService (`services/trip.service.ts`)
`list`, `getById`, `statistics`, `create`, `update`, `remove`, `dispatch`, `start`, `complete`, `cancel`, `availableVehicles`, `availableDrivers`

### maintenanceService (`services/maintenance.service.ts`)
`list`, `getById`, `getStatistics`, `listVehicles`, `create`, `update`, `remove`, `start`, `complete`, `cancel`, `uploadAttachments`

### fuelService / expenseService (`services/fuel-expense.service.ts`)
Fuel: `list`, `getById`, `create`, `update`, `remove`, `getStatistics`, `getVehicleHistory`, `getVehicleCost`, `getTripCost`, `getVehicleComparison`  
Expense: `list`, `getById`, `create`, `update`, `remove`, `getStatistics`, `getTripExpenses`, `getVehicleCost`

### dashboardService / analyticsService (`services/dashboard.service.ts`)
Dashboard: `getOverview`, `getRecentActivity`, `getCharts`, `getAlerts`, `getTopDrivers`, `getTopVehicles`, `getUpcomingMaintenance`, `getRecentTrips`, `getBusinessSummary`  
Analytics: `getCharts`, `getSummary`, `getReports`, `exportReport` + helper `downloadBlob`

### adminService (`services/admin.service.ts`)
Users, roles, permissions, company, appearance, statistics, security, notifications, profile, password, audit list/export — methods listed in §7 inventory from codebase exploration.

## A.11 Hook Inventory Patterns

| Hook file | Pattern |
|-----------|---------|
| `use-fleet.ts` | `fleetKeys` + list/detail/stats queries + CRUD/status mutations |
| `use-drivers.ts` | parallel to fleet |
| `use-trips.ts` | lifecycle mutations: dispatch/start/complete/cancel |
| `use-maintenance.ts` | lifecycle + `useUploadMaintenanceAttachments` |
| `use-fuel.ts` / `use-expenses.ts` | CRUD + statistics (+ fuel comparison) |
| `use-dashboard.ts` | dashboard + analytics query hooks |
| `use-admin.ts` | settings/admin cluster |
| `use-permissions.ts` | `{ permissions, can, isLoading, hasFullAccess }` |
| `use-health.ts` | optional health query (disabled by default) |

## A.12 Backend Folder Tree (Expanded)

```
apps/backend/src/
├── main.ts
├── app.module.ts
├── health.controller.ts
├── common/
│   ├── decorators/
│   ├── filters/all-exceptions.filter.ts
│   ├── guards/ (jwt, permissions, roles + tests)
│   ├── interceptors/response.interceptor.ts
│   └── mixins/soft-delete.mixin.ts
├── config/ (env validation)
├── database/
│   └── seeds/ (run-seed.ts, fuel-expense.seed.ts, wipe-db.ts, …)
├── schemas/
│   ├── user.schema.ts
│   ├── role.schema.ts
│   ├── permission.schema.ts
│   ├── audit-log.schema.ts
│   ├── app-settings.schema.ts
│   ├── fuel.schema.ts
│   ├── expense.schema.ts
│   └── *-re-exports for vehicle/driver/trip/maintenance
└── modules/
    ├── auth/ (controller, service, dto, strategy)
    ├── users/
    ├── roles/
    ├── permissions/
    ├── rbac/
    ├── settings/ (settings, profile, security controllers)
    ├── audit/
    ├── notifications/
    ├── fleet/ (controller, service, repository, schema, dto, tests, validators)
    ├── vehicle/ (schema bridge)
    ├── driver/
    ├── trip/
    ├── maintenance/
    ├── fuel/
    ├── expense/
    ├── integration/ (reference-validation, cost-calculation)
    ├── dashboard/
    └── analytics/
```

## A.13 Frontend Folder Tree (Expanded)

```
apps/frontend/src/
├── app/ (see §7.1)
├── components/
│   ├── charts/
│   ├── dashboard/
│   ├── data-table/
│   ├── drivers/
│   ├── expenses/
│   ├── feedback/
│   ├── filters/
│   ├── fleet/
│   ├── forms/
│   ├── fuel/
│   ├── layout/ (navbar, sidebar, protected-shell, theme-toggle, …)
│   ├── maintenance/
│   ├── settings/
│   ├── trips/
│   └── ui/
├── constants/ (nav, form, status, mock-data)
├── hooks/
├── services/ (api.ts, auth, fleet, drivers, trip, maintenance, fuel-expense, dashboard, admin)
├── store/index.ts
├── providers/app-providers.tsx
├── utils/ (form-validation, form-sanitize, form-register, date, cn, notify, …)
├── types/
└── lib/
```

## A.14 Example Documents (Illustrative)

### Vehicle document (truncated)

```json
{
  "_id": "665f0c2a1a2b3c4d5e6f7001",
  "vehicleId": "VH-1001",
  "registrationNumber": "MH12AB1234",
  "make": "Tata",
  "model": "LPO 1618",
  "vehicleType": "BUS",
  "fuelType": "DIESEL",
  "maxCapacity": 8000,
  "mileage": 120450,
  "status": "AVAILABLE",
  "isDeleted": false,
  "country": "India"
}
```

### Trip document (truncated)

```json
{
  "_id": "665f0c2a1a2b3c4d5e6f7081",
  "tripNumber": "TR-0042",
  "source": "Mumbai",
  "destination": "Pune",
  "vehicleId": "665f0c2a1a2b3c4d5e6f7001",
  "driverId": "665f0c2a1a2b3c4d5e6f7002",
  "cargoName": "Electronics",
  "cargoWeight": 1200,
  "cargoType": "FRAGILE",
  "status": "DRAFT",
  "plannedDistance": 150,
  "estimatedRevenue": 18000,
  "isDeleted": false
}
```

### Fuel log document (truncated)

```json
{
  "_id": "665f0c2a1a2b3c4d5e6f80aa",
  "vehicleId": "VH-1001",
  "tripId": "TR-0042",
  "driverId": "EMP-1001",
  "fuelStation": "IOCL Andheri",
  "fuelType": "DIESEL",
  "quantity": 40.5,
  "pricePerLiter": 92.1,
  "totalCost": 3730.05,
  "filledAt": "2026-07-12T10:30:00.000Z",
  "isDeleted": false
}
```

## A.15 Error Response Shape (Typical)

Via `AllExceptionsFilter`, clients should expect a structured error object including HTTP status and message (and validation details when applicable). Controllers rely on NestHTTP exceptions: `BadRequestException`, `UnauthorizedException`, `ForbiddenException`, `NotFoundException`.

Representative cases:

| Scenario | HTTP | Example message pattern |
|----------|------|-------------------------|
| Dispatch illegal status | 400 | `Cannot dispatch trip in status COMPLETED` |
| Missing permission | 403 | Forbidden / insufficient permissions |
| Bad access token | 401 | Unauthorized |
| Soft-deleted / missing trip | 404 | `Trip {id} not found` |
| Refresh reuse | 401 | reuse detected / invalid refresh (service messaging) |
| Unknown DTO field | 400 | whitelist validation error |

## A.16 Operator Scoping Rules (Fuel & Expense)

When the authenticated user’s roles include `OPERATOR` and do **not** include elevated roles (`SUPER_ADMIN`, `ADMIN`, `FLEET_MANAGER`, `FINANCIAL_ANALYST`):

- List endpoints filter to records where `createdBy` equals `user.sub`.
- Read/update/delete assert ownership the same way.
- Elevated roles see unscoped data (subject to their permissions).

This implements least-privilege operational data entry without multi-tenancy.

## A.17 Integration Module Responsibilities

| Service | Responsibility |
|---------|----------------|
| `ReferenceValidationService` | Resolve/validate fuel & expense string refs: vehicle → `Vehicle.vehicleId`, driver → `Driver.employeeCode`, trip → `Trip.tripNumber` (non-deleted) |
| `CostCalculationService` | Aggregate operational costs across fuel, approved expenses, and related maintenance where implemented |

Trip and Maintenance modules do **not** use string business IDs for vehicle linkage; they use ObjectIds end-to-end.

## A.18 Shared-Types Enum Parity Checklist

Maintainers must keep `packages/shared-types` enums aligned with Mongoose schema enums:

- RoleCode, UserAccountStatus
- VehicleType, VehicleStatus, FuelType
- DriverStatus, LicenseCategory, BloodGroup
- TripStatus, CargoType
- MaintenanceStatus, MaintenanceType, MaintenancePriority
- ExpenseStatus, ExpenseType
- AuditAction, AuditModule (as used by audit schema)
- ApiResponse / PaginationMeta

Drift between FE labels and BE enums is a defect.

## A.19 Manual Test Scripts (QA Smoke)

1. **Auth:** login → access dashboard → wait/force 401 → confirm refresh → logout → confirm refresh fails.
2. **Dispatch:** create DRAFT trip with available assets → dispatch → verify vehicle/driver ON_TRIP → start → complete with actuals → verify AVAILABLE.
3. **Maintenance block:** put vehicle in maintenance IN_PROGRESS → attempt dispatch → expect 400.
4. **Fuel math:** create fuel qty 10, price 10 → expect totalCost 100.00.
5. **Expense approve:** create PENDING → PATCH APPROVED → confirm statistics approved total increases.
6. **RBAC:** login as VIEWER → attempt POST /vehicles → 403; sidebar hides create entry points.
7. **Soft delete:** delete vehicle → list excludes it; direct GET returns 404/not available per service rules.

## A.20 Traceability — User Stories to Technical Artifacts

| User Story | Primary technical artifacts |
|------------|----------------------------|
| US-AUTH-01…04 | AuthController, JwtStrategy, api.ts interceptors, ProtectedShell |
| US-DASH-01…04 | DashboardController, dashboard.service.ts (FE), dashboard components |
| US-VEH-01…04 | VehicleController, fleetApi, fleet pages/forms |
| US-DRV-01…04 | DriverController, driversApi, driver pages |
| US-TRP-01…05 | TripController lifecycle, Dispatch/Complete/Cancel dialogs |
| US-MNT-01…04 | MaintenanceController, CloseMaintenanceDialog, attachments upload |
| US-FUL-01…03 | FuelController, fuel forms, totalCost hook |
| US-EXP-01…03 | ExpenseController, status update approve path |
| US-RPT-01…03 | AnalyticsController, reports page export |
| US-SET-01…05 | Users/Roles/Settings/Audit controllers + settings pages |
| US-NTF-01 | NotificationsController prefs only |

## A.21 Traceability — Success Criteria (SC-*) 

| SC ID | Verification approach |
|-------|----------------------|
| SC-01 Permission-filtered access | Sidebar filter + API 403 tests |
| SC-02 Dispatch → ON_TRIP | trip.service.dispatchTrip + vehicle/driver status |
| SC-03 Complete → AVAILABLE | completeTrip side effects |
| SC-04 Maintenance → MAINTENANCE | maintenance start/status sync |
| SC-05 Fuel totalCost | schema pre-save unit assertions |
| SC-06 REPORTS:EXPORT | export endpoints + FE blob download |
| SC-07 Soft-delete exclusion | repository filters in list aggregations |

## A.22 Non-Goals Restatement (Accuracy Guardrails)

The following must **not** be described as implemented capabilities in training materials derived from this SRS:

1. Dockerized one-command deploy  
2. API rate limiting  
3. WebSocket GPS tracking  
4. Email/SMS/push notification delivery  
5. Public registration / invite self-serve  
6. Multi-tenant org isolation  
7. Frontend Jest/Playwright suite  
8. Enforced password lockout on failed login (fields only)  
9. Distinct HTTP route exclusively guarded by `EXPENSE:APPROVE`  
10. Role create / permission update REST endpoints  

## A.23 Glossary Extensions

| Term | Meaning in TransitOps |
|------|------------------------|
| DISPATCHABLE_STATUSES | Internal allow-list for dispatch transition (includes DRAFT) |
| STARTABLE_STATUSES | Allow-list for start (DISPATCHED) |
| COMPLETABLE_STATUSES | Allow-list for complete (IN_PROGRESS, and as coded) |
| CANCELLABLE_STATUSES | Allow-list for cancel |
| Single-flight refresh | Frontend mutex so concurrent 401s share one refresh call |
| Business summary period | `daily` \| `weekly` \| `monthly` dashboard/analytics query |
| Privilege checklist | Settings UI for editing role permission arrays |
| Permission matrix | Cross-table of roles vs permission codes from API |

## A.24 Version Alignment Statement

| Artifact | Version string |
|----------|----------------|
| SRS document | 1.0.0 (12 July 2026) |
| FRD companion | 1.0.0 |
| Root package.json | 0.1.0 (monorepo package version) |
| Swagger DocumentBuilder | 0.1.0 |
| NestJS major | 11 |
| Next.js | 15.2.4 |

Product documentation versions (SRS/FRD 1.0.0) intentionally differ from npm package `0.1.0` and Swagger `0.1.0`; implementers should not conflate them.

---


# 14. Future Enhancements

| Item | Notes |
|------|-------|
| Docker / Compose | Documented as out of scope today |
| Rate limiting | Absent; recommended for auth endpoints |
| Enforce login lockout | Fields exist; wire to security settings |
| Notification delivery | Prefs exist; workers do not |
| Page-level FE RBAC | Only sidebar filtering today |
| httpOnly cookie auth | Reduce XSS token exposure |
| GPS / realtime | Out of scope |
| Multi-tenancy | Out of scope |
| Frontend test suite | Currently zero automated FE tests |
| Dedicated EXPENSE:APPROVE route | Optional hardening vs UPDATE |
| ROLES:CREATE / PERMISSIONS:UPDATE APIs | Catalog-only today |

---

# 15. Appendix

## 15.1 Role Catalog

`SUPER_ADMIN`, `ADMIN`, `FLEET_MANAGER`, `DISPATCHER`, `SAFETY_OFFICER`, `FINANCIAL_ANALYST`, `OPERATOR`, `VIEWER`

## 15.2 Ports & URLs

| Service | Port / path |
|---------|-------------|
| Frontend | 3000 |
| API | 4000 `/api` |
| Swagger | 4000 `/api/docs` |
| Health | 4000 `/api/health` |
| Uploads | 4000 `/uploads` |

## 15.3 ID Strategy Cheat Sheet

| Domain | Path `:id` | Cross-ref style |
|--------|------------|-----------------|
| Vehicle CRUD | ObjectId | Business `vehicleId` on fuel/expense |
| Driver CRUD | ObjectId | `employeeCode` on fuel/expense |
| Trip CRUD | ObjectId | `tripNumber` on fuel/expense |
| Maintenance | ObjectId | ObjectId vehicleId |
| Fuel/Expense docs | ObjectId | string foreign business keys |

## 15.4 FRD Traceability Matrix

| FRD section / IDs | SRS sections |
|-------------------|--------------|
| §1 BG/BO/SC | §1 Scope, §2 Overview, §6 Status sync |
| §3 Roles | §9.3, §15.1 |
| §4.1 Auth | §3.0, §2.10, §5.2, §6.2 |
| §4.2 Dashboard | §3.7, §5.7.9, §7.3 |
| §4.3 Vehicle | §3.1, §4.2.6, §5.7.3 |
| §4.4 Driver | §3.2, §4.2.7, §5.7.4 |
| §4.5 Trip | §3.3, §4.2.8, §5.7.5, §6.1, §6.3 |
| §4.6 Maintenance | §3.4, §4.2.9, §5.7.6, §6.4 |
| §4.7 Fuel | §3.5, §4.2.10, §5.4, §5.7.7 |
| §4.8 Expense | §3.6, §4.2.11, §5.5, §5.7.8 |
| §4.9 Reports | §3.8, §5.7.10 |
| §4.10 Settings | §3.9, §5.7.11–14 |
| §4.11 Notifications | §3.9 prefs-only |
| §5 VR/DV/TD/MN/FL/EX/RB… | §6.8 |
| §6 US-* | Implemented via modules in §3 + routes §7 |
| §7 AC-* | §11.4 |
| §8 NFR | §9, §10 |
| §10 C-01…09 | Constraints: Nest/Next/Mongo stack; no Docker/rate limit |
| §11 RK-* | Reflected in §9.2 residual gaps |
| §12 Future | §14 |

## 15.5 Document Control

| Item | Value |
|------|-------|
| Document ID | TO-SRS-001 |
| Version | 1.0.0 |
| Date | 12 July 2026 |
| Companion | TO-FRD-001 / `FRD.md` |
| Classification | Internal / Customer Technical |
| Next review | On major module change or version bump |

---

*End of Software Requirements Specification — TransitOps v1.0.0*
