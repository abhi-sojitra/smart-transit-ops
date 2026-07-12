# TransitOps

Enterprise Fleet & Transport Management System — Yarn workspaces monorepo.

## Structure

```text
apps/frontend   Next.js App Router UI
apps/backend    NestJS API
packages/       shared-types, eslint-config, tsconfig
```

## Prerequisites

- Node.js 20+
- Yarn 1.x
- MongoDB (local or remote)

## Setup

```bash
yarn install
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env.local
```

## Run

```bash
# both apps
yarn dev

# individually
yarn dev:frontend
yarn dev:backend
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000/api
- Swagger: http://localhost:4000/api/docs

## Seed (roles + admin user)

```bash
yarn workspace @transitops/backend seed
```

## Fuel & Expense seed (demo entries + 50 fuel logs + 50 expenses)

```bash
# Seed everything (users first, then fuel/expense data)
yarn workspace @transitops/backend seed:all
```

### Test login accounts

| Email | Password | Role |
|-------|----------|------|
| admin@transitops.com | Admin@12345 | Super Admin |
| fleet@transitops.com | Fleet@12345 | Fleet Manager |
| finance@transitops.com | Finance@12345 | Financial Analyst |
| driver@transitops.com | Driver@12345 | Operator (Driver) |
| safety@transitops.com | Safety@12345 | Safety Officer |

### Demo searchable entries

- Fuel: `VH-1001` at Shell Highway Station
- Expense: `Highway Toll I-95` (PENDING), `Warehouse Parking Fee` (APPROVED)

See `apps/backend/FUEL_EXPENSE_README.md` for full module documentation.

## Scripts

| Command | Description |
|---------|-------------|
| `yarn build` | Build shared-types, backend, frontend |
| `yarn lint` | Lint all workspaces |
| `yarn typecheck` | Typecheck all workspaces |
| `yarn format` | Prettier format |

## Notes

- Auth login/refresh are scaffolded (NotImplemented on API; UI shell uses stub tokens).
- **Fuel & Expense Management** is fully implemented with CRUD APIs, analytics, and UI.
- Other module screens (Fleet, Drivers, Trips, etc.) are UI shells with mock data.
- If fuel/expense APIs return **404**, restart the backend so it loads the latest modules:
  ```bash
  # stop any old process on port 4000, then:
  yarn dev:backend
  ```
