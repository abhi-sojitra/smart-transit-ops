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

## Scripts

| Command | Description |
|---------|-------------|
| `yarn build` | Build shared-types, backend, frontend |
| `yarn lint` | Lint all workspaces |
| `yarn typecheck` | Typecheck all workspaces |
| `yarn format` | Prettier format |

## Notes

- Auth login/refresh are scaffolded (NotImplemented on API; UI shell uses stub tokens).
- Module screens (Fleet, Drivers, Trips, etc.) are UI shells with mock data — no business APIs yet.
