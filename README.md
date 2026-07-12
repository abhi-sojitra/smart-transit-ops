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
- Trips UI: http://localhost:3000/trips

## Seed (roles, admin, fleet, 50 trips)

```bash
yarn workspace @transitops/backend seed
```

## Trip Dispatcher

See [`apps/backend/src/modules/trip/README.md`](apps/backend/src/modules/trip/README.md) for APIs, RBAC, business rules, and workflow.

## Scripts

| Command | Description |
|---------|-------------|
| `yarn build` | Build shared-types, backend, frontend |
| `yarn lint` | Lint all workspaces |
| `yarn typecheck` | Typecheck all workspaces |
| `yarn format` | Prettier format |
| `yarn workspace @transitops/backend test:trip` | Trip module unit tests |

## Notes

- Trip Dispatcher is fully wired (API + UI). Lean Vehicle/Driver/Maintenance services support trip business rules.
- Other module screens may still use mock data until their full modules are merged.
