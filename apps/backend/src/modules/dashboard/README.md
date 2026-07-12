# Dashboard & Analytics Module

Enterprise operations dashboard for TransitOps. All metrics are computed with MongoDB aggregation pipelines — no document-level business logic loops.

## Architecture

```text
DashboardModule
  ├── DashboardController   /api/dashboard/*
  ├── DashboardRepository   cross-collection aggregations
  ├── StatisticsService     overview cards / finance
  ├── DashboardService      activity, alerts, charts, leaderboards
  └── ReportService         CSV / PDF export

AnalyticsModule
  ├── AnalyticsController   /api/analytics/*
  └── AnalyticsService      thin facade over dashboard + reports
```

Existing Vehicle, Driver, Trip, Maintenance, Fuel, and Expense modules are **not modified**. This module registers the same Mongoose schemas for read-only aggregations.

## APIs

### Dashboard

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/dashboard/overview` | Fleet, drivers, trips, maintenance, fuel, expense, finance |
| GET | `/api/dashboard/recent-activity` | Unified timeline (`?limit=20`) |
| GET | `/api/dashboard/charts` | Utilization, revenue, expense, fuel, trips, ROI |
| GET | `/api/dashboard/alerts` | License, maintenance, delays, capacity, fuel, suspensions |
| GET | `/api/dashboard/top-drivers` | Leaderboard (`?limit=10`) |
| GET | `/api/dashboard/top-vehicles` | ROI leaderboard |
| GET | `/api/dashboard/upcoming-maintenance` | Scheduled work |
| GET | `/api/dashboard/recent-trips` | Latest trips |
| GET | `/api/dashboard/business-summary` | `?period=daily\|weekly\|monthly` |
| GET | `/api/dashboard/reports/export` | `?period=&format=csv\|pdf` |

### Analytics

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/analytics/charts` | `?months=6` chart datasets |
| GET | `/api/analytics/summary` | Period summary |
| GET | `/api/analytics/reports` | Structured report payload |
| GET | `/api/analytics/reports/export` | CSV / PDF download |

All endpoints require JWT + RBAC read roles.

## Aggregation highlights

- Status counts via `$group`
- Monthly trends via `$dateToString`
- Activity feed via `$unionWith` across trips, maintenance, fuel, expenses, drivers, vehicles
- Top vehicles ROI via `$lookup` into fuel / expense / maintenance cost collections
- Over-capacity alerts via `$lookup` + `$expr` against vehicle `maxCapacity`

## Tests

```bash
yarn workspace @transitops/backend test --testPathPatterns='dashboard|analytics'
```

## Frontend

- `/dashboard` — operations overview
- `/analytics` — charts & trends
- `/reports` — period summary + CSV/PDF export
