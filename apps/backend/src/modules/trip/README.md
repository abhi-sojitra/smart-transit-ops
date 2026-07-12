# Trip Dispatcher Module

Production-ready trip management for TransitOps (NestJS + Next.js).

## Features

- Full CRUD with soft delete
- Workflow: Draft → Dispatched → In Progress → Completed / Cancelled
- Vehicle & driver assignment with capacity, license, maintenance, and availability checks
- Automatic vehicle/driver status updates on dispatch, complete, and cancel
- Search, filters, sorting, pagination, and statistics
- Swagger docs, RBAC, and unit tests

## API

Base path: `/api/trips` (Bearer JWT)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/trips` | Create draft trip |
| GET | `/trips` | List (search/filter/sort/page) |
| GET | `/trips/statistics` | Dashboard metrics |
| GET | `/trips/available/vehicles` | Available vehicles |
| GET | `/trips/available/drivers` | Available drivers |
| GET | `/trips/:id` | Trip details |
| PATCH | `/trips/:id` | Update draft |
| DELETE | `/trips/:id` | Soft delete |
| PATCH | `/trips/:id/dispatch` | Dispatch |
| PATCH | `/trips/:id/start` | Start |
| PATCH | `/trips/:id/complete` | Complete |
| PATCH | `/trips/:id/cancel` | Cancel |

Swagger: `http://localhost:4000/api/docs`

## RBAC

- **Admin / Super Admin / Fleet Manager / Dispatcher** — full CRUD + workflow
- **Operator** — read own trips; can start
- **Financial Analyst** — read + statistics/revenue
- **Safety Officer / Viewer** — read

## Business rules

- Vehicle and driver must exist and be Available
- Blocked vehicle states: Maintenance (In Shop), Retired, On Trip
- Blocked driver states: Suspended, On Trip, Expired License
- Cargo weight cannot exceed vehicle `maxCapacity`
- No multiple active trips (Draft/Dispatched/In Progress) for the same vehicle or driver
- Active maintenance blocks dispatch

## Frontend routes

- `/trips` — list + stats + actions
- `/trips/new` — create
- `/trips/[id]` — details + timeline
- `/trips/[id]/edit` — edit draft

## Seed

```bash
yarn workspace @transitops/backend seed
```

Seeds roles/admin plus vehicles, drivers, maintenance, and **50 trips**.

## Tests

```bash
yarn workspace @transitops/backend add -D jest ts-jest @types/jest @nestjs/testing
yarn workspace @transitops/backend test:trip
```

## Local run

```bash
yarn dev
```

- Frontend: http://localhost:3000/trips  
- Backend: http://localhost:4000/api/trips  

Login with seeded admin from `.env` (`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`).
