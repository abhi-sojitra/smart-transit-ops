# Fuel & Expense Management Module

Production-ready fuel logging and expense tracking for TransitOps.

## Features

### Fuel
- CRUD with soft delete
- Auto-calculated total cost (`quantity × pricePerLiter`)
- Search, filters (vehicle, trip, driver, fuel type, date range), sorting, pagination
- Statistics: total cost, quantity, average cost, efficiency, monthly trends
- Vehicle fuel history and cost comparison charts

### Expenses
- CRUD with soft delete and approval status (Pending / Approved / Rejected)
- 10 expense types (Toll, Parking, Repair, Maintenance, Insurance, etc.)
- Search, filters, sorting, pagination
- Statistics by status and category with monthly trends

### Cost Calculations
- `calculateOperationalCost()` — fuel + maintenance + approved expenses
- `calculateTripCost()` — trip fuel + expenses
- `calculateVehicleCost()` — per-vehicle operational cost
- `getVehicleCostHistory()` — monthly cost breakdown

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/fuel` | Create fuel log |
| GET | `/api/fuel` | List fuel logs (paginated) |
| GET | `/api/fuel/statistics` | Fuel analytics |
| GET | `/api/fuel/:id` | Get fuel log |
| PATCH | `/api/fuel/:id` | Update fuel log |
| DELETE | `/api/fuel/:id` | Soft delete |
| POST | `/api/expenses` | Create expense |
| GET | `/api/expenses` | List expenses (paginated) |
| GET | `/api/expenses/statistics` | Expense analytics |
| GET | `/api/expenses/:id` | Get expense |
| PATCH | `/api/expenses/:id` | Update expense |
| DELETE | `/api/expenses/:id` | Soft delete |

Swagger docs: http://localhost:4000/api/docs

## RBAC

| Role | Fuel | Expenses |
|------|------|----------|
| Admin / Super Admin | Full access | Full access |
| Fleet Manager | CRUD | CRUD |
| Financial Analyst | CRUD | CRUD |
| Operator (Driver) | Create, read own | Create, read own |
| Safety Officer | Read only | Read only |
| Viewer | Read only | Read only |

## Seed Data

```bash
# Roles, admin + test users (run first)
yarn workspace @transitops/backend seed

# Demo entries + 50 fuel logs + 50 expenses
yarn workspace @transitops/backend seed:fuel-expense

# Or both in one command
yarn workspace @transitops/backend seed:all
```

### Test accounts

| Email | Password | Role |
|-------|----------|------|
| admin@transitops.com | Admin@12345 | Super Admin |
| fleet@transitops.com | Fleet@12345 | Fleet Manager |
| finance@transitops.com | Finance@12345 | Financial Analyst |
| driver@transitops.com | Driver@12345 | Operator (Driver) |
| safety@transitops.com | Safety@12345 | Safety Officer |

### Demo searchable entries

- **Fuel:** search `Shell` or filter `VH-1001`
- **Expense:** search `Highway Toll` (PENDING) or `Warehouse Parking` (APPROVED)

## Tests

```bash
yarn workspace @transitops/backend test
yarn workspace @transitops/backend test:cov
```

## Frontend Routes

| Route | Page |
|-------|------|
| `/fuel-expenses` | Cost overview with charts |
| `/fuel` | Fuel list |
| `/fuel/new` | Add fuel log |
| `/fuel/:id` | View fuel log |
| `/fuel/:id/edit` | Edit fuel log |
| `/expenses` | Expense list |
| `/expenses/new` | Add expense |
| `/expenses/:id` | View expense |
| `/expenses/:id/edit` | Edit expense |

## Tech

- **Backend:** NestJS, Mongoose, class-validator, Swagger, repository pattern
- **Frontend:** Next.js 15, TanStack Query, React Hook Form, Zod, Recharts, Sonner toasts
