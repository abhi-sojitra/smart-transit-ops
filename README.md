# TransitOps

**Smart Transport Operations Platform**

An enterprise-grade fleet management platform that digitizes transport operations by managing vehicles, drivers, trips, maintenance, fuel, expenses, reports, analytics, and role-based access control in one centralized application.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![JWT](https://img.shields.io/badge/Auth-JWT%20%2B%20RBAC-2F54EB)](#security)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

![TransitOps Banner](docs/banner.png)

---

## Table of Contents

- [About the Project](#about-the-project)
- [Features](#features)
- [Screenshots](#screenshots)
- [Demo](#demo)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Folder Structure](#folder-structure)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [User Roles](#user-roles)
- [Business Rules](#business-rules)
- [API Documentation](#api-documentation)
- [Reports](#reports)
- [Dashboard](#dashboard)
- [Performance](#performance)
- [Security](#security)
- [Testing](#testing)
- [Project Statistics](#project-statistics)
- [Future Enhancements](#future-enhancements)
- [Contributing](#contributing)
- [License](#license)
- [Authors](#authors)
- [Acknowledgements](#acknowledgements)

---

## About the Project

**TransitOps** is a full-stack **Fleet & Transport Operations** SaaS built as a Yarn monorepo with a Next.js operations console and a NestJS API.

### Problem

Transport businesses still run on spreadsheets, phone calls, and disconnected tools. That leads to:

- Double-booked vehicles and drivers
- Missed maintenance and expired licenses
- Unclear fuel and expense cost
- Weak visibility into profit, utilization, and ROI

### Solution

TransitOps centralizes day-to-day operations and executive reporting:

- Assign only available, compliant assets
- Automate vehicle/driver status across trip and maintenance workflows
- Track fuel, expenses, and maintenance cost against revenue
- Surface KPIs, charts, and exportable business reports for management

### Target users

| Persona | How they use TransitOps |
|---------|-------------------------|
| Fleet managers | Vehicles, drivers, dispatch, maintenance |
| Dispatchers | Trip creation, assignment, lifecycle |
| Safety officers | Licenses, maintenance, compliance |
| Financial analysts | Fuel, expenses, financial / profitability reports |
| Operators / drivers | Assigned work and performance visibility |
| Admins | Users, roles, permissions, company settings |

### Business benefits

- Fewer dispatch conflicts through status-aware assignment
- Faster decisions with live KPIs and BI reports
- Clear operational cost (fuel + maintenance + expenses)
- Audit-friendly RBAC and soft-delete data model

---

## Features

### Authentication

- JWT access tokens with short TTL
- Refresh-token rotation
- Role-based access control (RBAC)
- Seeded demo accounts for every major role

### Fleet Management

- Vehicle CRUD with compliance dates and **maximum load capacity**
- Unique registration / vehicle ID enforcement
- Driver profiles, license status, safety score, availability

### Trip Management

- Draft → Dispatch → In Progress → Complete / Cancel workflow
- Available-only vehicle & driver dropdowns
- Cargo weight vs vehicle capacity validation
- Automatic status sync on dispatch, complete, and cancel

### Maintenance

- Preventive and corrective work orders
- Start / complete / cancel workflow
- Vehicle moved to **In Shop** (`MAINTENANCE`) while active
- Restored to **Available** on complete/cancel (unless Retired)

### Fuel & Expense

- Fuel logs with quantity, cost, and optional trip/driver links
- Expense tracking with approval status and categories
- Reference validation against existing vehicles / trips / drivers

### Dashboard & Analytics

- Fleet, driver, trip, and cost overview cards
- Recharts visualizations
- Alerts, leaderboards, activity timeline
- Period business summary export (CSV / PDF)

### Reports & Business Intelligence

- Executive, fleet, driver, vehicle, trip, maintenance, fuel, expense, financial, and profitability reports
- MongoDB aggregation pipelines (server-side KPIs)
- Generated business insights (not hardcoded copy)
- CSV / PDF / Excel export
- Scheduled report jobs (`daily` / `weekly` / `monthly` / `yearly`)

### Settings & Administration

- User management
- Roles & permissions matrix
- Company / security / notification preferences
- Profile and audit visibility

---

## Screenshots

> Add product screenshots under `docs/` using the filenames below.

| Screen | Path |
|--------|------|
| Login | `docs/login.png` |
| Dashboard | `docs/dashboard.png` |
| Fleet / Vehicles | `docs/vehicle.png` |
| Drivers | `docs/driver.png` |
| Trips | `docs/trip.png` |
| Maintenance | `docs/maintenance.png` |
| Fuel & Expenses | `docs/fuel.png` |
| Reports | `docs/reports.png` |

```markdown
![Login](docs/login.png)
![Dashboard](docs/dashboard.png)
![Fleet](docs/vehicle.png)
![Drivers](docs/driver.png)
![Trips](docs/trip.png)
![Maintenance](docs/maintenance.png)
![Fuel](docs/fuel.png)
![Reports](docs/reports.png)
```

---

## Demo

| Resource | URL / note |
|----------|------------|
| Live Demo (Frontend) | _Add deployed URL_ |
| Live Demo (Backend) | _Add deployed API URL_ |
| Local Frontend | http://localhost:3000 |
| Local Backend | http://localhost:4000/api |
| Swagger | http://localhost:4000/api/docs |
| Demo Video | _Add walkthrough link_ |

### Seeded login accounts

| Email | Password | Role |
|-------|----------|------|
| `admin@transitops.com` | `Admin@12345` | Super Admin |
| `fleet@transitops.com` | `Fleet@12345` | Fleet Manager |
| `finance@transitops.com` | `Finance@12345` | Financial Analyst |
| `driver@transitops.com` | `Driver@12345` | Operator |
| `safety@transitops.com` | `Safety@12345` | Safety Officer |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React, TypeScript, Tailwind CSS, Shadcn UI, Framer Motion |
| Backend | NestJS 11, TypeScript, Mongoose |
| Database | MongoDB |
| Auth | JWT (access + refresh), Passport JWT, bcrypt |
| Shared contracts | `@transitops/shared-types` workspace package |
| State / data fetching | Zustand, TanStack Query, Axios |
| Forms & validation | React Hook Form, Zod (FE), class-validator (BE) |
| Charts | Recharts |
| API docs | Swagger (`@nestjs/swagger`) |
| Testing | Jest (NestJS unit tests) |
| Tooling | Yarn workspaces, ESLint, Prettier, concurrently |
| Containerization | _Docker Compose not checked in yet — see Future Enhancements_ |

---

## Architecture

TransitOps is a **Yarn monorepo**:

```
apps/frontend   → Next.js App Router operations console
apps/backend    → NestJS modular API
packages/*      → shared-types, eslint-config, tsconfig
```

### Backend design

- **Modular NestJS** domains (`auth`, `fleet`, `driver`, `trip`, `maintenance`, `fuel`, `expense`, `dashboard`, `reports`, `settings`, …)
- **Repository pattern** for persistence and aggregation pipelines
- **Service layer** for business rules and cross-module orchestration
- Controllers expose REST + Swagger; global validation + response interceptor

### Frontend design

- Protected App Router segments under `app/(protected)/`
- Feature components + TanStack Query hooks + typed API services
- Shared UI primitives (Shadcn) and domain badges / forms

### Cross-cutting concerns

- JWT authentication + role guards
- Soft deletes (`isDeleted` / `deletedAt`) across operational collections
- MongoDB aggregations for dashboard & BI (no report math on the client)

---

## Folder Structure

```text
smart-transit-ops/
├── apps/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── common/              # guards, decorators, interceptors
│   │   │   ├── config/              # env validation
│   │   │   ├── database/seeds/      # seed scripts
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   ├── fleet/
│   │   │   │   ├── driver/
│   │   │   │   ├── trip/
│   │   │   │   ├── maintenance/
│   │   │   │   ├── fuel/
│   │   │   │   ├── expense/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── reports/
│   │   │   │   ├── settings/
│   │   │   │   └── ...
│   │   │   ├── schemas/             # shared mongoose schemas
│   │   │   └── main.ts
│   │   └── package.json
│   └── frontend/
│       ├── src/
│       │   ├── app/
│       │   │   ├── (public)/login/
│       │   │   └── (protected)/
│       │   │       ├── dashboard/
│       │   │       ├── fleet/
│       │   │       ├── drivers/
│       │   │       ├── trips/
│       │   │       ├── maintenance/
│       │   │       ├── fuel/ · expenses/
│       │   │       ├── reports/
│       │   │       ├── analytics/
│       │   │       └── settings/
│       │   ├── components/
│       │   ├── hooks/
│       │   ├── services/
│       │   ├── store/
│       │   └── types/
│       └── package.json
├── packages/
│   ├── shared-types/                # enums, DTOs, domain contracts
│   ├── eslint-config/
│   └── tsconfig/
├── docs/                            # banner + screenshots
├── package.json                     # workspace scripts
└── README.md
```

---

## Installation

### Prerequisites

- Node.js **≥ 20**
- Yarn **1.x**
- MongoDB (local or Atlas)

### 1. Clone

```bash
git clone https://github.com/<your-org>/smart-transit-ops.git
cd smart-transit-ops
```

### 2. Install dependencies

```bash
yarn install
```

### 3. Configure environment

```bash
cp apps/backend/.env.example apps/backend/.env
# Frontend (create if missing):
# apps/frontend/.env.local
# NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

### 4. Seed the database

```bash
yarn workspace @transitops/backend seed
# optional demo fuel/expense volume:
yarn workspace @transitops/backend seed:all
```

### 5. Run development

```bash
yarn dev
```

| App | URL |
|-----|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:4000/api |
| Swagger | http://localhost:4000/api/docs |

### 6. Production build

```bash
yarn build
yarn workspace @transitops/backend start:prod
yarn workspace @transitops/frontend start
```

### Docker

Docker / Compose packaging is planned (see [Future Enhancements](#future-enhancements)). Today the stack runs via Yarn workspaces against MongoDB.

---

## Environment Variables

### Backend (`apps/backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | No | `development` \| `production` \| `test` (default `development`) |
| `PORT` | No | API port (default `4000`) |
| `MONGODB_URI` | **Yes** | MongoDB connection string |
| `JWT_SECRET` | **Yes** | Access token secret (≥ 16 chars) |
| `JWT_EXPIRES_IN` | No | Access TTL (default `15m`) |
| `JWT_REFRESH_SECRET` | **Yes** | Refresh token secret (≥ 16 chars) |
| `JWT_REFRESH_EXPIRES_IN` | No | Refresh TTL (default `7d`) |
| `CORS_ORIGINS` | No | Allowed origins (e.g. `http://localhost:3000`) |
| `SEED_ADMIN_EMAIL` | No | Seed admin email |
| `SEED_ADMIN_PASSWORD` | No | Seed admin password |

### Frontend (`apps/frontend/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | No | API base URL (default `http://localhost:4000/api`) |

---

## User Roles

Defined in `@transitops/shared-types` as `RoleCode`:

| Role | Typical access |
|------|----------------|
| **SUPER_ADMIN** / **ADMIN** | Full platform access |
| **FLEET_MANAGER** | Fleet, drivers, trips, maintenance, operational reports |
| **DISPATCHER** | Trip dispatch and operational views |
| **SAFETY_OFFICER** | Maintenance, driver compliance, related reports |
| **FINANCIAL_ANALYST** | Fuel, expenses, financial / profitability reports |
| **OPERATOR** | Driver-oriented operational access |
| **VIEWER** | Read-only visibility |

Guards: `JwtAuthGuard` + `RolesGuard` with `@Roles(...)` on controllers.

---

## Business Rules

TransitOps enforces operational integrity across modules:

1. **Vehicle registration numbers are unique** (schema index + create/update conflict checks).
2. **Retired** and **In Shop (`MAINTENANCE`)** vehicles cannot be dispatched or listed as available.
3. Drivers cannot be assigned when **suspended**, **license expired**, **soft-deleted**, or already **on trip**.
4. A vehicle already **on trip** cannot be assigned to another active trip.
5. A driver already **on trip** cannot be assigned again.
6. **Cargo weight must not exceed vehicle maximum load capacity** (frontend + backend).
7. **Dispatch** sets vehicle & driver → `ON_TRIP` (with compensating rollback if the trip update fails).
8. **Complete** restores vehicle & driver → `AVAILABLE` and stores actual distance, fuel, revenue, and duration.
9. **Cancel** restores availability when the trip had progressed past draft.
10. **Maintenance create/start** moves the vehicle to `MAINTENANCE`; **complete/cancel** restores `AVAILABLE` unless the vehicle is **Retired**.
11. Fuel/expense records must reference an existing (non-deleted) vehicle; linked trips/drivers are validated when provided.
12. Compliance expiry dates (registration / insurance / fitness) must be **after today**; last service ≤ today; next service > today; max load capacity capped at **500**.

---

## API Documentation

| Item | Value |
|------|-------|
| Base URL | `http://localhost:4000/api` |
| Swagger UI | http://localhost:4000/api/docs |
| Auth | `Authorization: Bearer <accessToken>` |
| Auth endpoints | `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout` |

Major module prefixes:

- `/vehicles` · `/drivers` · `/trips` · `/maintenance`
- `/fuel` · `/expenses`
- `/dashboard` · `/analytics` · `/reports`
- `/users` · `/roles` · `/settings`

---

## Reports

BI lives in `apps/backend/src/modules/reports` and UI under `/reports`.

| Report | Purpose |
|--------|---------|
| Executive | Revenue, cost, profit, utilization, leaders |
| Fleet | Availability, utilization, ROI signals |
| Drivers | Productivity, revenue, license risk |
| Vehicles | Per-vehicle trips, cost, revenue |
| Trips | Success rate, routes, delays |
| Maintenance | Active / overdue / vendor performance |
| Fuel | Consumption, efficiency, cost/km |
| Expenses | Categories, approvals, trends |
| Financial | P&L style operational finance |
| Profitability | Vehicle / route contribution |

Exports: **CSV**, **PDF**, **Excel**. Schedules persist in `report_schedules`.

Docs: [`apps/backend/src/modules/reports/README.md`](apps/backend/src/modules/reports/README.md)

---

## Dashboard

Route: `/dashboard` (+ `/analytics`)

- Overview KPI cards (fleet, drivers, trips, cost)
- Charts (utilization, revenue vs expense, trends)
- Alerts and top driver / vehicle leaderboards
- Unified activity timeline
- Period summary export via dashboard report endpoints

Docs: [`apps/backend/src/modules/dashboard/README.md`](apps/backend/src/modules/dashboard/README.md)

---

## Performance

- Indexed fields for status, soft-delete, dates, and unique identifiers
- Dashboard / reports use **MongoDB aggregation pipelines** (`$match`, `$group`, `$lookup`, `$facet`, …)
- List endpoints support **pagination**, filtering, and sorting
- Frontend uses TanStack Query caching to reduce duplicate network calls
- Shared TypeScript contracts avoid duplicated domain logic across apps

---

## Security

| Control | Implementation |
|---------|----------------|
| Authentication | JWT access + refresh rotation |
| Authorization | Role guards on controllers |
| Passwords | bcrypt hashing |
| Input validation | `class-validator` DTOs + Zod forms |
| HTTP hardening | Helmet |
| CORS | Configurable `CORS_ORIGINS` |
| Soft delete | Operational data retained for audit |

---

## Testing

```bash
# Backend unit tests
yarn workspace @transitops/backend test

# Example focused suites
yarn workspace @transitops/backend test --testPathPattern=modules/trip
yarn workspace @transitops/backend test --testPathPattern=modules/fleet
yarn workspace @transitops/backend test --testPathPattern=modules/reports
yarn workspace @transitops/backend test --testPathPattern=modules/maintenance

# Typecheck entire monorepo
yarn typecheck
```

Coverage is configured in `apps/backend/jest.config.ts` for core modules (fleet, trip, maintenance, dashboard, reports, fuel/expense, driver).

---

## Project Statistics

| Metric | Value (approx.) |
|--------|------------------|
| Backend modules | **15+** (`auth`, `fleet`, `driver`, `trip`, `maintenance`, `fuel`, `expense`, `dashboard`, `reports`, `settings`, …) |
| Nest controllers | **15** |
| Frontend App Router pages | **40+** |
| User roles | **8** |
| Core business rules highlighted | **12+** |
| Shared package | `@transitops/shared-types` |
| Local ports | Frontend `3000` · API `4000` |

---

## Future Enhancements

- [ ] GPS / live vehicle tracking
- [ ] Native mobile apps for drivers
- [ ] Push notifications for dispatch & compliance
- [ ] AI-assisted route optimization
- [ ] Predictive maintenance scoring
- [ ] Multi-tenant / multi-company isolation
- [ ] Real-time websockets for ops boards
- [ ] Official Docker + Compose deployment pack
- [ ] Wire Dashboard KPIs to consume `ReportsService` as the single analytics source of truth

---

## Contributing

Contributions are welcome.

### Branch strategy

- `main` — stable
- `feat/<area>` — features
- `fix/<area>` — bug fixes
- `chore/<area>` — tooling / docs

### Commit convention

Use concise, present-tense messages:

```text
feat(reports): add executive aggregation endpoints
fix(trip): restore driver status on cancel
docs: refresh root README for hackathon submission
```

### Coding standards

- TypeScript strictness as configured in the monorepo
- Prefer existing module patterns (controller → service → repository)
- Do not duplicate business logic across modules — reuse services
- Run `yarn typecheck` and relevant Jest suites before opening a PR

### Pull request process

1. Fork / branch from the latest base branch
2. Keep PRs focused and reviewable
3. Include screenshots for UI changes
4. Note any seed / migration / env updates
5. Ensure CI / local tests pass

---

## License

This project is licensed under the **MIT License** — see [`LICENSE`](./LICENSE).

---

## Authors

Built for enterprise fleet operations demos, hackathons, and portfolio showcases.

| Role | Credit |
|------|--------|
| Product & Engineering | TransitOps contributors |
| Architecture | NestJS modular API + Next.js operations console |

---

## Acknowledgements

- Hackathon / portfolio reviewers evaluating full-stack system design
- NestJS, Next.js, MongoDB, Tailwind, Shadcn UI, TanStack Query, Recharts, and the broader open-source community
- Internal module READMEs under `apps/backend/src/modules/*/README.md` for domain-level detail

---

<p align="center">
  <strong>TransitOps</strong> — Smart Transport Operations Platform<br/>
  Built with TypeScript · NestJS · Next.js · MongoDB
</p>
