# Reports & Business Intelligence Module

Single source of truth for TransitOps analytics reporting. All KPIs are computed with MongoDB aggregation pipelines in `ReportsRepository`. Existing Dashboard module is left unchanged; this module can be consumed by other services via `ReportsService` export.

## APIs

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/reports/catalog` | Report catalog |
| GET | `/api/reports/executive` | Executive summary |
| GET | `/api/reports/fleet` | Fleet report |
| GET | `/api/reports/drivers` | Driver report |
| GET | `/api/reports/vehicles` | Vehicle report |
| GET | `/api/reports/trips` | Trip report |
| GET | `/api/reports/maintenance` | Maintenance report |
| GET | `/api/reports/fuel` | Fuel report |
| GET | `/api/reports/expenses` | Expense report |
| GET | `/api/reports/financial` | Financial report |
| GET | `/api/reports/profitability` | Profitability report |
| GET | `/api/reports/schedules` | Scheduled jobs |
| POST | `/api/reports/export` | Export CSV / PDF / Excel |
| POST | `/api/reports/schedule` | Create scheduled report |

Query filters: `startDate`, `endDate`, `vehicleId`, `driverId`, `status`, `fuelType`, `expenseCategory`, `maintenanceType`, `vendor`, `route`, `region`, `search`, pagination.

## RBAC

- Admin / Super Admin: full access
- Fleet Manager / Dispatcher: operational reports
- Financial Analyst: executive, financial, profitability, fuel, expenses
- Safety Officer: drivers, maintenance, fleet, vehicles, executive
- Operator: driver performance report only

## Structure

```
reports/
  controller/
  service/          # ReportsService + insights
  repository/       # Aggregation pipelines
  aggregation/      # Shared match helpers
  export/           # CSV / PDF / Excel
  schema/           # report_schedules collection
  dto/
  tests/
```

## Frontend

Pages under `apps/frontend/src/app/(protected)/reports/*` with shared BI components, TanStack Query hooks, and Sonner toasts for export/schedule actions.
