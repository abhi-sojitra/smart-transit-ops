# Functional Requirements Document (FRD)

# TransitOps

**Enterprise Fleet & Transport Management System**

---

| Field | Value |
|-------|-------|
| **Document Title** | Functional Requirements Document |
| **Project Name** | TransitOps |
| **Document ID** | TO-FRD-001 |
| **Version** | 1.0.0 |
| **Status** | Released — Reflects Current Implementation |
| **Prepared By** | TransitOps Solution Architecture Team |
| **Reviewed For** | Client Handover · Hackathon Submission · Development · QA · Maintainers |
| **Date** | 12 July 2026 |
| **Classification** | Internal / Client Deliverable |
| **Source of Truth** | Repository implementation (`apps/frontend`, `apps/backend`, `packages/shared-types`) |

---

## Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 0.1.0 | 2026-07-01 | BA Team | Initial draft from product backlog |
| 0.5.0 | 2026-07-08 | Solution Architect | Aligned modules to implemented NestJS + Next.js stack |
| 1.0.0 | 2026-07-12 | Technical Writer | Production release based on live codebase inventory |
| 1.0.0-EXP | 2026-07-12 | Technical Writer | Expanded field catalogs, stories, AC, matrices, and appendices without changing scope |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Overview](#2-product-overview)
3. [User Roles](#3-user-roles)
4. [Functional Modules](#4-functional-modules)
5. [Business Rules](#5-business-rules)
6. [User Stories](#6-user-stories)
7. [Acceptance Criteria](#7-acceptance-criteria)
8. [Non-Functional Requirements](#8-non-functional-requirements)
9. [Assumptions](#9-assumptions)
10. [Constraints](#10-constraints)
11. [Risks](#11-risks)
12. [Future Scope](#12-future-scope)
13. [Appendix](#13-appendix)

---

# 1. Executive Summary

## 1.1 Business Problem

Transport and fleet operators struggle to coordinate vehicles, drivers, trips, maintenance, fuel, and expenses across disconnected spreadsheets, paper logs, and siloed tools. Common failure modes include:

- Dispatching vehicles that are already on a trip, under maintenance, or out of compliance
- Assigning drivers with expired or suspended licenses
- Incomplete visibility of operational cost (fuel + expenses + maintenance)
- Weak audit trails for administrative and financial actions
- Role sprawl without enforceable least-privilege access

TransitOps addresses these problems with a unified, role-based SaaS operations platform.

### 1.1.1 Problem Impact Matrix

| Failure Mode | Operational Impact | Financial Impact | Compliance Impact | TransitOps Control |
|--------------|--------------------|------------------|-------------------|--------------------|
| Double-booked vehicle | Missed SLA / customer delay | Rework, overtime | Contract risk | Active-trip uniqueness (TD-08) |
| Expired fitness/insurance | Roadside stoppage | Fines, downtime | Regulatory | Compliance status on vehicle |
| Expired/suspended license | Unsafe assignment | Liability exposure | Licensing law | Driver assignability checks |
| Untracked fuel/spend | Budget blind spots | Margin erosion | Audit gaps | Fuel + expense modules |
| Uncontrolled admin changes | Unauthorized access | Fraud risk | SOX-like reviews | RBAC + audit_logs |

### 1.1.2 Stakeholder Pain Points (Current Release Framing)

| Stakeholder | Pain Without TransitOps | Relieved By |
|-------------|-------------------------|-------------|
| Fleet Manager | Spreadsheet fleet registers; status unknown at dispatch time | `/fleet`, vehicle stats, available vehicles API |
| Dispatcher | Phone/radio confirmation of availability | Trip validation + available vehicles/drivers |
| Safety Officer | Manual license expiry tracking | Driver license status + maintenance scheduling |
| Financial Analyst | Receipts in email; no approval trail | Expense PENDING→APPROVED/REJECTED + reports export |
| Operator (driver-facing) | Paper fuel slips | Fuel create with auto `totalCost` |
| Admin | Ad-hoc user access | Users/roles/permissions settings |
| Viewer / executive | Delayed weekly decks | Dashboard + analytics + reports (read) |

## 1.2 Business Goals

| ID | Goal |
|----|------|
| BG-01 | Centralize fleet, driver, trip, maintenance, fuel, and expense operations in one system |
| BG-02 | Enforce safe dispatch through availability, compliance, and capacity checks |
| BG-03 | Provide financial and operational visibility via dashboard, analytics, and exportable reports |
| BG-04 | Govern access through permission-based RBAC with auditable administration |
| BG-05 | Deliver a maintainable monorepo suitable for enterprise handover and continued development |

### 1.2.1 Goal-to-Module Mapping

| Goal | Primary Modules | Supporting Modules |
|------|-----------------|--------------------|
| BG-01 | Fleet, Drivers, Trips, Maintenance, Fuel, Expenses | Dashboard, Settings |
| BG-02 | Trips | Fleet, Drivers, Maintenance |
| BG-03 | Dashboard, Analytics, Reports | Fuel, Expenses, Maintenance |
| BG-04 | Users, Roles, Permissions, Audit | Profile, Security settings |
| BG-05 | Monorepo (`apps/*`, `packages/shared-types`) | Seeds, Swagger, tests |

## 1.3 Business Objectives

| ID | Objective | Measurable Outcome |
|----|-----------|--------------------|
| BO-01 | Digitize trip lifecycle | Draft → Dispatch → Start → Complete/Cancel with automated vehicle/driver status sync |
| BO-02 | Prevent invalid assignments | Block dispatch when vehicle/driver unavailable, non-compliant, overloaded, or in active maintenance |
| BO-03 | Track operational spend | Fuel logs, expenses (with approval status), and maintenance costs contribute to cost views |
| BO-04 | Enable role-appropriate access | Eight seeded roles with default permission sets; UI nav filtered by permissions |
| BO-05 | Support operations review | Dashboard KPIs, alerts, leaderboards, analytics charts, CSV/PDF report export |

### 1.3.1 Objective Verification Approach

| Objective | Verification Artifact | Owner |
|-----------|----------------------|-------|
| BO-01 | Trip service unit tests + UI Complete/Cancel dialogs | Engineering / QA |
| BO-02 | Trip validators (`trip.validators.ts`) conflict/capacity cases | Engineering / QA |
| BO-03 | CostCalculationService + fuel/expense statistics | Finance / Engineering |
| BO-04 | `permission.catalog.ts` + PermissionsGuard specs | Admin / Engineering |
| BO-05 | Dashboard/analytics/report export endpoints + UI pages | Ops / Finance |

## 1.4 Target Users

| Persona | System Role(s) | Primary Needs |
|---------|----------------|---------------|
| System / Platform Admin | `SUPER_ADMIN`, `ADMIN` | Users, roles, permissions, company/security settings, audit |
| Fleet Manager | `FLEET_MANAGER` | Vehicles, drivers, trips, maintenance, limited fuel/reporting |
| Dispatcher | `DISPATCHER` | Trip create/dispatch/complete/cancel; view vehicles & drivers |
| Safety Officer | `SAFETY_OFFICER` | Driver safety/license updates; maintenance scheduling |
| Financial Analyst | `FINANCIAL_ANALYST` | Fuel, expenses (incl. approve), reports export |
| Driver / Field Operator | `OPERATOR` | View assigned operational data; create fuel logs; profile |
| Read-only Stakeholder | `VIEWER` | View fleet/ops/finance summaries without write access |

> **Note:** Seeded demo account `driver@transitops.com` maps to role **OPERATOR** (driver-facing operator), not a separate `DRIVER` role code.

### 1.4.1 Persona Journey Snapshot

| Persona | Typical Daily Entry | Primary Happy Path | Exit / Handoff |
|---------|---------------------|--------------------|----------------|
| Dispatcher | `/dashboard` → alerts | Create trip → dispatch → start → complete | Revenue/fuel actuals for finance |
| Fleet Manager | `/fleet` list | Update mileage; schedule maintenance | Vehicle returns AVAILABLE |
| Safety Officer | `/drivers` | Update license/safety; open maintenance | Compliance alerts clear |
| Financial Analyst | `/fuel-expenses` | Approve expenses; export report | CSV/PDF for leadership |
| OPERATOR | `/fuel/new` | Log fill with qty × price | totalCost in statistics |
| Admin | `/settings/users` | Create user + assign role | Audit log entry |

## 1.5 Expected Outcomes

1. Single source of truth for fleet assets, drivers, and trip assignments  
2. Reduced unsafe or conflicting dispatches via server-side business rules  
3. Faster operational and financial decision-making via dashboard and reports  
4. Clear auditability of administrative changes  
5. Handover-ready documentation and codebase for QA, developers, and clients  

### 1.5.1 Outcome KPIs (Implementation-Aligned)

| Outcome | Leading Indicator in Product | Lagging Indicator (Ops) |
|---------|------------------------------|-------------------------|
| Single source of truth | Soft-delete filtered lists; unique business IDs | Fewer duplicate assets/drivers |
| Safer dispatch | Rejected dispatches with conflict messages | Fewer incidents of dual assignment |
| Faster decisions | Dashboard load with parallel React Query fetches | Shorter morning briefing time |
| Auditability | `/settings/audit` + CSV export | Successful compliance reviews |
| Handover readiness | FRD + SRS + Swagger + seeds | Faster onboarding of new engineers |

---

# 2. Product Overview

## 2.1 Overview

**TransitOps** is an enterprise fleet and transport management system implemented as a Yarn workspaces monorepo:

| Layer | Technology | App Path |
|-------|------------|----------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS v4, Radix/shadcn-style UI | `apps/frontend` |
| Backend | NestJS 11, MongoDB, Mongoose 8, JWT (Passport) | `apps/backend` |
| Shared contracts | Enums, role codes, shared types | `packages/shared-types` |

The product covers authentication, dashboard analytics, fleet (vehicles), drivers, trip dispatch, maintenance, fuel, expenses, reports, and administration (settings, users, roles, permissions, notifications preferences, security, appearance, audit).

### 2.1.1 Logical Architecture (ASCII)

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser (Next.js App Router)                                   │
│  ProtectedShell → permission-filtered nav → React Query + Zustand│
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS / Bearer JWT
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  NestJS API (`/api`)  Helmet · CORS · ValidationPipe · Guards   │
│  Auth │ Fleet │ Drivers │ Trips │ Maintenance │ Fuel │ Expense  │
│  Dashboard │ Analytics │ Settings │ Users │ Roles │ Audit …     │
└────────────────────────────┬────────────────────────────────────┘
                             │ Mongoose
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  MongoDB collections (soft-delete pattern on operational docs)  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.1.2 Repository Layout (Relevant Paths)

| Path | Responsibility |
|------|----------------|
| `apps/frontend/src/app/(public)/login` | Login page |
| `apps/frontend/src/app/(protected)/*` | Authenticated App Router pages |
| `apps/frontend/src/components/*` | UI modules (fleet, trips, settings, charts) |
| `apps/frontend/src/services/*` | Axios API clients |
| `apps/backend/src/modules/*` | Nest feature modules |
| `apps/backend/src/database/seeds/*` | Roles, admin, demo users, wipe tooling |
| `packages/shared-types` | Enums and shared interfaces |

## 2.2 Purpose

Provide operators with an end-to-end digital workflow to register assets and people, plan and execute trips safely, schedule maintenance with automatic vehicle status impact, record fuel and expenses, and govern the platform through RBAC and audit logs.

### 2.2.1 Purpose Statements by Domain

| Domain | Purpose Statement |
|--------|-------------------|
| Identity | Authenticate ACTIVE users; no public registration |
| Fleet | Maintain dispatch-ready vehicle master data |
| Drivers | Maintain licensed, score-aware driver roster |
| Trips | Enforce lifecycle DRAFT→DISPATCHED→IN_PROGRESS→COMPLETED/CANCELLED |
| Maintenance | Keep vehicles roadworthy; lock status while active |
| Fuel / Expense | Capture cost events; approve expenses for analytics |
| Insights | Dashboard, analytics, CSV/PDF reports |
| Admin | Company, security, appearance, users, roles, permissions, audit |

## 2.3 Scope

### 2.3.1 In Scope (Implemented)

| Area | Scope |
|------|-------|
| Authentication | Login, JWT access + refresh rotation, logout; no public self-registration |
| Fleet | Vehicle CRUD, status, mileage, availability, statistics, soft delete |
| Drivers | Driver CRUD, status, safety score, availability, statistics, soft delete |
| Trips | Full lifecycle with availability/compliance/capacity validation and status sync |
| Maintenance | Schedule/start/complete/cancel; attachments; vehicle status automation |
| Fuel | CRUD, statistics, vehicle/trip cost helpers, vehicle comparison |
| Expenses | CRUD, status (PENDING/APPROVED/REJECTED), statistics, trip/vehicle cost |
| Dashboard | Overview, charts, alerts, activity, leaderboards, upcoming maintenance, recent trips |
| Analytics / Reports | Charts, summary, period reports, CSV/PDF export |
| Settings | Company, users, roles, permissions, notifications prefs, security, appearance, audit, profile |
| Health | Public health endpoint for API liveness |

### 2.3.2 Out of Scope (Not Implemented in Current Release)

| Area | Status |
|------|--------|
| Public user registration | Users created by admins or seeds only |
| Real-time GPS / live map tracking | Not implemented |
| AI route optimization | Not implemented |
| Push/email notification delivery engine | Preferences stored only; navbar bell is UI stub |
| Native mobile applications | Web responsive only |
| Multi-tenant isolation | Single-tenant deployment model |
| Docker/Kubernetes manifests | Not present in repository |
| API rate limiting | Not configured |

### 2.3.3 Scope Boundary Clarifications

| Topic | In Scope | Out of Scope |
|-------|----------|--------------|
| Notifications | Preference storage under settings | Delivery, inbox feed, functional navbar bell |
| Auth | Login / refresh / logout | Self-serve signup, OAuth social login |
| Files | Local `/uploads` for maintenance attachments | Cloud object storage migration |
| RBAC | Permission codes + guards | Attribute-based policies beyond ownership scoping |
| Reporting | Period reports + export | Custom report builder / BI embedding |

## 2.4 Business Benefits

| Benefit | Description |
|---------|-------------|
| Operational safety | Dispatch blocked for non-compliant or unavailable resources |
| Cost visibility | Fuel, approved expenses, and maintenance feed operational cost views |
| Accountability | Soft deletes, audit fields, and audit log module |
| Faster onboarding | Seeded roles, demo users, and Swagger at `/api/docs` |
| Maintainability | Clean NestJS modules, repository pattern, shared types package |

### 2.4.1 Benefit Realization Examples

| Benefit | Example Scenario | System Behavior |
|---------|------------------|-----------------|
| Operational safety | Dispatcher assigns vehicle with active maintenance | Conflict / validation rejection |
| Cost visibility | Analyst approves toll expense | Amount enters approved cost aggregates |
| Accountability | Admin changes role permissions | Audit activity visible under settings |
| Faster onboarding | New engineer runs seeds | Eight roles + demo users available |
| Maintainability | Frontend uses shared `TripStatus` enum | Single source for status vocabulary |

## 2.5 Success Criteria

| ID | Criterion | Verification |
|----|-----------|--------------|
| SC-01 | Authenticated users can access only permitted nav modules | Permission-filtered sidebar + API `PermissionsGuard` |
| SC-02 | Trip dispatch updates vehicle and driver to `ON_TRIP` | Integration / trip service tests + UI workflow |
| SC-03 | Trip completion restores vehicle and driver to `AVAILABLE` | Trip complete flow |
| SC-04 | Active maintenance sets vehicle to `MAINTENANCE` | Maintenance start/create rules |
| SC-05 | Fuel total cost = quantity × pricePerLiter (rounded) | Fuel service + pre-save hook |
| SC-06 | Reports export CSV/PDF for authorized users | `REPORTS:EXPORT` endpoints |
| SC-07 | Soft-deleted records excluded from operational lists | Repository filters on `isDeleted` |

### 2.5.1 Success Criteria Traceability (Summary)

| Success Criterion | Primary User Stories | Primary AC |
|-------------------|----------------------|------------|
| SC-01 | US-SET-01, US-SET-02 | AC-00-03, AC-SET-01 |
| SC-02 | US-TRP-01 | AC-TRP-01 |
| SC-03 | US-TRP-03 | AC-TRP-05 |
| SC-04 | US-MNT-02 | AC-MNT-01 |
| SC-05 | US-FUL-02 | AC-FUL-01 |
| SC-06 | US-RPT-02 | AC-RPT-01 |
| SC-07 | US-VEH-04 | AC-00-05 |

---

# 3. User Roles

TransitOps uses **permission-based RBAC**. Roles are seeded system roles (`isSystem: true`) with default permission sets. Effective access is the union of permissions on all assigned roles. `SUPER_ADMIN` holds wildcard permission `*`.

## 3.1 Role Catalog

| Role Code | Display Intent | Responsibilities |
|-----------|----------------|---------------|
| `SUPER_ADMIN` | Platform owner | Full wildcard access (`*`); bypasses permission checks |
| `ADMIN` | Organization administrator | All catalog permissions; manage users, roles, settings, audit |
| `FLEET_MANAGER` | Fleet operations lead | Manage vehicles & drivers; create/dispatch/complete/cancel trips; schedule/update maintenance; view/create fuel; dashboard & reports view |
| `DISPATCHER` | Trip coordinator | Create and control trip lifecycle; view vehicles & drivers; dashboard |
| `SAFETY_OFFICER` | Compliance & safety | View/update drivers; create/update maintenance; view reports & dashboard |
| `FINANCIAL_ANALYST` | Finance operations | Full fuel & expense ops including approve; reports view/export; dashboard |
| `OPERATOR` | Driver / field operator | View trips & vehicles; create fuel logs; manage own profile; scoped ownership on certain lists |
| `VIEWER` | Read-only stakeholder | View vehicles, drivers, trips, maintenance, fuel, expenses, dashboard, reports; profile view only |

## 3.2 Admin (`SUPER_ADMIN` / `ADMIN`)

**Responsibilities**

- Create and manage user accounts; assign/remove roles; bulk activate/deactivate/delete  
- Maintain role descriptions, clone permissions, assign users to roles  
- View permission catalog, grouped permissions, and matrix  
- Configure company profile, security policy settings, notification preferences  
- Review and export audit logs  
- Access all operational modules  

**Typical screens:** `/settings/*`, `/profile`, all operational routes  

### 3.2.1 Admin Capability Checklist

| Capability | SUPER_ADMIN | ADMIN |
|------------|:-----------:|:-----:|
| Wildcard `*` | ✓ | |
| All enumerated catalog permissions | via `*` | ✓ |
| Manage users / roles / permissions | ✓ | ✓ |
| Company / security / notifications prefs | ✓ | ✓ |
| Audit view + export | ✓ | ✓ |
| Bypass individual permission checks | ✓ | No (uses full catalog) |

## 3.3 Fleet Manager (`FLEET_MANAGER`)

**Responsibilities**

- Register and update fleet assets; manage mileage and status  
- Maintain driver roster (create/update; not default delete on drivers in seed set—see permissions table)  
- Plan, dispatch, start, complete, and cancel trips  
- Create and update maintenance work orders  
- Log fuel; view dashboard and reports  

**Typical screens:** `/fleet`, `/drivers`, `/trips`, `/maintenance`, `/fuel`, `/dashboard`, `/reports`  

### 3.3.1 Fleet Manager Seeded Permissions (Exact Codes)

`VEHICLE:VIEW|CREATE|UPDATE|DELETE`, `DRIVER:VIEW|CREATE|UPDATE`, `TRIP:VIEW|CREATE|DISPATCH|COMPLETE|CANCEL`, `MAINTENANCE:VIEW|CREATE|UPDATE`, `FUEL:VIEW|CREATE`, `DASHBOARD:VIEW`, `REPORTS:VIEW`, `PROFILE:VIEW|UPDATE`.

## 3.4 Safety Officer (`SAFETY_OFFICER`)

**Responsibilities**

- Monitor driver license and safety-related fields  
- Update driver records and safety scores (via driver update APIs when permitted)  
- Schedule and update maintenance for safety/compliance  
- Review dashboard and reports  

**Typical screens:** `/drivers`, `/maintenance`, `/dashboard`, `/reports`  

### 3.4.1 Safety Officer Seeded Permissions (Exact Codes)

`DRIVER:VIEW|UPDATE`, `MAINTENANCE:VIEW|CREATE|UPDATE`, `REPORTS:VIEW`, `DASHBOARD:VIEW`, `PROFILE:VIEW|UPDATE`.

## 3.5 Financial Analyst (`FINANCIAL_ANALYST`)

**Responsibilities**

- Create and update fuel logs and expenses  
- Approve/reject expenses via status updates (`EXPENSE:APPROVE` permission)  
- Export operational reports (CSV/PDF)  
- Analyze spend via fuel/expense charts and analytics  

**Typical screens:** `/fuel`, `/expenses`, `/fuel-expenses`, `/analytics`, `/reports`, `/dashboard`  

### 3.5.1 Financial Analyst Seeded Permissions (Exact Codes)

`FUEL:VIEW|CREATE|UPDATE`, `EXPENSE:VIEW|CREATE|UPDATE|APPROVE`, `REPORTS:VIEW|EXPORT`, `DASHBOARD:VIEW`, `PROFILE:VIEW|UPDATE`.

## 3.6 Driver / Operator (`OPERATOR`)

**Responsibilities**

- View trip and vehicle information within permission scope  
- Create fuel log entries  
- Manage personal profile and password  
- Subject to ownership scoping on trips/fuel/expenses where implemented (`createdBy === user.sub`)  

**Typical screens:** `/trips`, `/fleet` (view), `/fuel`, `/profile`  

### 3.6.1 OPERATOR Scoping Rules

| Resource | Scope Behavior |
|----------|----------------|
| Trips list/read | OPERATOR-only users limited to records they created (`createdBy === user.sub`) unless broader roles present |
| Fuel | OPERATOR-only users scoped to own `createdBy` records |
| Expenses | OPERATOR ownership scoping applies where implemented |
| Profile | Own profile view/update |

## 3.7 Dispatcher & Viewer (Additional Implemented Roles)

| Role | Key Capabilities |
|------|------------------|
| `DISPATCHER` | Trip lifecycle control; view fleet & drivers; dashboard |
| `VIEWER` | Read-only across core ops modules; no create/update/delete |

### 3.7.1 Dispatcher Seeded Permissions (Exact Codes)

`TRIP:VIEW|CREATE|DISPATCH|COMPLETE|CANCEL`, `DRIVER:VIEW`, `VEHICLE:VIEW`, `DASHBOARD:VIEW`, `PROFILE:VIEW|UPDATE`.

### 3.7.2 Viewer Seeded Permissions (Exact Codes)

`VEHICLE:VIEW`, `DRIVER:VIEW`, `TRIP:VIEW`, `MAINTENANCE:VIEW`, `FUEL:VIEW`, `EXPENSE:VIEW`, `DASHBOARD:VIEW`, `REPORTS:VIEW`, `PROFILE:VIEW`.

## 3.8 Default Permission Matrix (Seeded)

| Permission Area | Super Admin | Admin | Fleet Mgr | Dispatcher | Safety | Finance | Operator | Viewer |
|-----------------|:-----------:|:-----:|:---------:|:----------:|:------:|:-------:|:--------:|:------:|
| Wildcard `*` | ✓ | | | | | | | |
| All catalog codes | | ✓ | | | | | | |
| Vehicle CRUD | ✓ | ✓ | ✓ | View | | | View | View |
| Driver CUD | ✓ | ✓ | C/U | View | View/U | | | View |
| Trip lifecycle | ✓ | ✓ | Full | Full | | | View | View |
| Maintenance | ✓ | ✓ | V/C/U | | V/C/U | | | View |
| Fuel | ✓ | ✓ | V/C | | | V/C/U | V/C | View |
| Expense | ✓ | ✓ | | | | V/C/U/A | | View |
| Dashboard | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | | ✓ |
| Reports | ✓ | ✓ | View | | View | View+Export | | View |
| Admin modules | ✓ | ✓ | | | | | | |
| Profile | ✓ | ✓ | V/U | V/U | V/U | V/U | V/U | View |

*Legend: V=View, C=Create, U=Update, D=Delete, A=Approve. Exact codes in §5.10 and SRS.*

## 3.9 Full Permission Code Matrix (Seed Defaults)

### 3.9.1 Catalog Modules and Actions

| Module | Group | Actions |
|--------|-------|---------|
| VEHICLE | Fleet | VIEW, CREATE, UPDATE, DELETE |
| DRIVER | Fleet | VIEW, CREATE, UPDATE, DELETE |
| TRIP | Operations | VIEW, CREATE, DISPATCH, COMPLETE, CANCEL, UPDATE, DELETE |
| MAINTENANCE | Operations | VIEW, CREATE, UPDATE, DELETE, COMPLETE |
| FUEL | Finance | VIEW, CREATE, UPDATE, DELETE |
| EXPENSE | Finance | VIEW, CREATE, UPDATE, DELETE, APPROVE |
| DASHBOARD | Analytics | VIEW |
| REPORTS | Analytics | VIEW, EXPORT |
| SETTINGS | Administration | VIEW, UPDATE |
| USERS | Administration | VIEW, CREATE, UPDATE, DELETE |
| ROLES | Administration | VIEW, CREATE, UPDATE, DELETE |
| PERMISSIONS | Administration | VIEW, UPDATE |
| NOTIFICATIONS | Administration | VIEW, UPDATE |
| AUDIT | Administration | VIEW, EXPORT |
| PROFILE | Account | VIEW, UPDATE |

### 3.9.2 Role × Permission Detail Matrix

| Permission | SA | AD | FM | DI | SO | FA | OP | VW |
|------------|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| `*` | ✓ | | | | | | | |
| VEHICLE:VIEW | ✓ | ✓ | ✓ | ✓ | | | ✓ | ✓ |
| VEHICLE:CREATE | ✓ | ✓ | ✓ | | | | | |
| VEHICLE:UPDATE | ✓ | ✓ | ✓ | | | | | |
| VEHICLE:DELETE | ✓ | ✓ | ✓ | | | | | |
| DRIVER:VIEW | ✓ | ✓ | ✓ | ✓ | ✓ | | | ✓ |
| DRIVER:CREATE | ✓ | ✓ | ✓ | | | | | |
| DRIVER:UPDATE | ✓ | ✓ | ✓ | | ✓ | | | |
| DRIVER:DELETE | ✓ | ✓ | | | | | | |
| TRIP:VIEW | ✓ | ✓ | ✓ | ✓ | | | ✓ | ✓ |
| TRIP:CREATE | ✓ | ✓ | ✓ | ✓ | | | | |
| TRIP:DISPATCH | ✓ | ✓ | ✓ | ✓ | | | | |
| TRIP:COMPLETE | ✓ | ✓ | ✓ | ✓ | | | | |
| TRIP:CANCEL | ✓ | ✓ | ✓ | ✓ | | | | |
| TRIP:UPDATE | ✓ | ✓ | | | | | | |
| TRIP:DELETE | ✓ | ✓ | | | | | | |
| MAINTENANCE:VIEW | ✓ | ✓ | ✓ | | ✓ | | | ✓ |
| MAINTENANCE:CREATE | ✓ | ✓ | ✓ | | ✓ | | | |
| MAINTENANCE:UPDATE | ✓ | ✓ | ✓ | | ✓ | | | |
| MAINTENANCE:DELETE | ✓ | ✓ | | | | | | |
| MAINTENANCE:COMPLETE | ✓ | ✓ | | | | | | |
| FUEL:VIEW | ✓ | ✓ | ✓ | | | ✓ | ✓ | ✓ |
| FUEL:CREATE | ✓ | ✓ | ✓ | | | ✓ | ✓ | |
| FUEL:UPDATE | ✓ | ✓ | | | | ✓ | | |
| FUEL:DELETE | ✓ | ✓ | | | | | | |
| EXPENSE:VIEW | ✓ | ✓ | | | | ✓ | | ✓ |
| EXPENSE:CREATE | ✓ | ✓ | | | | ✓ | | |
| EXPENSE:UPDATE | ✓ | ✓ | | | | ✓ | | |
| EXPENSE:DELETE | ✓ | ✓ | | | | | | |
| EXPENSE:APPROVE | ✓ | ✓ | | | | ✓ | | |
| DASHBOARD:VIEW | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | | ✓ |
| REPORTS:VIEW | ✓ | ✓ | ✓ | | ✓ | ✓ | | ✓ |
| REPORTS:EXPORT | ✓ | ✓ | | | | ✓ | | |
| SETTINGS:* | ✓ | ✓ | | | | | | |
| USERS:* | ✓ | ✓ | | | | | | |
| ROLES:* | ✓ | ✓ | | | | | | |
| PERMISSIONS:* | ✓ | ✓ | | | | | | |
| NOTIFICATIONS:* | ✓ | ✓ | | | | | | |
| AUDIT:VIEW/EXPORT | ✓ | ✓ | | | | | | |
| PROFILE:VIEW | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| PROFILE:UPDATE | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | |

*SA=`SUPER_ADMIN` (via `*`), AD=`ADMIN` (full catalog), FM=`FLEET_MANAGER`, DI=`DISPATCHER`, SO=`SAFETY_OFFICER`, FA=`FINANCIAL_ANALYST`, OP=`OPERATOR`, VW=`VIEWER`.*

### 3.9.3 Multi-Role Union Example

| Assigned Roles | Effective Behavior |
|----------------|--------------------|
| `VIEWER` only | Read-only ops + dashboard/reports; no PROFILE:UPDATE |
| `OPERATOR` + `VIEWER` | Union: OPERATOR writes for fuel create + VIEWER read expanses |
| `DISPATCHER` + `FLEET_MANAGER` | Union of trip control and fleet CRUD |
| `SUPER_ADMIN` + any | Wildcard dominates |

## 3.10 Role Screen Access Inventory

| Route Group | SA/AD | FM | DI | SO | FA | OP | VW |
|-------------|:-----:|:--:|:--:|:--:|:--:|:--:|:--:|
| `/login` | public | public | public | public | public | public | public |
| `/dashboard` | ✓ | ✓ | ✓ | ✓ | ✓ | | ✓ |
| `/fleet/*` | ✓ | ✓ | V | | | V | V |
| `/drivers/*` | ✓ | ✓ | V | V/U | | | V |
| `/trips/*` | ✓ | ✓ | ✓ | | | V | V |
| `/maintenance/*` | ✓ | ✓ | | ✓ | | | V |
| `/fuel/*` | ✓ | C/V | | | ✓ | C/V | V |
| `/expenses/*` | ✓ | | | | ✓ | | V |
| `/fuel-expenses` | ✓ | limited | | | ✓ | limited | V |
| `/analytics` | ✓ | | | | ✓ | | ✓ |
| `/reports` | ✓ | V | | V | V+E | | V |
| `/settings/*` | ✓ | | | | | | |
| `/profile` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | V |

*V=view, C=create, U=update, E=export. UI may hide nav items; API remains authoritative.*


# 4. Functional Modules

Each module below reflects **current implementation**. Screens refer to Next.js App Router paths. APIs use global prefix `/api`.

---

## 4.0 Complete Screen Inventory (All App Routes)

| # | Route | Module | Auth | Primary Permissions |
|---|-------|--------|------|---------------------|
| 1 | `/` | Root redirect / landing | Mixed | — |
| 2 | `/login` | Authentication | Public | — |
| 3 | `/dashboard` | Dashboard | Protected | `DASHBOARD:VIEW` |
| 4 | `/fleet` | Vehicle list | Protected | `VEHICLE:VIEW` |
| 5 | `/fleet/new` | Vehicle create | Protected | `VEHICLE:CREATE` |
| 6 | `/fleet/[id]` | Vehicle detail | Protected | `VEHICLE:VIEW` |
| 7 | `/fleet/[id]/edit` | Vehicle edit | Protected | `VEHICLE:UPDATE` |
| 8 | `/drivers` | Driver list | Protected | `DRIVER:VIEW` |
| 9 | `/drivers/new` | Driver create | Protected | `DRIVER:CREATE` |
| 10 | `/drivers/[id]` | Driver detail | Protected | `DRIVER:VIEW` |
| 11 | `/drivers/[id]/edit` | Driver edit | Protected | `DRIVER:UPDATE` |
| 12 | `/trips` | Trip list | Protected | `TRIP:VIEW` |
| 13 | `/trips/new` | Trip create | Protected | `TRIP:CREATE` |
| 14 | `/trips/[id]` | Trip detail + lifecycle dialogs | Protected | `TRIP:VIEW` (+ action perms) |
| 15 | `/trips/[id]/edit` | Trip edit (DRAFT) | Protected | `TRIP:UPDATE` / create flow |
| 16 | `/maintenance` | Maintenance list | Protected | `MAINTENANCE:VIEW` |
| 17 | `/maintenance/new` | Maintenance create | Protected | `MAINTENANCE:CREATE` |
| 18 | `/maintenance/[id]` | Maintenance detail | Protected | `MAINTENANCE:VIEW` |
| 19 | `/maintenance/[id]/edit` | Maintenance edit | Protected | `MAINTENANCE:UPDATE` |
| 20 | `/fuel` | Fuel list | Protected | `FUEL:VIEW` |
| 21 | `/fuel/new` | Fuel create | Protected | `FUEL:CREATE` |
| 22 | `/fuel/[id]` | Fuel detail | Protected | `FUEL:VIEW` |
| 23 | `/fuel/[id]/edit` | Fuel edit | Protected | `FUEL:UPDATE` |
| 24 | `/expenses` | Expense list | Protected | `EXPENSE:VIEW` |
| 25 | `/expenses/new` | Expense create | Protected | `EXPENSE:CREATE` |
| 26 | `/expenses/[id]` | Expense detail | Protected | `EXPENSE:VIEW` |
| 27 | `/expenses/[id]/edit` | Expense edit | Protected | `EXPENSE:UPDATE` |
| 28 | `/fuel-expenses` | Fuel/expense hub | Protected | FUEL/EXPENSE view |
| 29 | `/analytics` | Analytics | Protected | `REPORTS:VIEW` / dashboard |
| 30 | `/reports` | Reports + export | Protected | `REPORTS:VIEW` / `EXPORT` |
| 31 | `/settings` | Settings overview | Protected | `SETTINGS:VIEW` |
| 32 | `/settings/company` | Company profile | Protected | SETTINGS |
| 33 | `/settings/users` | User admin | Protected | `USERS:*` |
| 34 | `/settings/roles` | Role admin | Protected | `ROLES:*` |
| 35 | `/settings/permissions` | Permission editor | Protected | `PERMISSIONS:*` |
| 36 | `/settings/notifications` | Notification prefs | Protected | `NOTIFICATIONS:*` |
| 37 | `/settings/security` | Security policy | Protected | SETTINGS |
| 38 | `/settings/appearance` | Theme / layout prefs | Protected | SETTINGS / local |
| 39 | `/settings/audit` | Audit logs | Protected | `AUDIT:VIEW` |
| 40 | `/settings/activity` | Activity timeline | Protected | AUDIT/SETTINGS |
| 41 | `/profile` | Own profile | Protected | `PROFILE:VIEW` |

### 4.0.1 Dialog / Overlay Inventory (Non-Route)

| Surface | Parent Route | Purpose |
|---------|--------------|---------|
| Dispatch trip dialog | `/trips/[id]` | Confirm dispatch |
| Complete trip dialog | `/trips/[id]` | Capture actual distance, fuel, revenue |
| Cancel trip dialog | `/trips/[id]` | Require cancel reason |
| Maintenance complete/close dialog | `/maintenance/[id]` | Capture completion fields |
| Confirmation dialogs | Various | Soft delete / destructive confirms |
| Theme toggle | Navbar | Light/dark appearance |
| Navbar notification bell | Global shell | **Stub only** — no inbox/unread menu |

---

## 4.1 Authentication

### 4.1.1 Purpose

Authenticate users and issue short-lived JWT access tokens with rotating refresh tokens. Protect application routes and API endpoints.

### 4.1.2 Features

| Feature | Description |
|---------|-------------|
| Login | Email + password (min 8); requires `ACTIVE` account |
| Access token | JWT signed with `JWT_SECRET`; default expiry `15m`; payload `{ sub, email, roles }` |
| Refresh token | JWT with `JWT_REFRESH_SECRET`; default `7d`; SHA-256 hash stored on user; rotated on refresh |
| Refresh reuse detection | Mismatched hash clears stored hash and returns 401 |
| Logout | Authenticated logout clears refresh token hash |
| Session gate | Frontend `ProtectedShell` redirects unauthenticated users to `/login` |
| Token refresh on 401 | Axios interceptor queues requests and refreshes once |

### 4.1.3 Inputs

| Input | Rules |
|-------|-------|
| Email | Required, valid email |
| Password | Required, minimum 8 characters |
| Refresh token | Required, minimum 20 characters on refresh endpoint |

#### 4.1.3.1 Field-Level I/O — Auth

| Field | Direction | Type | Required | Notes |
|-------|-----------|------|----------|-------|
| email | In | string | Yes | Lowercased on validate |
| password | In | string | Yes | Min 8 on login; stronger rules on profile change |
| accessToken | Out | JWT string | — | Bearer for API |
| refreshToken | Out | JWT string | — | Persisted client-side; hash server-side |
| user.sub | Out | string | — | User id |
| user.email | Out | string | — | Identity |
| user.roles | Out | RoleCode[] | — | Used for nav + claims |
| user.status | Out | ACTIVE/INACTIVE | — | Login blocked if inactive |

### 4.1.4 Outputs

| Output | Description |
|--------|-------------|
| Login response | Access token, refresh token, user identity/roles |
| Refresh response | New token pair |
| Errors | Invalid credentials; inactive account (`ForbiddenException`); expired/invalid refresh |

### 4.1.5 Business Rules

1. No public registration endpoint.  
2. Only `UserAccountStatus.ACTIVE` users may log in.  
3. Passwords verified with bcrypt (cost factor 12).  
4. Successful login updates `lastLoginAt`.  
5. Account lock fields exist on user/security settings but **login lockout is not enforced** in the current auth service path.

### 4.1.6 Dependencies

Users collection; JWT secrets; frontend auth store (`transitops-auth` localStorage key).

### 4.1.7 Screens

| Screen | Path |
|--------|------|
| Login | `/login` |
| Protected shell | All `(protected)/*` routes |

### 4.1.8 Validations

- Frontend Zod: email format; password ≥ 8  
- Backend `LoginDto` / `RefreshDto` via class-validator  

#### 4.1.8.1 Validation Rule Catalog — Auth

| Rule ID | Field | Rule | Layer |
|---------|-------|------|-------|
| VAL-AUTH-01 | email | Required, valid email format | FE + BE |
| VAL-AUTH-02 | password | Required, min length 8 on login | FE + BE |
| VAL-AUTH-03 | refreshToken | Required, min length 20 | BE |
| VAL-AUTH-04 | account status | Must be ACTIVE to issue tokens | BE |

### 4.1.9 Error Messages

| Condition | Message / Behavior |
|-----------|--------------------|
| Bad credentials | API error surfaced; fallback “Unable to sign in” |
| Inactive user | `User account is inactive` |
| Refresh reuse / invalid | 401; client clears auth and redirects to login |

#### 4.1.9.1 Error Message Catalog — Auth

| Code / Condition | HTTP | User-Visible Message |
|------------------|------|----------------------|
| Invalid credentials | 401 | Unable to sign in / invalid credentials |
| Inactive account | 403 | User account is inactive |
| Missing Bearer | 401 | Unauthorized |
| Refresh invalid/reused | 401 | Session expired — redirect to `/login` |
| Validation failure | 400 | Field-level class-validator messages |

### 4.1.10 Workflow

```
[User] → /login → POST /api/auth/login
       → tokens stored in Zustand (persisted)
       → navigate /dashboard
       → API calls with Bearer access token
       → on 401 → POST /api/auth/refresh → retry
       → logout → POST /api/auth/logout → clear store → /login
```

#### 4.1.10.1 Happy Path — Login

```
1. User opens /login
2. Enters email + password (≥8)
3. POST /api/auth/login
4. System verifies bcrypt hash + ACTIVE status
5. Issues access (15m) + refresh (7d); stores refresh hash
6. Updates lastLoginAt
7. Client persists tokens under transitops-auth
8. Redirect to /dashboard (if permitted) or first allowed route
```

#### 4.1.10.2 Alternate Paths — Auth

| Path | Trigger | Result |
|------|---------|--------|
| A1 Invalid password | Wrong credentials | 401; remain on login |
| A2 Inactive user | status=INACTIVE | 403 inactive message |
| A3 Expired access | API 401 | Interceptor refresh once; retry |
| A4 Refresh reuse | Old refresh presented | Hash cleared; forced re-login |
| A5 Logout | User clicks logout | Refresh hash cleared; store wiped |

---

## 4.2 Dashboard

### 4.2.1 Purpose

Provide an operations control surface with KPIs, charts, alerts, activity, leaderboards, and quick actions.

### 4.2.2 Features

| Feature | API / UI |
|---------|----------|
| Overview stats | `GET /dashboard/overview` |
| Recent activity | `GET /dashboard/recent-activity` |
| Charts | `GET /dashboard/charts` — utilization, revenue vs expense, fuel, trip trend, maintenance cost, trip status |
| Alerts | `GET /dashboard/alerts` |
| Top drivers / vehicles | `GET /dashboard/top-drivers`, `/top-vehicles` |
| Upcoming maintenance | `GET /dashboard/upcoming-maintenance` |
| Recent trips | `GET /dashboard/recent-trips` |
| Business summary | `GET /dashboard/business-summary` |
| Quick actions | Links to create trip, fleet, driver, maintenance, fuel, expense |

### 4.2.3 Inputs

Authenticated user with `DASHBOARD:VIEW`. Optional query filters where DTO supports them.

#### 4.2.3.1 Field-Level I/O — Dashboard

| Element | Direction | Description |
|---------|-----------|-------------|
| KPI cards | Out | Counts/aggregates for fleet, trips, costs |
| Chart series | Out | Utilization, revenue vs expense, fuel, trends |
| Alerts list | Out | Compliance / maintenance / ops risk signals |
| Leaderboard rows | Out | Top drivers / vehicles |
| Activity timeline | Out | Recent operational events |
| Export format | In | When using dashboard report export (`REPORTS:EXPORT`) |

### 4.2.4 Outputs

Aggregated KPI cards, chart series, alert lists, leaderboard rows, activity timeline.

### 4.2.5 Business Rules

1. Data excludes soft-deleted operational records.  
2. Alerts reflect compliance/maintenance/operational risk signals computed by dashboard services.  
3. Export of dashboard reports requires `REPORTS:EXPORT` (`GET /dashboard/reports/export`).

### 4.2.6 Dependencies

Vehicles, drivers, trips, maintenance, fuel, expenses aggregations.

### 4.2.7 Screens

| Screen | Path |
|--------|------|
| Dashboard | `/dashboard` |

### 4.2.8 Validations

Permission gate `DASHBOARD:VIEW` on all dashboard endpoints.

### 4.2.9 Error Messages

Empty states / toasts such as “Unable to load …” when queries fail.

### 4.2.10 Workflow

```
User opens /dashboard
  → parallel React Query fetches overview, charts, alerts, activity, leaderboards
  → render StatCards, charts, AlertsPanel, Leaderboard, QuickActions
```

#### 4.2.10.1 Happy Path — Morning Ops Review

```
1. Fleet Manager logs in → lands on /dashboard
2. Overview KPIs load (available vehicles, active trips, costs)
3. Alerts panel highlights expiring licenses / due maintenance
4. Quick action → Create Trip navigates to /trips/new
```

---

## 4.3 Vehicle (Fleet)

### 4.3.1 Purpose

Manage fleet assets (productized in UI as **Fleet**). Maintain identity, capacity, compliance dates, status, and mileage.

### 4.3.2 Features

| Feature | Description |
|---------|-------------|
| Create / update / soft-delete | Full CRUD |
| List + filters + statistics | Paginated list; stats cards |
| Available vehicles | `GET /vehicles/available` |
| Status update | Patch status with business rules |
| Mileage update | Mileage must not decrease |
| CSV export | Frontend list export |
| Detail / edit pages | `/fleet/[id]`, `/fleet/[id]/edit` |

### 4.3.3 Inputs

Key fields: `vehicleId`, `registrationNumber`, optional `vin`, `make`, `model`, `year`, `vehicleType`, `fuelType`, `maxCapacity` (1–500), `mileage`, purchase/registration/insurance/fitness dates, service dates, depot/country, photo, documents, status, remarks.

**Enums**

- Status: `AVAILABLE`, `ON_TRIP`, `MAINTENANCE`, `RETIRED`, `ACTIVE`, `IN_SERVICE`  
- Type: `BUS`, `MINIBUS`, `TRUCK`, `VAN`, `SEDAN`, `SUV`, `OTHER`  
- Fuel type: `DIESEL`, `PETROL`, `CNG`, `ELECTRIC`, `HYBRID`, `OTHER`  

#### 4.3.3.1 Field-Level Table — Vehicle

| Field | In/Out | Type | Required | Validation / Notes |
|-------|--------|------|----------|--------------------|
| vehicleId | I/O | string | Yes | Unique business ID |
| registrationNumber | I/O | string | Yes | Unique; letters/numbers/hyphens; uppercased in UI |
| vin | I/O | string | No | Sparse unique |
| make | I/O | string | Yes | Manufacturer |
| model | I/O | string | Yes | Model name |
| year | I/O | number | No | Model year |
| vehicleType | I/O | enum | Yes | BUS…OTHER |
| fuelType | I/O | enum | Yes | DIESEL…OTHER |
| color | I/O | string | No | — |
| seatingCapacity | I/O | number | No | — |
| maxCapacity | I/O | number | Yes | 1–500 kg |
| mileage | I/O | number | Yes | Non-decreasing on update |
| purchaseDate | I/O | date | No | — |
| registrationExpiryDate | I/O | date | Yes | Future on create; compliance window |
| insuranceExpiryDate | I/O | date | Yes | Future on create |
| fitnessCertificateExpiryDate | I/O | date | Yes | Future on create |
| registrationStatus | Out | VALID/EXPIRING/EXPIRED | — | Derived |
| insuranceStatus | Out | VALID/EXPIRING/EXPIRED | — | Derived |
| fitnessStatus | Out | VALID/EXPIRING/EXPIRED | — | Derived |
| serviceDueStatus | Out | OK/DUE_SOON/OVERDUE | — | 14-day soon window |
| lastServiceDate | I/O | date | No | Updated by maintenance complete |
| nextServiceDueDate | I/O | date | No | — |
| depotCity / depotState / country | I/O | string | No | Location |
| photo | I/O | URL | No | — |
| documents | I/O | files meta | No | — |
| status | I/O | enum | Yes | Lifecycle synced with trips/maintenance |
| remarks | I/O | string | No | — |
| isDeleted / deletedAt / deletedBy | Out | soft-delete | — | Soft delete pattern |
| createdAt / updatedAt | Out | datetime | — | Audit timestamps |

### 4.3.4 Outputs

Vehicle records; statistics; available list for dispatch; unique constraint errors.

#### 4.3.4.1 Statistics Outputs

| Metric | Description |
|--------|-------------|
| totalVehicles | Non-deleted count |
| available / onTrip / maintenance / retired | Status buckets |
| insuranceExpiring / fitnessExpiring | Compliance soon |
| serviceDueSoon | Service window |
| averageMileage | Fleet average |

### 4.3.5 Business Rules

1. Unique `vehicleId`, `registrationNumber`; sparse unique `vin`.  
2. Compliance expiry must be after today on create; within 30 days → `EXPIRING` window.  
3. Service due: OK / DUE_SOON (14 days) / OVERDUE.  
4. Mileage never decreases.  
5. Cannot set `AVAILABLE` if retired, or if compliance expired (except transitions from `ON_TRIP` where rules allow restore).  
6. Soft delete sets `isDeleted` / `deletedAt` / `deletedBy`.

### 4.3.6 Dependencies

Trips (assignment); Maintenance (status lock); Fuel/Expense (business `vehicleId` string refs).

### 4.3.7 Screens

| Screen | Path |
|--------|------|
| List | `/fleet` |
| Create | `/fleet/new` |
| Detail | `/fleet/[id]` |
| Edit | `/fleet/[id]/edit` |

### 4.3.8 Validations

- Vehicle number: letters, numbers, hyphens  
- Max load 1–500 kg  
- Expiry dates must be in the future on create  
- Service date ordering rules  

#### 4.3.8.1 Validation Rule Catalog — Fleet

| Rule ID | Field | Rule |
|---------|-------|------|
| VAL-VEH-01 | registrationNumber | Required; regex letters/numbers/hyphens; unique |
| VAL-VEH-02 | vehicleId | Unique business identifier |
| VAL-VEH-03 | vin | Optional; sparse unique |
| VAL-VEH-04 | maxCapacity | Integer/number 1–500 |
| VAL-VEH-05 | mileage | ≥ 0; updates must not decrease |
| VAL-VEH-06 | compliance dates | After today on create |
| VAL-VEH-07 | status transitions | Respect retired/maintenance/on-trip rules |

### 4.3.9 Error Messages

Conflict on duplicates; validation messages from fleet validators; toast “Vehicle created|updated|deleted successfully”.

#### 4.3.9.1 Error Message Catalog — Fleet

| Condition | Message Pattern |
|-----------|-----------------|
| Duplicate registration | Conflict / already exists |
| Duplicate vehicleId | Conflict / already exists |
| Mileage decrease | Mileage must not decrease |
| Compliance expired on create | Expiry must be after today |
| Soft delete success | Vehicle deleted successfully |
| Create success | Vehicle created successfully |

### 4.3.10 Workflow

```
Create vehicle → AVAILABLE (typical)
  → Assign to trip (dispatch) → ON_TRIP
  → Complete/cancel trip → AVAILABLE
  → Active maintenance → MAINTENANCE
  → Complete maintenance → AVAILABLE
  → Retire → RETIRED (no new maintenance)
```

#### 4.3.10.1 Happy Path — Register Asset

```
1. Fleet Manager opens /fleet/new
2. Enters identity, capacity, compliance dates, fuel type
3. POST vehicle API
4. Record appears on /fleet with AVAILABLE status
5. Vehicle eligible for GET /vehicles/available
```

#### 4.3.10.2 Alternate Paths — Fleet

| Path | Trigger | Result |
|------|---------|--------|
| A1 Duplicate plate | Same registrationNumber | 409/conflict |
| A2 Mileage rollback | Lower mileage on update | Rejected |
| A3 Soft delete | Delete action | isDeleted=true; hidden from lists |
| A4 Retire | Status RETIRED | No new maintenance |

---

## 4.4 Driver

### 4.4.1 Purpose

Maintain driver roster, licensing, availability, and safety score for safe assignment to trips.

### 4.4.2 Features

CRUD; status & safety-score updates; available drivers; statistics; CSV export; detail/edit.

### 4.4.3 Inputs

`employeeCode`, names/`fullName`, `email`, `phone`, license fields (`licenseNumber`, category, expiry), experience (0–60), address, emergency contact, `bloodGroup`, photo, documents, `status`, `safetyScore` (0–100).

**Enums**

- Status: `AVAILABLE`, `ON_TRIP`, `SUSPENDED`, `OFF_DUTY`  
- License category: `LMV`, `HMV`, `CDL_A`, `CDL_B`, `CDL_C`, `MCWG`, `OTHER`  
- License validity derived: `VALID`, `EXPIRING`, `EXPIRED`  
- Blood group: `A+`…`O-`, `UNKNOWN`  

#### 4.4.3.1 Field-Level Table — Driver

| Field | In/Out | Type | Required | Validation / Notes |
|-------|--------|------|----------|--------------------|
| employeeCode | I/O | string | Yes | Unique; A-Z0-9-_ ; uppercased |
| firstName / lastName | I/O | string | Yes | Letters/name regex |
| fullName | Out | string | — | Derived/composed |
| email | I/O | string | Yes | Unique; email format |
| phone | I/O | string | Yes | Unique; exactly 10 digits |
| alternatePhone | I/O | string | No | Optional phone |
| dateOfBirth | I/O | date | No | — |
| joiningDate | I/O | date | Yes | — |
| licenseNumber | I/O | string | Yes | Unique; pattern |
| licenseCategory | I/O | enum | Yes | LMV…OTHER |
| licenseIssueDate | I/O | date | No | — |
| licenseExpiryDate | I/O | date | Yes | Future for assignability |
| licenseStatus | Out | VALID/EXPIRING/EXPIRED | — | Derived; 30-day EXPIRING |
| experienceYears | I/O | number | Yes | 0–60 |
| address / city / state / country / postalCode | I/O | string | No | City letters; postal 6 digits |
| emergencyName / emergencyPhone | I/O | string | No | — |
| bloodGroup | I/O | enum | No | A+…O-/UNKNOWN |
| photo / documents | I/O | URL/meta | No | — |
| status | I/O | enum | Yes | Synced with trips |
| safetyScore | I/O | number | Yes | 0–100 clamped |
| remarks | I/O | string | No | — |
| isDeleted… | Out | soft-delete | — | Soft delete pattern |

### 4.4.4 Outputs

Driver records; availability for dispatch; statistics.

### 4.4.5 Business Rules

1. Unique `employeeCode`, `email`, `phone`, `licenseNumber`.  
2. License expiry must be future at create/assign time; 30-day expiring window (warning on trip assign).  
3. Suspended / expired license cannot be Available or assignable.  
4. Safety score clamped 0–100.  
5. Soft delete supported.

### 4.4.6 Dependencies

Trips; Fuel/Expense optional `employeeCode` refs; Dashboard top drivers.

### 4.4.7 Screens

`/drivers`, `/drivers/new`, `/drivers/[id]`, `/drivers/[id]/edit`

### 4.4.8 Validations

Employee code pattern; name fields; license number pattern; phone 10 digits; city letters; postal 6 digits; license expiry after today.

#### 4.4.8.1 Validation Rule Catalog — Driver

| Rule ID | Field | Rule |
|---------|-------|------|
| VAL-DRV-01 | employeeCode | Required; unique; regex |
| VAL-DRV-02 | email / phone / licenseNumber | Unique |
| VAL-DRV-03 | phone | Exactly 10 digits |
| VAL-DRV-04 | licenseExpiryDate | After today for create/assign |
| VAL-DRV-05 | experienceYears | 0–60 |
| VAL-DRV-06 | safetyScore | 0–100 |
| VAL-DRV-07 | postalCode | Exactly 6 digits when provided |
| VAL-DRV-08 | names | Letters / allowed name chars |

### 4.4.9 Error Messages

Duplicate uniqueness conflicts; “License expiry must be after today…”; success toasts for CRUD.

#### 4.4.9.1 Error Message Catalog — Driver

| Condition | Message Pattern |
|-----------|-----------------|
| Duplicate employeeCode | Conflict |
| Expired license assign | Not assignable / validation error |
| Suspended driver assign | Not assignable |
| Safety score out of range | Must be 0–100 |
| Phone invalid | Must contain exactly 10 digits |

### 4.4.10 Workflow

```
Register driver → AVAILABLE
  → Dispatch trip → ON_TRIP
  → Complete/cancel → AVAILABLE
  → Suspend → SUSPENDED (not assignable)
  → Off duty → OFF_DUTY
```

#### 4.4.10.1 Happy Path — Onboard Driver

```
1. Fleet Manager opens /drivers/new
2. Enters employee code, identity, license, expiry, experience
3. POST driver API → AVAILABLE
4. Appears in available drivers for trip assignment
```

#### 4.4.10.2 Alternate Paths — Driver

| Path | Trigger | Result |
|------|---------|--------|
| A1 License expiring <30d | Trip validation | Warning; may still assign if not expired |
| A2 License expired | Trip validation | Block assignment |
| A3 Suspend | Status SUSPENDED | Removed from assignable pool |
| A4 Soft delete | Delete | Hidden from operational lists |

---

## 4.5 Trip

### 4.5.1 Purpose

Plan and execute transport trips with enforced assignment rules and synchronized vehicle/driver status.

### 4.5.2 Features

| Feature | Endpoint |
|---------|----------|
| Create (DRAFT) | `POST /trips` |
| Update (DRAFT only) | `PATCH /trips/:id` |
| Soft delete | `DELETE /trips/:id` (blocked if DISPATCHED/IN_PROGRESS) |
| Dispatch | `PATCH /trips/:id/dispatch` |
| Start | `PATCH /trips/:id/start` |
| Complete | `PATCH /trips/:id/complete` |
| Cancel | `PATCH /trips/:id/cancel` |
| Available resources | `GET /trips/available/vehicles`, `/available/drivers` |
| Statistics | `GET /trips/statistics` |

Auto-generated `tripNumber` with prefix `TR`.

### 4.5.3 Inputs

Source, destination, vehicle, driver, cargo type/weight/description, planned distances/dates, estimated revenue, notes; on complete: actual distance, fuel consumed, actual revenue; on cancel: reason (+ optional notes).

**Enums**

- Status: `DRAFT`, `DISPATCHED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`  
- Cargo: `GENERAL`, `FRAGILE`, `HAZARDOUS`, `PERISHABLE`, `BULK`, `OTHER`  

#### 4.5.3.1 Field-Level Table — Trip

| Field | In/Out | Type | Required | Notes |
|-------|--------|------|----------|-------|
| tripNumber | Out | string | — | Auto `TR…` |
| source | I/O | string | Yes | Origin |
| destination | I/O | string | Yes | Destination |
| vehicleId | I/O | string/ref | Yes | Assigned vehicle |
| driverId | I/O | string/ref | Yes | Assigned driver |
| cargoName | I/O | string | Yes | Cargo description/name |
| cargoWeight | I/O | number | Yes | Must be ≤ vehicle maxCapacity |
| cargoType | I/O | enum | Yes | GENERAL…OTHER |
| plannedDistance | I/O | number | Yes | Planned km |
| actualDistance | I (complete) | number | Yes on complete | Actual km |
| plannedStartDate / plannedEndDate | I/O | datetime | Yes | end ≥ start |
| actualStartDate | Out | datetime | — | Set on start |
| actualEndDate | Out | datetime | — | Set on complete |
| fuelConsumed | I (complete) | number | Yes on complete | — |
| estimatedRevenue | I/O | number | Yes | Planning |
| actualRevenue | I (complete) | number | Yes on complete | — |
| notes | I/O | string | No | — |
| status | Out | enum | — | Lifecycle |
| cancel reason | I (cancel) | string | Yes in UI | Required to cancel |
| tripDocuments | I/O | meta[] | No | Optional docs |
| createdBy | Out | string | — | Ownership for OPERATOR scope |

### 4.5.4 Outputs

Trip records; lifecycle side effects on vehicle/driver status; validation errors/warnings.

#### 4.5.4.1 Statistics Outputs

| Metric | Description |
|--------|-------------|
| totalTrips / active / pending / completed / cancelled | Status counts |
| revenue | Aggregated |
| averageDistance / distanceTravelled | Distance metrics |
| fuelConsumption | Aggregated fuel used on completed trips |

### 4.5.5 Business Rules

See §5.3 in detail. Summary:

1. Lifecycle: `DRAFT → DISPATCHED → IN_PROGRESS → COMPLETED` or cancel from draft/dispatched/in-progress.  
2. Update only while `DRAFT`.  
3. Dispatch sets vehicle & driver to `ON_TRIP`.  
4. Complete restores both to `AVAILABLE`; requires actual distance/fuel/revenue.  
5. Cancel restores availability if was dispatched/in progress.  
6. Cargo weight ≤ vehicle `maxCapacity` (1–500 kg).  
7. One active trip per vehicle/driver; no dispatch if vehicle in active maintenance.  
8. OPERATOR list/read scoped to `createdBy === user.sub`.

### 4.5.6 Dependencies

Vehicle, Driver, Maintenance availability services; permissions `TRIP:*`.

### 4.5.7 Screens

`/trips`, `/trips/new`, `/trips/[id]`, `/trips/[id]/edit`  
Dialogs: Dispatch, Complete, Cancel.

### 4.5.8 Validations

Planned end ≥ planned start; capacity; assignability; cancel reason required in UI.

#### 4.5.8.1 Validation Rule Catalog — Trip

| Rule ID | Rule |
|---------|------|
| VAL-TRP-01 | plannedEndDate ≥ plannedStartDate |
| VAL-TRP-02 | cargoWeight ≤ vehicle.maxCapacity |
| VAL-TRP-03 | Vehicle assignable (available, compliance, not maintenance) |
| VAL-TRP-04 | Driver assignable (available, license valid, not suspended) |
| VAL-TRP-05 | No overlapping active trip for same vehicle/driver |
| VAL-TRP-06 | Update only when status=DRAFT |
| VAL-TRP-07 | Dispatch only from DRAFT; start from DISPATCHED; complete from IN_PROGRESS |
| VAL-TRP-08 | Complete requires actualDistance, fuelConsumed, actualRevenue |
| VAL-TRP-09 | Cancel requires reason (UI) |
| VAL-TRP-10 | Soft-delete blocked when DISPATCHED or IN_PROGRESS |

### 4.5.9 Error Messages

Conflict when resources busy; validation error arrays/warnings (e.g., license expiring); lifecycle state errors.

#### 4.5.9.1 Error Message Catalog — Trip

| Condition | Message Pattern |
|-----------|-----------------|
| Update non-draft | Only draft trips can be updated |
| Delete active dispatch | Cancel the trip before deleting an active dispatch |
| Invalid lifecycle transition | Cannot dispatch/start/complete/cancel trip in status X |
| Resource busy | Conflict / overlapping active trip |
| Over capacity | Cargo exceeds maxCapacity |
| OPERATOR other user trip | You can only view your own trips |
| Insufficient permissions | Insufficient permissions for trips |
| Not found | Trip {id} not found |

### 4.5.10 Workflow

```
Create DRAFT
  → (optional edit)
  → Dispatch → vehicle/driver ON_TRIP
  → Start → IN_PROGRESS (actualStartDate)
  → Complete → COMPLETED + AVAILABLE restore
     OR Cancel → CANCELLED + restore if needed
```

#### 4.5.10.1 Happy Path — Full Trip Lifecycle

```
1. Dispatcher creates trip at /trips/new (DRAFT, tripNumber TR…)
2. Selects available vehicle + driver; cargo within capacity
3. Dispatch → status DISPATCHED; vehicle & driver ON_TRIP
4. Start → IN_PROGRESS; actualStartDate set
5. Complete dialog: enter actualDistance, fuelConsumed, actualRevenue
6. Status COMPLETED; vehicle & driver AVAILABLE
```

#### 4.5.10.2 Alternate Paths — Trip

| Path | Trigger | Result |
|------|---------|--------|
| A1 Cancel from DRAFT | Cancel dialog | CANCELLED; no status restore needed |
| A2 Cancel after dispatch | Cancel | CANCELLED; restore AVAILABLE |
| A3 Capacity exceeded | cargoWeight too high | Validation reject |
| A4 Vehicle in maintenance | Dispatch attempt | Rejected |
| A5 Second trip same driver | Overlap active | Conflict |
| A6 Edit after dispatch | PATCH | Only draft trips can be updated |
| A7 Soft delete while IN_PROGRESS | DELETE | Blocked — cancel first |


## 4.6 Maintenance

### 4.6.1 Purpose

Schedule and execute vehicle maintenance with automatic fleet status impact and optional attachments.

### 4.6.2 Features

CRUD; start/complete/cancel; statistics; vehicle history; in-maintenance check; multipart attachments (max 10 files, 10MB, images/PDF); timeline on detail.

Numbers prefixed `MNT`.

### 4.6.3 Inputs

Vehicle, type, priority, schedule/expected completion, costs, notes, next service due; complete DTO may update mileage / next service.

**Enums**

- Status: `SCHEDULED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`  
- Type: `PREVENTIVE`, `CORRECTIVE`, `EMERGENCY`, `OIL_CHANGE`, `TYRE_REPLACEMENT`, `ENGINE_REPAIR`, `BRAKE_SERVICE`, `BATTERY_REPLACEMENT`, `INSPECTION`  
- Priority: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`  

#### 4.6.3.1 Field-Level Table — Maintenance

| Field | In/Out | Type | Required | Notes |
|-------|--------|------|----------|-------|
| maintenanceNumber | Out | string | — | Auto `MNT…` |
| vehicleId | I/O | ref | Yes | Target vehicle |
| vehicleNumber / vehicleModel | Out | string | — | Denormalized display |
| maintenanceType | I/O | enum | Yes | PREVENTIVE…INSPECTION |
| title | I/O | string | Yes | Work title |
| description | I/O | string | No | Details |
| priority | I/O | enum | Yes | LOW…CRITICAL |
| status | Out | enum | — | Lifecycle |
| startDate | I/O | date | Yes | Today or future on schedule |
| expectedCompletionDate | I/O | date | Yes | Ordering vs start |
| completedDate | Out | date | — | On complete |
| estimatedCost | I/O | number | Yes | Must be > 0 |
| actualCost | I/O | number | No | On/after complete |
| vendorName / vendorPhone / serviceCenter | I/O | string | No | Vendor meta |
| odometerReading | I/O | number | No | May update vehicle mileage on complete |
| nextServiceDue | I/O | date | No | After expected completion |
| attachments | I/O | files | No | ≤10 files, ≤10MB, images/PDF |
| notes | I/O | string | No | Editable even when completed |
| createdBy / updatedBy | Out | string | — | Audit |

### 4.6.4 Outputs

Maintenance records; vehicle status changes; attachment URLs under `/uploads`.

#### 4.6.4.1 Statistics Outputs

| Metric | Description |
|--------|-------------|
| totalRecords / active / completed / overdue | Workload |
| vehiclesInShop | Vehicles with MAINTENANCE status |
| costThisMonth / costThisYear | Cost aggregates |
| averageRepairTimeDays | Duration metric |

### 4.6.5 Business Rules

1. Active statuses (`SCHEDULED`, `IN_PROGRESS`) set vehicle to `MAINTENANCE`.  
2. One active maintenance per vehicle (`ConflictException`).  
3. No maintenance on `RETIRED` vehicles.  
4. Complete → vehicle `AVAILABLE` (unless retired); updates `lastServiceDate`; optional mileage/next due.  
5. Cancel/soft-delete of active work restores availability if no other active work.  
6. Completed records: only notes editable.  
7. Costs must be > 0; schedule dates today/future; next service after expected completion.

### 4.6.6 Dependencies

Vehicle module/repository; trip assignment rules (blocks dispatch while in maintenance).

### 4.6.7 Screens

`/maintenance`, `/maintenance/new`, `/maintenance/[id]`, `/maintenance/[id]/edit`  
Dialogs: Close/Complete, Confirmation.

### 4.6.8 Validations

Date ordering; cost > 0; file type/size limits.

#### 4.6.8.1 Validation Rule Catalog — Maintenance

| Rule ID | Rule |
|---------|------|
| VAL-MNT-01 | estimatedCost > 0 |
| VAL-MNT-02 | schedule dates today or future |
| VAL-MNT-03 | nextServiceDue after expectedCompletionDate when set |
| VAL-MNT-04 | attachments ≤10 files, each ≤10MB, images/PDF only |
| VAL-MNT-05 | one active maintenance per vehicle |
| VAL-MNT-06 | no maintenance on RETIRED vehicles |
| VAL-MNT-07 | completed records: only notes editable |

### 4.6.9 Error Messages

Conflict for concurrent active maintenance; retired vehicle rejection; toast lifecycle messages.

#### 4.6.9.1 Error Message Catalog — Maintenance

| Condition | Message Pattern |
|-----------|-----------------|
| Second active WO | ConflictException — already in maintenance |
| Retired vehicle | Cannot schedule maintenance |
| Invalid attachment | File type/size rejected |
| Complete success | Maintenance completed; vehicle AVAILABLE |

### 4.6.10 Workflow

```
Create SCHEDULED → vehicle MAINTENANCE
  → Start → IN_PROGRESS
  → Complete → COMPLETED + vehicle AVAILABLE
     OR Cancel → CANCELLED + restore if appropriate
```

#### 4.6.10.1 Happy Path — Preventive Service

```
1. Safety Officer opens /maintenance/new
2. Selects vehicle AVAILABLE; type PREVENTIVE; priority MEDIUM
3. Create → SCHEDULED; vehicle → MAINTENANCE
4. Start → IN_PROGRESS
5. Attach invoice PDF (≤10MB)
6. Complete → COMPLETED; lastServiceDate updated; vehicle AVAILABLE
```

#### 4.6.10.2 Alternate Paths — Maintenance

| Path | Trigger | Result |
|------|---------|--------|
| A1 Concurrent WO | Second active create | Conflict |
| A2 Cancel scheduled | Cancel | CANCELLED; restore AVAILABLE |
| A3 Dispatch while in shop | Trip dispatch | Blocked by maintenance check |
| A4 Edit completed | Non-notes fields | Rejected / limited |

---

## 4.7 Fuel

### 4.7.1 Purpose

Record fuel fills against vehicles (and optionally trips/drivers) and analyze consumption/cost.

### 4.7.2 Features

CRUD; statistics (date range); vehicle history/cost; trip cost; vehicle comparison; charts on list and hub pages.

### 4.7.3 Inputs

Business `vehicleId` (required); optional trip/driver business codes; station; fuel type; quantity; pricePerLiter; odometer; filledAt; receipt URL; notes.

**Fuel types:** `DIESEL`, `PETROL`, `CNG`, `ELECTRIC`, `HYBRID`, `OTHER`

#### 4.7.3.1 Field-Level Table — Fuel Log

| Field | In/Out | Type | Required | Notes |
|-------|--------|------|----------|-------|
| vehicleId | I/O | business string | Yes | Validated reference |
| tripId | I/O | business string | No | Optional; uppercased where applicable |
| driverId | I/O | business string | No | Optional employee/driver code |
| fuelStation | I/O | string | Yes | Station name |
| fuelType | I/O | enum | Yes | DIESEL…OTHER |
| quantity | I/O | number | Yes | > 0 |
| pricePerLiter | I/O | number | Yes | > 0 |
| totalCost | Out | number | — | `round(quantity * pricePerLiter, 2)` |
| odometerReading | I/O | number | No | — |
| filledAt | I/O | datetime | Yes | Not in the future (UI) |
| receiptImage | I/O | URL | No | Optional |
| notes | I/O | string | No | — |
| createdBy | Out | string | — | OPERATOR ownership scope |

### 4.7.4 Outputs

Fuel logs with computed `totalCost`; analytics series; soft-delete.

#### 4.7.4.1 Statistics Outputs

| Metric | Description |
|--------|-------------|
| totalFuelCost / totalFuelQuantity | Aggregates |
| averageFuelCost / averageFuelEfficiency | Averages |
| monthlyFuelCost | Series |
| fuelConsumptionTrend | Date series quantity/cost |

### 4.7.5 Business Rules

1. `totalCost = round(quantity * pricePerLiter, 2)`.  
2. Vehicle reference validated via business ID; trip/driver optional and uppercased where applicable.  
3. Filled date cannot be in the future (UI validation).  
4. OPERATOR-only users scoped to own `createdBy` records.  
5. Soft delete supported.

### 4.7.6 Dependencies

ReferenceValidationService; vehicles/drivers/trips business IDs; CostCalculationService.

### 4.7.7 Screens

`/fuel`, `/fuel/new`, `/fuel/[id]`, `/fuel/[id]/edit`, hub `/fuel-expenses`

### 4.7.8 Validations

Vehicle required; quantity/price > 0; filled date not future; optional receipt URL.

#### 4.7.8.1 Validation Rule Catalog — Fuel

| Rule ID | Rule |
|---------|------|
| VAL-FUL-01 | vehicleId required and valid |
| VAL-FUL-02 | quantity > 0 |
| VAL-FUL-03 | pricePerLiter > 0 |
| VAL-FUL-04 | filledAt not in the future |
| VAL-FUL-05 | optional trip/driver refs validated when present |
| VAL-FUL-06 | totalCost computed server-side as round(qty*price, 2) |

### 4.7.9 Error Messages

Invalid reference; validation failures; success toasts for add/update/delete.

#### 4.7.9.1 Error Message Catalog — Fuel

| Condition | Message Pattern |
|-----------|-----------------|
| Invalid vehicleId | Reference validation error |
| Future filledAt | Date cannot be in the future |
| qty/price ≤ 0 | Must be greater than 0 |
| Create success | Fuel log created successfully |

### 4.7.10 Workflow

```
Select vehicle (+ optional trip/driver)
  → Enter quantity & price
  → System computes totalCost
  → Persist fuel_logs
  → Appear in statistics/charts/cost aggregations
```

#### 4.7.10.1 Happy Path — Operator Fuel Log

```
1. OPERATOR opens /fuel/new
2. Selects vehicle business ID; enters 40.5 L @ 102.35
3. System stores totalCost = round(40.5 * 102.35, 2) = 4145.18
4. Record visible on /fuel (own records) and in statistics
```

#### 4.7.10.2 Cost Calculation Examples

| Qty | Price/L | totalCost |
|-----|---------|-----------|
| 10 | 100.00 | 1000.00 |
| 12.5 | 98.765 | 1234.56 (rounded) |
| 0.333 | 3.333 | 1.11 (rounded) |

---

## 4.8 Expense

### 4.8.1 Purpose

Capture operational expenses, support approval workflow via status, and contribute approved amounts to cost analytics.

### 4.8.2 Features

CRUD; statistics; trip expenses; vehicle cost; charts; status management.

### 4.8.3 Inputs

Type, title, description, amount, expenseDate, optional vehicle/trip/driver business refs, receipt, notes, status, optional `approvedBy`.

**Enums**

- Status: `PENDING` (default), `APPROVED`, `REJECTED`  
- Type: `TOLL`, `PARKING`, `REPAIR`, `MAINTENANCE`, `INSURANCE`, `CLEANING`, `TAX`, `PERMIT`, `FINE`, `OTHER`  

#### 4.8.3.1 Field-Level Table — Expense

| Field | In/Out | Type | Required | Notes |
|-------|--------|------|----------|-------|
| vehicleId | I/O | business string | Yes/typical | Validated when provided |
| tripId / driverId | I/O | business string | No | Optional refs |
| expenseType | I/O | enum | Yes | TOLL…OTHER |
| title | I/O | string | Yes | Required |
| description | I/O | string | No | — |
| amount | I/O | number | Yes | > 0; two decimal places |
| expenseDate | I/O | date | Yes | Not in the future (UI) |
| receiptImage | I/O | URL | No | — |
| status | I/O | enum | Default PENDING | APPROVED/REJECTED via update |
| approvedBy | I/O | string | No | Set on approval path |
| notes | I/O | string | No | — |
| createdBy | Out | string | — | Ownership scope |

### 4.8.4 Outputs

Expense records; statistics; cost contributions when `APPROVED`.

#### 4.8.4.1 Statistics Outputs

| Metric | Description |
|--------|-------------|
| totalExpenses | Count/amount |
| pending / approved / rejected | Status buckets |
| expenseByCategory | Type breakdown |
| monthlyExpenses | Time series |

### 4.8.5 Business Rules

1. Default status `PENDING`.  
2. Status may be set on create/update; approval is via update (permission `EXPENSE:APPROVE` exists; no separate approve endpoint).  
3. Cost aggregation includes only `APPROVED` expenses.  
4. Same string-ref validation pattern as fuel.  
5. OPERATOR ownership scoping applies.  
6. Expense date cannot be in the future (UI).

### 4.8.6 Dependencies

Reference validation; CostCalculationService; Financial Analyst permissions.

### 4.8.7 Screens

`/expenses`, `/expenses/new`, `/expenses/[id]`, `/expenses/[id]/edit`, hub `/fuel-expenses`

### 4.8.8 Validations

Amount > 0 / two decimal places; date not future; title required.

#### 4.8.8.1 Validation Rule Catalog — Expense

| Rule ID | Rule |
|---------|------|
| VAL-EXP-01 | title required |
| VAL-EXP-02 | amount > 0 with monetary precision |
| VAL-EXP-03 | expenseDate not in the future |
| VAL-EXP-04 | refs validated when provided |
| VAL-EXP-05 | status in PENDING/APPROVED/REJECTED |

### 4.8.9 Error Messages

Reference errors; “Expense date cannot be in the future.”; CRUD toasts.

### 4.8.10 Workflow

```
Create PENDING expense
  → Finance updates status → APPROVED | REJECTED
  → Approved amounts included in operational cost
```

#### 4.8.10.1 Happy Path — Approve Toll

```
1. Financial Analyst creates TOLL expense PENDING
2. Updates status to APPROVED (EXPENSE:APPROVE)
3. CostCalculationService includes amount in vehicle/trip cost
4. Charts on /expenses and /fuel-expenses refresh
```

#### 4.8.10.2 Alternate Paths — Expense

| Path | Trigger | Result |
|------|---------|--------|
| A1 Reject | Status REJECTED | Excluded from cost aggregates |
| A2 Future date | UI validation | Blocked |
| A3 Viewer create | Missing CREATE | Nav/API denied |

---

## 4.9 Reports & Analytics

### 4.9.1 Purpose

Provide analytical views and exportable business reports for decision makers.

### 4.9.2 Features

| Surface | Capability |
|---------|------------|
| Analytics page `/analytics` | Month ranges 3/6/12; efficiency/revenue/volume/ROI stats; charts |
| Reports page `/reports` | Periods `daily` \| `weekly` \| `monthly`; summary; leaderboards; CSV/PDF export |
| APIs | `/analytics/charts`, `/summary`, `/reports`, `/reports/export`; dashboard export |

### 4.9.3 Inputs

Period selection; export format; authenticated user with `REPORTS:VIEW` / `REPORTS:EXPORT`.

#### 4.9.3.1 Field-Level I/O — Reports

| Field | Direction | Values |
|-------|-----------|--------|
| period | In | daily, weekly, monthly |
| analytics range | In | 3 / 6 / 12 months |
| export format | In | CSV or PDF |
| summary metrics | Out | Business performance aggregates |
| charts | Out | Series payloads |
| file download | Out | CSV/PDF blob |

### 4.9.4 Outputs

Chart payloads; summary metrics; downloadable CSV/PDF; toast on success/failure.

### 4.9.5 Business Rules

1. View requires `REPORTS:VIEW` (analytics also accepts dashboard permission on some UI nav).  
2. Export requires `REPORTS:EXPORT`.  
3. Aggregations respect soft-delete filters.

### 4.9.6 Dependencies

Dashboard/analytics services; underlying domain collections.

### 4.9.7 Screens

`/analytics`, `/reports`

### 4.9.8 Validations

Period enum; permission checks.

### 4.9.9 Error Messages

“Failed to export report”; “CSV/PDF report downloaded” on success.

### 4.9.10 Workflow

```
Select period → load summary/charts
  → optional Export CSV/PDF via REPORTS:EXPORT
```

#### 4.9.10.1 Happy Path — Monthly Export

```
1. Financial Analyst opens /reports
2. Selects monthly period
3. Reviews summary + leaderboards
4. Exports PDF (REPORTS:EXPORT)
5. Toast confirms download
```

---

## 4.10 Settings & Administration

### 4.10.1 Purpose

Configure organization, govern identities/access, personalize appearance, and review audit activity.

### 4.10.2 Features

| Submodule | Path | Capabilities |
|-----------|------|--------------|
| Overview | `/settings` | Admin statistics & charts |
| Company | `/settings/company` | Name, contact, country, currency, timezone, date format, language, logo URL |
| Users | `/settings/users` | CRUD, bulk status, bulk delete, role assign |
| Roles | `/settings/roles` | List, update description, clone permissions, assign users; system roles protected |
| Permissions | `/settings/permissions` | Privilege checklist editor; `*` roles read-only |
| Notifications prefs | `/settings/notifications` | Channels email/inApp; event toggles |
| Security | `/settings/security` | Password policy, session timeout, max attempts, lock duration, 2FA-ready flag |
| Appearance | `/settings/appearance` | Theme light/dark, collapse sidebar, compact tables |
| Audit | `/settings/audit` | List + CSV export |
| Activity | `/settings/activity` | Timeline of recent audit events |
| Profile | `/profile` | Profile + password change |

#### 4.10.2.1 Field-Level — Company Settings

| Field | Notes |
|-------|-------|
| company name | Organization display |
| contact | Phone/email contact fields |
| country | Locale |
| currency | Display currency |
| timezone | Ops timezone |
| date format | UI formatting |
| language | UI language preference |
| logo URL | Branding |

#### 4.10.2.2 Field-Level — Security Settings

| Field | Notes |
|-------|-------|
| password policy | Min length / complexity (aligned with profile Zod where applicable) |
| session timeout | Configured preference |
| max attempts | Stored; **login lockout not enforced in auth path** |
| lock duration | Stored preference |
| 2FA-ready flag | Flag only; 2FA not fully enforced in current release |

#### 4.10.2.3 Field-Level — User Admin

| Field | Notes |
|-------|-------|
| email / firstName / lastName / phone | Identity |
| roles | RoleCode assignments |
| status | ACTIVE / INACTIVE |
| password | Hashed bcrypt cost 12 on create/change |
| bulk actions | Activate / deactivate / delete |

### 4.10.3 Inputs / Outputs

App settings singleton (`app_settings` key `default`); user/role/permission documents; audit_logs.

### 4.10.4 Business Rules

1. System roles cannot be deleted.  
2. Permission `*` only valid for `SUPER_ADMIN`.  
3. Passwords hashed bcrypt cost 12 on user create/password change.  
4. Notification settings persist preferences only (no outbound delivery engine).  
5. Audit export requires `AUDIT:EXPORT`.

### 4.10.5 Screens

Listed in 4.10.2; settings layout uses sticky Administration nav.

### 4.10.6 Validations

Profile/password Zod rules (strength: upper, lower, number, special, min 8); company/security DTO validation.

#### 4.10.6.1 Validation Rule Catalog — Settings / Profile

| Rule ID | Rule |
|---------|------|
| VAL-SET-01 | Password ≥8 with upper, lower, number, special (profile change) |
| VAL-SET-02 | System roles cannot be deleted |
| VAL-SET-03 | `*` permission only for SUPER_ADMIN |
| VAL-SET-04 | User email unique on create |
| VAL-SET-05 | Role clone target must be valid RoleCode |

### 4.10.7 Error Messages

Save success/failure toasts for settings entities; validation messages for password strength.

### 4.10.8 Workflow

```
Admin opens Settings → selects submodule
  → loads settings/users/roles/permissions/audit via API
  → edits → PATCH/POST → confirmation toast
```

#### 4.10.8.1 Happy Path — Create User

```
1. Admin opens /settings/users
2. Creates user with email, name, password, role OPERATOR
3. Password hashed (bcrypt 12); status ACTIVE
4. New user can login; audit records user create
```

---

## 4.11 Notifications

### 4.11.1 Purpose

Allow administrators to configure which notification channels and event types the organization intends to use.

### 4.11.2 Features (Implemented)

| Feature | Status |
|---------|--------|
| Notification settings GET/PATCH | Implemented (`/api/notifications/settings`) |
| Settings UI | `/settings/notifications` |
| Event toggles | `licenseExpiry`, `tripCompleted`, `maintenanceDue`, `fuelReminder`, `expenseApproval`, `newUser`, `roleChanges` |
| Channels | `email`, `inApp` |
| In-app inbox / feed | **Not implemented** |
| Navbar bell | **Stub** (no menu/unread) |
| Email/push delivery | **Not implemented** |

#### 4.11.2.1 Preference Field Catalog

| Channel / Event | Type | Default Intent |
|-----------------|------|----------------|
| email | boolean channel | Preference only |
| inApp | boolean channel | Preference only |
| licenseExpiry | event toggle | Preference only |
| tripCompleted | event toggle | Preference only |
| maintenanceDue | event toggle | Preference only |
| fuelReminder | event toggle | Preference only |
| expenseApproval | event toggle | Preference only |
| newUser | event toggle | Preference only |
| roleChanges | event toggle | Preference only |

### 4.11.3 Business Rules

Preferences stored in `app_settings`; require `NOTIFICATIONS:VIEW` / `NOTIFICATIONS:UPDATE`.

### 4.11.4 Workflow

```
Admin toggles channels/events → Save → persisted preferences
(Delivery engine is future scope)
```

#### 4.11.4.1 Clarifying Note for Stakeholders

Saving preferences does **not** send email or populate an inbox. The navbar bell remains a non-functional stub in the current release.

---

## 4.12 Cross-Module API Envelope & Soft Delete

### 4.12.1 Standard API Response

Successful API responses follow `{ success, message, data, meta }` envelope (see AC-00-04).

### 4.12.2 Soft Delete Pattern

| Field | Purpose |
|-------|---------|
| isDeleted | Boolean flag |
| deletedAt | Timestamp |
| deletedBy | Actor user id |
| List filters | Default queries exclude soft-deleted |

### 4.12.3 Health

`GET /api/health` — public liveness for ops checks.

---

# 5. Business Rules

## 5.1 Vehicle Registration

| Rule ID | Rule |
|---------|------|
| VR-01 | `vehicleId` and `registrationNumber` unique; `vin` sparse unique |
| VR-02 | `maxCapacity` between 1 and 500 (kg) |
| VR-03 | Compliance documents must expire after today on create |
| VR-04 | Expiry within 30 days treated as expiring |
| VR-05 | Service due soon window = 14 days |
| VR-06 | Mileage is monotonic non-decreasing |
| VR-07 | Retired vehicles cannot receive new maintenance |
| VR-08 | Soft-deleted vehicles excluded from operational queries |

### 5.1.1 Vehicle Rule Examples

| Rule | Example Input | Expected Result |
|------|---------------|-----------------|
| VR-02 | maxCapacity=600 | Rejected |
| VR-06 | mileage 12000 → 11999 | Rejected |
| VR-04 | insurance expires in 10 days | EXPIRING status |
| VR-07 | RETIRED + new maintenance | Rejected |

## 5.2 Driver Validation

| Rule ID | Rule |
|---------|------|
| DV-01 | Unique employeeCode, email, phone, licenseNumber |
| DV-02 | License expiry must be in the future for assignability |
| DV-03 | 30-day license expiring window produces warnings on trip validation |
| DV-04 | `SUSPENDED` or expired license → not assignable |
| DV-05 | Safety score 0–100 |
| DV-06 | Experience 0–60 years (UI/DTO constraints) |

### 5.2.1 Driver Rule Examples

| Rule | Example | Result |
|------|---------|--------|
| DV-03 | License expires in 20 days | Warning on trip validate |
| DV-04 | status=SUSPENDED | Not in available drivers |
| DV-05 | safetyScore=105 | Clamped/rejected to 0–100 |

## 5.3 Trip Dispatch

| Rule ID | Rule |
|---------|------|
| TD-01 | New trips start as `DRAFT` with auto `tripNumber` (`TR…`) |
| TD-02 | Updates allowed only in `DRAFT` |
| TD-03 | Dispatch only from `DRAFT`; Start only from `DISPATCHED`; Complete only from `IN_PROGRESS` |
| TD-04 | Cancel allowed from `DRAFT`, `DISPATCHED`, `IN_PROGRESS` |
| TD-05 | Vehicle must be assignable: available, not retired/on-trip/maintenance, compliance valid |
| TD-06 | Driver must be assignable: available, not suspended, license not expired |
| TD-07 | Cargo weight ≤ vehicle maxCapacity |
| TD-08 | No overlapping active trip (`DRAFT`/`DISPATCHED`/`IN_PROGRESS`) for same vehicle or driver |
| TD-09 | Vehicle must not have active maintenance |
| TD-10 | Planned end ≥ planned start |
| TD-11 | Dispatch → vehicle & driver `ON_TRIP` |
| TD-12 | Complete → both `AVAILABLE`; requires actual distance, fuel consumed, revenue |
| TD-13 | Cancel after dispatch/start → restore availability |
| TD-14 | Soft-delete forbidden while `DISPATCHED` or `IN_PROGRESS` (cancel first) |

### 5.3.1 Trip Lifecycle State Machine

```
        create
          │
          ▼
       ┌──────┐  update OK
       │DRAFT │◄──────────┐
       └──┬───┘           │
          │ dispatch      │ (edits only while DRAFT)
          ▼               │
     ┌──────────┐         │
     │DISPATCHED├─────────┘ (no edits)
     └────┬─────┘
          │ start
          ▼
    ┌────────────┐
    │IN_PROGRESS │
    └──────┬─────┘
           │ complete
           ▼
      ┌──────────┐
      │COMPLETED │
      └──────────┘

Cancel may exit from DRAFT, DISPATCHED, or IN_PROGRESS → CANCELLED
```

### 5.3.2 Trip Rule Examples

| Rule | Scenario | Result |
|------|----------|--------|
| TD-07 | Vehicle max 2000kg; cargo 2500 | Reject |
| TD-08 | Driver already ON_TRIP | Conflict |
| TD-03 | Complete from DRAFT | Cannot complete trip in status DRAFT |
| TD-12 | Complete missing fuelConsumed | Validation failure |

## 5.4 Maintenance

| Rule ID | Rule |
|---------|------|
| MN-01 | Active maintenance (`SCHEDULED`/`IN_PROGRESS`) forces vehicle `MAINTENANCE` |
| MN-02 | Only one active maintenance per vehicle |
| MN-03 | Complete restores `AVAILABLE` (if not retired) and updates service dates |
| MN-04 | Costs > 0; schedule dates today or future |
| MN-05 | Completed records limited to notes edits |
| MN-06 | Attachments: ≤10 files, ≤10MB, images/PDF |

### 5.4.1 Maintenance Rule Examples

| Rule | Scenario | Result |
|------|----------|--------|
| MN-02 | Two SCHEDULED WOs same vehicle | Conflict |
| MN-01 | Create SCHEDULED | Vehicle status MAINTENANCE |
| MN-06 | 12MB PDF | Rejected |

## 5.5 Fuel

| Rule ID | Rule |
|---------|------|
| FL-01 | totalCost = round(qty × pricePerLiter, 2) |
| FL-02 | Vehicle business ID required and validated |
| FL-03 | Optional trip/driver business codes validated when provided |
| FL-04 | Soft delete; OPERATOR scoped to creator |

### 5.5.1 Fuel Rule Examples

| qty | price | totalCost |
|-----|-------|-----------|
| 25 | 99.999 | 2500.00 (rounded from 2499.975) |
| 1.005 | 1.005 | 1.01 |

## 5.6 Expense

| Rule ID | Rule |
|---------|------|
| EX-01 | Default status `PENDING` |
| EX-02 | Only `APPROVED` expenses count in operational cost |
| EX-03 | Status transitions via update APIs |
| EX-04 | Reference validation mirrors fuel |
| EX-05 | OPERATOR scoped to creator |

### 5.6.1 Expense Rule Examples

| Status | Included in Cost Aggregates? |
|--------|------------------------------|
| PENDING | No |
| APPROVED | Yes |
| REJECTED | No |

## 5.7 Status Synchronization

| Event | Vehicle | Driver |
|-------|---------|--------|
| Trip dispatch | `ON_TRIP` | `ON_TRIP` |
| Trip complete / cancel (post-dispatch) | `AVAILABLE` | `AVAILABLE` |
| Maintenance active | `MAINTENANCE` | — |
| Maintenance complete/cancel (no other active) | `AVAILABLE` | — |

### 5.7.1 Synchronization ASCII Sequence

```
Vehicle: AVAILABLE ──dispatch──► ON_TRIP ──complete──► AVAILABLE
                └──maint create──► MAINTENANCE ──complete──► AVAILABLE

Driver:  AVAILABLE ──dispatch──► ON_TRIP ──complete──► AVAILABLE
```

## 5.8 Dashboard

| Rule ID | Rule |
|---------|------|
| DB-01 | Requires `DASHBOARD:VIEW` |
| DB-02 | Aggregations exclude soft-deleted records |
| DB-03 | Report export from dashboard requires `REPORTS:EXPORT` |

## 5.9 Reports

| Rule ID | Rule |
|---------|------|
| RP-01 | View requires `REPORTS:VIEW` |
| RP-02 | Export requires `REPORTS:EXPORT` |
| RP-03 | Supported periods: daily, weekly, monthly; analytics ranges 3/6/12 months |

## 5.10 RBAC

| Rule ID | Rule |
|---------|------|
| RB-01 | Authorization is permission-code based (`MODULE:ACTION`) |
| RB-02 | `*` grants all access (Super Admin) |
| RB-03 | Effective permissions = union across assigned roles |
| RB-04 | Frontend filters navigation; backend `PermissionsGuard` is authoritative |
| RB-05 | System roles cannot be deleted |
| RB-06 | `RolesGuard` exists but controllers primarily use `@RequirePermissions` |

### 5.10.1 RBAC Decision Flow

```
Request → JWT AuthGuard → @RequirePermissions(codes)
        → Load roles → union permissions
        → if includes * OR required codes → allow
        → else 403
```


# 6. User Stories

## 6.1 Authentication

| ID | Story |
|----|-------|
| US-AUTH-01 | As a user, I want to sign in with email and password so that I can access TransitOps securely. |
| US-AUTH-02 | As a user, I want my session refreshed automatically so that short-lived access tokens do not interrupt work. |
| US-AUTH-03 | As a user, I want to log out so that my refresh token is invalidated on the server. |
| US-AUTH-04 | As an inactive user, I want login denied so that disabled accounts cannot access the system. |
| US-AUTH-05 | As a security-conscious admin, I want there to be no public self-registration so that only provisioned users can enter. |
| US-AUTH-06 | As a user whose refresh token was stolen and reused, I want the session invalidated so that replay attacks fail. |
| US-AUTH-07 | As a returning user, I want my lastLoginAt updated on successful login so that admins can see activity. |

## 6.2 Dashboard

| ID | Story |
|----|-------|
| US-DASH-01 | As a Fleet Manager, I want KPI overview cards so that I can assess fleet health at a glance. |
| US-DASH-02 | As an Admin, I want alerts for operational risks so that I can act before failures. |
| US-DASH-03 | As a Manager, I want top drivers and vehicles so that I can recognize performance. |
| US-DASH-04 | As a Dispatcher, I want quick actions to create trips and related records so that I can work faster. |
| US-DASH-05 | As a Fleet Manager, I want upcoming maintenance listed so that I can plan downtime. |
| US-DASH-06 | As a Dispatcher, I want recent trips visible so that I can monitor current operations. |
| US-DASH-07 | As a Financial Analyst, I want revenue vs expense charts so that I can spot cost trends. |
| US-DASH-08 | As an authorized exporter, I want dashboard report export gated by REPORTS:EXPORT so that downloads stay controlled. |

## 6.3 Vehicle (Fleet)

| ID | Story |
|----|-------|
| US-VEH-01 | As a Fleet Manager, I want to register vehicles with capacity and compliance dates so that assets are dispatch-ready. |
| US-VEH-02 | As a Fleet Manager, I want to update mileage without decreasing it so that odometer integrity is preserved. |
| US-VEH-03 | As a Dispatcher, I want to see available vehicles so that I can assign trips safely. |
| US-VEH-04 | As a Fleet Manager, I want to soft-delete a vehicle so that historical references remain intact. |
| US-VEH-05 | As a Fleet Manager, I want vehicle statistics cards so that I can see available/on-trip/maintenance counts. |
| US-VEH-06 | As a Fleet Manager, I want to retire a vehicle so that it cannot receive new maintenance. |
| US-VEH-07 | As a Fleet Manager, I want CSV export of the fleet list so that I can share inventory offline. |
| US-VEH-08 | As a Viewer, I want read-only fleet detail so that I can inspect assets without editing. |

## 6.4 Driver

| ID | Story |
|----|-------|
| US-DRV-01 | As a Fleet Manager, I want to onboard drivers with license details so that assignments are compliant. |
| US-DRV-02 | As a Safety Officer, I want to update driver status and safety score so that risk is managed. |
| US-DRV-03 | As a Dispatcher, I want available drivers listed so that I can staff trips. |
| US-DRV-04 | As a Safety Officer, I want expired/suspended drivers blocked from assignment so that safety policy is enforced. |
| US-DRV-05 | As a Safety Officer, I want license EXPIRING warnings within 30 days so that renewals are prompted. |
| US-DRV-06 | As a Fleet Manager, I want unique employee codes so that HR identifiers do not collide. |
| US-DRV-07 | As a Fleet Manager, I want soft-delete for drivers so that past trip history remains referable. |
| US-DRV-08 | As a Viewer, I want driver roster visibility without edit rights so that oversight is read-only. |

## 6.5 Trip

| ID | Story |
|----|-------|
| US-TRP-01 | As a Fleet Manager, I want to assign available drivers and vehicles so that trips can be dispatched safely. |
| US-TRP-02 | As a Dispatcher, I want to start a dispatched trip so that actual start time is recorded. |
| US-TRP-03 | As a Dispatcher, I want to complete a trip with actuals so that revenue and fuel consumption are captured. |
| US-TRP-04 | As a Dispatcher, I want to cancel a trip with a reason so that aborted work is auditable. |
| US-TRP-05 | As an Operator, I want to see only my relevant trip data (scoped) so that access stays least-privilege. |
| US-TRP-06 | As a Dispatcher, I want over-capacity cargo rejected so that vehicles are not overloaded. |
| US-TRP-07 | As a Dispatcher, I want overlapping active trips blocked so that double-booking cannot occur. |
| US-TRP-08 | As a Dispatcher, I want draft-only edits so that in-flight trips remain stable. |

## 6.6 Maintenance

| ID | Story |
|----|-------|
| US-MNT-01 | As a Safety Officer, I want to schedule maintenance so that vehicles remain roadworthy. |
| US-MNT-02 | As a Fleet Manager, I want active maintenance to mark the vehicle unavailable so that dispatch conflicts are prevented. |
| US-MNT-03 | As a Technician user, I want to attach invoices/photos so that work evidence is stored. |
| US-MNT-04 | As a Fleet Manager, I want completion to restore availability and update service dates so that records stay current. |
| US-MNT-05 | As a Fleet Manager, I want only one active maintenance per vehicle so that shop status stays unambiguous. |
| US-MNT-06 | As a Safety Officer, I want priority levels (LOW–CRITICAL) so that urgent work is visible. |
| US-MNT-07 | As a Fleet Manager, I want to cancel scheduled work so that the vehicle can return to AVAILABLE. |
| US-MNT-08 | As a Viewer, I want to view maintenance history so that I can audit downtime without changes. |

## 6.7 Fuel

| ID | Story |
|----|-------|
| US-FUL-01 | As an Operator, I want to log a fuel fill so that consumption is tracked. |
| US-FUL-02 | As a Financial Analyst, I want fuel cost auto-calculated so that math errors are reduced. |
| US-FUL-03 | As a Financial Analyst, I want vehicle fuel comparison so that inefficient assets are identified. |
| US-FUL-04 | As an Operator, I want my fuel list scoped to records I created so that peer data stays private. |
| US-FUL-05 | As a Financial Analyst, I want to edit fuel logs so that corrections are possible. |
| US-FUL-06 | As a Fleet Manager, I want to create fuel logs so that depot fills are recorded. |
| US-FUL-07 | As a user, I want future fill dates blocked so that data entry errors are reduced. |
| US-FUL-08 | As a Financial Analyst, I want fuel statistics by date range so that monthly spend is clear. |

## 6.8 Expense

| ID | Story |
|----|-------|
| US-EXP-01 | As a Financial Analyst, I want to record tolls and parking so that trip costs are complete. |
| US-EXP-02 | As a Financial Analyst, I want to approve or reject expenses so that only valid costs hit reports. |
| US-EXP-03 | As a Manager, I want expense-by-category charts so that spend patterns are visible. |
| US-EXP-04 | As a Financial Analyst, I want new expenses to default to PENDING so that nothing posts without review. |
| US-EXP-05 | As a Financial Analyst, I want rejected expenses excluded from cost totals so that analytics stay accurate. |
| US-EXP-06 | As a Viewer, I want read-only expense lists so that finance oversight does not imply edit rights. |
| US-EXP-07 | As a user, I want future expense dates blocked so that posting mistakes are avoided. |

## 6.9 Reports

| ID | Story |
|----|-------|
| US-RPT-01 | As a Financial Analyst, I want period reports so that I can review business performance. |
| US-RPT-02 | As a Financial Analyst, I want CSV/PDF export so that I can share results offline. |
| US-RPT-03 | As a Viewer, I want read-only analytics so that stakeholders stay informed without edits. |
| US-RPT-04 | As a Fleet Manager, I want REPORTS:VIEW so that I can review operational summaries without export. |
| US-RPT-05 | As a Safety Officer, I want reports view so that compliance trends are visible. |
| US-RPT-06 | As a user without EXPORT permission, I want export controls hidden/denied so that downloads stay privileged. |

## 6.10 Settings

| ID | Story |
|----|-------|
| US-SET-01 | As an Admin, I want to create users and assign roles so that the organization is governed. |
| US-SET-02 | As an Admin, I want to edit role permissions so that access matches job functions. |
| US-SET-03 | As an Admin, I want audit export so that compliance reviews are supported. |
| US-SET-04 | As any user, I want to update my profile/password so that my account stays secure. |
| US-SET-05 | As a user, I want appearance settings (theme/sidebar) so that the UI matches my preference. |
| US-SET-06 | As an Admin, I want to configure company profile (currency, timezone) so that displays match the org. |
| US-SET-07 | As an Admin, I want system roles protected from deletion so that baseline RBAC remains intact. |
| US-SET-08 | As an Admin, I want to clone role permissions so that new role variants are faster to create. |

## 6.11 Notifications

| ID | Story |
|----|-------|
| US-NTF-01 | As an Admin, I want to configure notification event preferences so that future delivery channels are prepared. |
| US-NTF-02 | As an Admin, I want to toggle email vs in-app channels so that preferred channels are recorded. |
| US-NTF-03 | As a stakeholder, I understand the navbar bell is a stub so that I do not expect an inbox in v1.0.0. |

---

# 7. Acceptance Criteria

## 7.1 Cross-Cutting

| ID | Criterion |
|----|-----------|
| AC-00-01 | Unauthenticated access to protected pages redirects to `/login`. |
| AC-00-02 | API protected routes without Bearer token return 401. |
| AC-00-03 | API calls lacking required permission return 403. |
| AC-00-04 | Successful API responses follow `{ success, message, data, meta }` envelope. |
| AC-00-05 | Soft-deleted entities do not appear in default list queries. |
| AC-00-06 | Swagger documentation is available at `/api/docs` in development. |
| AC-00-07 | Shared enums in `packages/shared-types` match backend/frontend usage for statuses. |
| AC-00-08 | Health endpoint `GET /api/health` returns without authentication. |

## 7.2 Authentication

| ID | Criterion |
|----|-----------|
| AC-AUTH-01 | Valid ACTIVE user receives access + refresh tokens. |
| AC-AUTH-02 | Inactive user receives forbidden response. |
| AC-AUTH-03 | Refresh rotates token and invalidates previous hash. |
| AC-AUTH-04 | Replayed old refresh token fails and clears hash. |
| AC-AUTH-05 | Login with password shorter than 8 characters fails validation. |
| AC-AUTH-06 | Logout clears server-side refresh token hash. |
| AC-AUTH-07 | No public registration route or API exists in the release. |
| AC-AUTH-08 | Successful login updates `lastLoginAt`. |

## 7.3 Fleet / Drivers

| ID | Criterion |
|----|-----------|
| AC-VEH-01 | Duplicate registrationNumber rejected. |
| AC-VEH-02 | Decreasing mileage rejected. |
| AC-VEH-03 | maxCapacity outside 1–500 rejected. |
| AC-VEH-04 | Soft-deleted vehicle excluded from available list. |
| AC-VEH-05 | Compliance expiry on create must be after today. |
| AC-VEH-06 | Service due within 14 days marked DUE_SOON. |
| AC-DRV-01 | Duplicate employeeCode rejected. |
| AC-DRV-02 | Driver with expired license not returned as assignable / fails trip validation. |
| AC-DRV-03 | Suspended driver cannot be assigned to a trip. |
| AC-DRV-04 | Safety score outside 0–100 rejected or clamped per service rules. |
| AC-DRV-05 | Phone must be exactly 10 digits on validated forms. |
| AC-DRV-06 | Soft-deleted driver excluded from available drivers. |

## 7.4 Trips

| ID | Criterion |
|----|-----------|
| AC-TRP-01 | Dispatch changes trip to DISPATCHED and resources to ON_TRIP. |
| AC-TRP-02 | Completing DRAFT trip is rejected. |
| AC-TRP-03 | Over-capacity cargo rejected. |
| AC-TRP-04 | Second active trip for same vehicle rejected. |
| AC-TRP-05 | Complete restores AVAILABLE and stores actuals. |
| AC-TRP-06 | Start is allowed only from DISPATCHED. |
| AC-TRP-07 | Cancel from IN_PROGRESS restores vehicle and driver to AVAILABLE. |
| AC-TRP-08 | Soft delete while DISPATCHED is rejected with cancel-first guidance. |
| AC-TRP-09 | Update while COMPLETED is rejected (draft-only updates). |
| AC-TRP-10 | OPERATOR without broader roles cannot read another user’s trips. |
| AC-TRP-11 | Active maintenance on vehicle blocks dispatch. |
| AC-TRP-12 | tripNumber is auto-generated with TR prefix. |

## 7.5 Maintenance / Fuel / Expense

| ID | Criterion |
|----|-----------|
| AC-MNT-01 | Creating active maintenance sets vehicle MAINTENANCE. |
| AC-MNT-02 | Second active maintenance for same vehicle rejected. |
| AC-MNT-03 | Complete restores AVAILABLE when vehicle not retired. |
| AC-MNT-04 | Attachment over 10MB rejected. |
| AC-MNT-05 | Retired vehicle cannot receive new maintenance. |
| AC-MNT-06 | Completed maintenance allows notes-only edits. |
| AC-FUL-01 | totalCost equals rounded quantity × pricePerLiter. |
| AC-FUL-02 | Missing vehicleId rejected. |
| AC-FUL-03 | Future filledAt rejected in UI validation. |
| AC-FUL-04 | OPERATOR sees only self-created fuel logs when scoped. |
| AC-EXP-01 | New expense defaults to PENDING. |
| AC-EXP-02 | Cost services include only APPROVED expenses. |
| AC-EXP-03 | REJECTED expenses excluded from operational cost. |
| AC-EXP-04 | Future expenseDate rejected in UI validation. |
| AC-EXP-05 | EXPENSE:APPROVE required path for approval-capable users (Financial Analyst seed). |

## 7.6 Reports / Settings

| ID | Criterion |
|----|-----------|
| AC-RPT-01 | User without REPORTS:EXPORT cannot export. |
| AC-RPT-02 | Periods daily/weekly/monthly accepted on reports. |
| AC-RPT-03 | Analytics supports 3/6/12 month ranges. |
| AC-SET-01 | System role delete rejected. |
| AC-SET-02 | Audit CSV downloadable with AUDIT:EXPORT. |
| AC-SET-03 | Password change enforces complexity (upper/lower/number/special/min 8). |
| AC-SET-04 | Admin can assign multiple roles; effective permissions are union. |
| AC-NTF-01 | Notification preference PATCH persists channels and event flags. |
| AC-NTF-02 | Navbar bell does not open an inbox (stub behavior documented). |

## 7.7 Traceability Matrix (User Story → Acceptance Criteria → Module)

| User Story | Acceptance Criteria | Module |
|------------|---------------------|--------|
| US-AUTH-01 | AC-AUTH-01, AC-AUTH-05 | 4.1 Authentication |
| US-AUTH-02 | AC-AUTH-03 | 4.1 Authentication |
| US-AUTH-03 | AC-AUTH-06 | 4.1 Authentication |
| US-AUTH-04 | AC-AUTH-02 | 4.1 Authentication |
| US-AUTH-05 | AC-AUTH-07 | 4.1 Authentication |
| US-AUTH-06 | AC-AUTH-04 | 4.1 Authentication |
| US-AUTH-07 | AC-AUTH-08 | 4.1 Authentication |
| US-DASH-01 | AC-00-03, DB rules | 4.2 Dashboard |
| US-DASH-02 | Dashboard alerts load | 4.2 Dashboard |
| US-DASH-08 | AC-RPT-01 | 4.2 / 4.9 |
| US-VEH-01 | AC-VEH-01, AC-VEH-03, AC-VEH-05 | 4.3 Fleet |
| US-VEH-02 | AC-VEH-02 | 4.3 Fleet |
| US-VEH-03 | AC-VEH-04 | 4.3 Fleet |
| US-VEH-04 | AC-00-05 | 4.3 Fleet |
| US-DRV-01 | AC-DRV-01, AC-DRV-05 | 4.4 Driver |
| US-DRV-02 | AC-DRV-04 | 4.4 Driver |
| US-DRV-04 | AC-DRV-02, AC-DRV-03 | 4.4 Driver |
| US-TRP-01 | AC-TRP-01, AC-TRP-11 | 4.5 Trip |
| US-TRP-02 | AC-TRP-06 | 4.5 Trip |
| US-TRP-03 | AC-TRP-05 | 4.5 Trip |
| US-TRP-04 | AC-TRP-07 | 4.5 Trip |
| US-TRP-05 | AC-TRP-10 | 4.5 Trip |
| US-TRP-06 | AC-TRP-03 | 4.5 Trip |
| US-TRP-07 | AC-TRP-04 | 4.5 Trip |
| US-TRP-08 | AC-TRP-09 | 4.5 Trip |
| US-MNT-01 | AC-MNT-01 | 4.6 Maintenance |
| US-MNT-02 | AC-MNT-01, AC-TRP-11 | 4.6 / 4.5 |
| US-MNT-03 | AC-MNT-04 | 4.6 Maintenance |
| US-MNT-04 | AC-MNT-03 | 4.6 Maintenance |
| US-MNT-05 | AC-MNT-02 | 4.6 Maintenance |
| US-FUL-01 | AC-FUL-02 | 4.7 Fuel |
| US-FUL-02 | AC-FUL-01 | 4.7 Fuel |
| US-FUL-04 | AC-FUL-04 | 4.7 Fuel |
| US-EXP-01 | AC-EXP-01 | 4.8 Expense |
| US-EXP-02 | AC-EXP-02, AC-EXP-05 | 4.8 Expense |
| US-EXP-05 | AC-EXP-03 | 4.8 Expense |
| US-RPT-02 | AC-RPT-01 | 4.9 Reports |
| US-RPT-01 | AC-RPT-02 | 4.9 Reports |
| US-SET-01 | AC-SET-04 | 4.10 Settings |
| US-SET-02 | AC-SET-01 | 4.10 Settings |
| US-SET-03 | AC-SET-02 | 4.10 Settings |
| US-SET-04 | AC-SET-03 | 4.10 / Profile |
| US-NTF-01 | AC-NTF-01 | 4.11 Notifications |
| US-NTF-03 | AC-NTF-02 | 4.11 Notifications |

### 7.7.1 Business Goal → Story Traceability (Sample)

| Goal | Representative Stories |
|------|------------------------|
| BG-01 | US-VEH-01, US-DRV-01, US-TRP-01, US-MNT-01, US-FUL-01, US-EXP-01 |
| BG-02 | US-TRP-06, US-TRP-07, US-DRV-04, US-MNT-02 |
| BG-03 | US-DASH-01, US-RPT-01, US-RPT-02, US-FUL-03, US-EXP-03 |
| BG-04 | US-SET-01, US-SET-02, US-AUTH-05 |
| BG-05 | Documented modules + shared-types + seeds (handover) |

---

# 8. Non-Functional Requirements

## 8.1 Performance

| ID | Requirement | Implementation Notes | Measurable Target |
|----|-------------|----------------------|-------------------|
| NFR-P-01 | List endpoints paginated | `page` / `limit` query DTOs | Default page sizes keep payloads bounded; UI lists paginate |
| NFR-P-02 | Hot-path indexes on status, dates, soft-delete | Declared in Mongoose schemas | Query plans use status/isDeleted indexes in production Mongo |
| NFR-P-03 | Dashboard uses aggregation services | Dedicated dashboard/analytics services | Dashboard parallel fetches complete under typical LAN latency without sequential waterfall |
| NFR-P-04 | Frontend caching | TanStack Query `staleTime` 30s | Repeated navigation within 30s uses cache |
| NFR-P-05 | JWT access short-lived | Default 15m access token | Limits stolen-token window |
| NFR-P-06 | Attachment size limits | 10MB × 10 files | Caps upload bandwidth/storage spikes |

### 8.1.1 Performance Testing Notes

| Scenario | Expected Behavior |
|----------|-------------------|
| Fleet list 100+ vehicles | Paginated response; UI remains interactive |
| Dashboard cold load | Multiple GETs in parallel via React Query |
| Fuel statistics date range | Aggregation returns series without full collection dump to client |

## 8.2 Scalability

Horizontal scaling of NestJS stateless API behind load balancer; MongoDB as shared store; JWT auth requires no sticky sessions. Current release is single-tenant.

### 8.2.1 Scalability Targets (Reasonable)

| Dimension | Target / Guidance |
|-----------|-------------------|
| API instances | Stateless; scale horizontally behind LB |
| Session affinity | Not required (JWT) |
| Tenant model | Single organization per deployment |
| Upload storage | Local disk limits multi-instance unless shared volume/object storage added |

## 8.3 Availability

Health endpoint `GET /api/health` returns service liveness. No formal SLA document in repo; production availability depends on hosting.

### 8.3.1 Availability Targets (Operational Guidance)

| ID | Target | Notes |
|----|--------|-------|
| NFR-A-01 | Health check usable by uptime monitors | `/api/health` public |
| NFR-A-02 | Planned maintenance windows communicated by ops | App does not implement maintenance mode page |
| NFR-A-03 | Soft delete reduces accidental data loss | Recovery possible until wipe/hard purge |

## 8.4 Security

| Control | Status |
|---------|--------|
| JWT Bearer auth | Implemented |
| Refresh rotation + hashed storage | Implemented |
| Password bcrypt cost 12 | Implemented |
| Helmet | Enabled |
| CORS allowlist | `CORS_ORIGINS` |
| Global ValidationPipe whitelist | Enabled |
| RBAC PermissionsGuard | Enabled |
| Rate limiting | **Not implemented** |
| Login lockout enforcement | Fields exist; **not enforced in login path** |

### 8.4.1 Security Measurable Targets

| ID | Target |
|----|--------|
| NFR-S-01 | Access token default TTL ≤ 15 minutes (configurable via env) |
| NFR-S-02 | Refresh token stored as SHA-256 hash, not plaintext |
| NFR-S-03 | Password hashing cost factor = 12 |
| NFR-S-04 | JWT secrets ≥ 16 characters (recommend 32+) |
| NFR-S-05 | CORS restricted to configured origins |
| NFR-S-06 | No public registration endpoint exposed |

## 8.5 Accessibility

Semantic HTML via Radix primitives; keyboard-accessible dialogs/menus. No formal WCAG audit artifact in repository; theme contrast depends on light/dark CSS variables.

### 8.5.1 Accessibility Guidance Targets

| ID | Guidance |
|----|----------|
| NFR-AC-01 | Dialogs and menus operable via keyboard (Radix) |
| NFR-AC-02 | Theme toggle supports light and dark preference |
| NFR-AC-03 | Form labels present on major create/edit forms |

## 8.6 Responsiveness

Layouts support desktop sidebar and mobile drawer; tables have mobile card alternatives on major list pages.

### 8.6.1 Breakpoint Expectations

| Viewport | Expectation |
|----------|-------------|
| Desktop | Sidebar navigation; full tables |
| Tablet/Mobile | Drawer nav; card/list alternatives on major modules |

## 8.7 Maintainability

Monorepo workspaces; shared-types package; Nest module boundaries; repository pattern; ESLint + Prettier; Jest unit tests for key modules (trip, maintenance, fleet, fuel, expense, dashboard, settings, guards).

### 8.7.1 Maintainability Targets

| ID | Target |
|----|--------|
| NFR-M-01 | Domain enums centralized in `packages/shared-types` |
| NFR-M-02 | Feature modules isolated under `apps/backend/src/modules/*` |
| NFR-M-03 | Critical business rules covered by Jest specs (trip/fuel/expense/guards) |
| NFR-M-04 | Swagger available for API contract exploration |

## 8.8 Audit Logging

`audit_logs` collection with module/action indexes; UI list + CSV export; actions include LOGIN, CRUD, STATUS_CHANGE, ROLE_CHANGE, PASSWORD_CHANGE, SETTINGS_UPDATE, etc.

### 8.8.1 Audit Targets

| ID | Target |
|----|--------|
| NFR-AU-01 | Administrative mutations produce audit entries |
| NFR-AU-02 | Audit export requires `AUDIT:EXPORT` |
| NFR-AU-03 | Activity timeline available under `/settings/activity` |

## 8.9 Monitoring

Winston logging on backend. No APM/metrics stack shipped in-repo.

### 8.9.1 Monitoring Guidance

| ID | Guidance |
|----|----------|
| NFR-MO-01 | Application logs via Winston |
| NFR-MO-02 | External APM left to hosting (future) |

## 8.10 Backup

Operational responsibility of MongoDB hosting (Atlas or self-managed). Soft delete reduces accidental hard loss; wipe script exists for **dev only** (`seed`/`wipe` tooling).

### 8.10.1 Data Resilience Notes

| Mechanism | Scope |
|-----------|-------|
| Soft delete | Operational entities |
| MongoDB backups | Hosting responsibility |
| Wipe script | Development reset only — not production tool |

## 8.11 Reliability of Domain Invariants

| ID | Invariant | Enforcement |
|----|-----------|-------------|
| NFR-R-01 | Trip lifecycle ordering | Service transition checks |
| NFR-R-02 | Fuel totalCost rounding | Service + pre-save computation |
| NFR-R-03 | Vehicle/driver status sync on trip events | Trip service side effects |
| NFR-R-04 | Maintenance exclusivity per vehicle | Conflict checks |

---

# 9. Assumptions

1. Operators have modern evergreen browsers and network access to API origin.  
2. MongoDB is provisioned and `MONGODB_URI` is valid.  
3. JWT secrets are strong (≥16 chars; example recommends 32+) and distinct for access/refresh.  
4. Admin seed credentials are changed before production use.  
5. Business IDs for vehicles/drivers/trips used in fuel/expense match registered codes.  
6. Single organization per deployment (no multi-tenant partitioning).  
7. File uploads remain on local/server disk path served at `/uploads` unless ops relocates storage.  
8. Frontend `NEXT_PUBLIC_API_URL` points to the live API (`/api` prefix included).  

### 9.1 Additional Assumptions

9. Seeded demo users are acceptable only in non-production environments.  
10. Currency/timezone from company settings are display preferences, not multi-currency ledgers.  
11. OPERATOR accounts are intentionally driver-facing; there is no separate `DRIVER` role code.  
12. Notification preference configuration implies future delivery, not current delivery.  
13. Clients accept that navbar notification bell is non-functional in v1.0.0.  
14. Capacity domain unit is kilograms as implemented (`maxCapacity` 1–500).  

---

# 10. Constraints

| ID | Constraint |
|----|------------|
| C-01 | Node.js ≥ 20 required |
| C-02 | Yarn workspaces monorepo |
| C-03 | No public self-registration |
| C-04 | Vehicle max capacity capped at 500 kg in domain rules |
| C-05 | Maintenance attachments limited to 10 × 10MB images/PDF |
| C-06 | Auth gate is client ProtectedShell (no Next.js middleware.ts) |
| C-07 | Docker not provided in repository |
| C-08 | Notification delivery out of scope for current release |
| C-09 | Fuel/Expense vehicle refs are business string IDs (not always Mongo ObjectIds) |

### 10.1 Additional Constraints

| ID | Constraint |
|----|------------|
| C-10 | Fleet UI routes live under `/fleet` (not `/vehicles`) |
| C-11 | Trip lifecycle states limited to DRAFT, DISPATCHED, IN_PROGRESS, COMPLETED, CANCELLED |
| C-12 | Eight seeded role codes only in default RBAC set |
| C-13 | Single-tenant deployment model |
| C-14 | Rate limiting not configured in Nest app |
| C-15 | Soft delete is logical; physical purge is ops-controlled |

---

# 11. Risks

| ID | Risk | Impact | Mitigation |
|----|------|--------|------------|
| RK-01 | Client-side nav RBAC bypass via deep URL | Medium | Backend PermissionsGuard remains authoritative |
| RK-02 | Account lockout settings unused by login | Medium | Enforce lockout in AuthService or document as future |
| RK-03 | Local upload storage not durable across hosts | High in multi-instance | Move to object storage for production |
| RK-04 | No rate limiting | Medium | Add throttling at API gateway or Nest throttler |
| RK-05 | Dual vehicle module paths (fleet vs vehicle helper) | Low–Med | Document ownership; avoid divergent schemas |
| RK-06 | Notification UX expectations vs prefs-only | Medium | Communicate future scope clearly |
| RK-07 | Demo passwords in UI/README | High if prod | Rotate secrets; remove demo panel in production builds |

### 11.1 Additional Risks

| ID | Risk | Impact | Mitigation |
|----|------|--------|------------|
| RK-08 | OPERATOR ownership scoping misunderstood as full fleet privacy | Medium | Document createdBy scoping rules in FRD/SRS |
| RK-09 | Business ID mismatches on fuel/expense refs | Medium | ReferenceValidationService + user training |
| RK-10 | Soft-deleted records still referenced historically | Low | Keep soft delete; avoid hard delete in ops |
| RK-11 | Security settings imply 2FA/lockout that are incomplete | Medium | Label as preference/future in admin UI docs |

---

# 12. Future Scope

| Initiative | Description |
|------------|-------------|
| AI Route Optimization | Suggest efficient routes/assignments from historical trip data |
| GPS Tracking | Device/telemetry ingestion for vehicles |
| Real-Time Tracking | Live map and ETA updates (WebSockets) |
| Notification Engine | Email/in-app delivery for configured events; functional navbar inbox |
| Mobile App | Native or PWA field workflows for operators |
| Multi-Tenant Support | Organization isolation, branding, and data partitioning |
| Rate Limiting & Hardened Auth | Throttling, enforced lockout, optional 2FA |
| Object Storage | Durable attachment/photo storage |

### 12.1 Future Scope Explicitly Not Claiming Current Delivery

| Item | Current State |
|------|---------------|
| Public registration | Out of scope — admin/seed provisioning only |
| Push/email sending | Preferences only |
| Live maps | Not implemented |
| Docker/K8s manifests | Not in repository |

---

# 13. Appendix

## 13.1 Glossary

| Term | Definition |
|------|------------|
| TransitOps | Product name for the fleet & transport management system |
| FRD | Functional Requirements Document |
| RBAC | Role-Based Access Control implemented via permission codes |
| Soft delete | Logical deletion via `isDeleted` / `deletedAt` without physical remove |
| Dispatch | Transition of a draft trip into assigned execution (`DISPATCHED`) |
| Business ID | Human-readable code (e.g., vehicleId `VH-1001`, employeeCode, tripNumber) |
| OPERATOR | Role used for driver/field operator accounts |
| App settings | Singleton configuration document (`key: default`) |

### 13.1.1 Extended Glossary

| Term | Definition |
|------|------------|
| SUPER_ADMIN | Platform owner role with wildcard permission `*` |
| ADMIN | Organization administrator with full permission catalog |
| FLEET_MANAGER | Operations lead for vehicles, drivers, trips, maintenance, fuel create |
| DISPATCHER | Trip lifecycle coordinator |
| SAFETY_OFFICER | Driver compliance and maintenance scheduler |
| FINANCIAL_ANALYST | Fuel/expense and report export specialist |
| VIEWER | Read-only stakeholder across core modules |
| PermissionsGuard | Nest guard enforcing `@RequirePermissions` |
| ProtectedShell | Frontend auth gate redirecting to `/login` |
| tripNumber | Auto-generated trip identifier with `TR` prefix |
| maintenanceNumber | Auto-generated maintenance identifier with `MNT` prefix |
| totalCost | Fuel computed field `round(quantity * pricePerLiter, 2)` |
| EXPIRING | Compliance/license window within 30 days of expiry |
| DUE_SOON | Service due within 14 days |
| fuel-expenses hub | Combined UI surface at `/fuel-expenses` |
| Audit log | Persisted record of administrative/security-relevant actions |
| Seed | Database initialization scripts for roles/users/demo data |
| shared-types | Yarn package exporting enums and interfaces |
| Refresh rotation | Issuing new refresh token and invalidating prior hash |
| Ownership scoping | Filtering list/read by `createdBy === user.sub` for OPERATOR-only |

## 13.2 Terminology — Status Enums

| Domain | Values |
|--------|--------|
| Vehicle | AVAILABLE, ON_TRIP, MAINTENANCE, RETIRED, ACTIVE, IN_SERVICE |
| Driver | AVAILABLE, ON_TRIP, SUSPENDED, OFF_DUTY |
| Trip | DRAFT, DISPATCHED, IN_PROGRESS, COMPLETED, CANCELLED |
| Maintenance | SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED |
| Expense | PENDING, APPROVED, REJECTED |
| User | ACTIVE, INACTIVE |

### 13.2.1 Additional Enum Catalogs

| Domain | Enum | Values |
|--------|------|--------|
| Vehicle type | VehicleType | BUS, MINIBUS, TRUCK, VAN, SEDAN, SUV, OTHER |
| Fuel type | FuelType | DIESEL, PETROL, CNG, ELECTRIC, HYBRID, OTHER |
| Cargo | CargoType | GENERAL, FRAGILE, HAZARDOUS, PERISHABLE, BULK, OTHER |
| License category | LicenseCategory | LMV, HMV, CDL_A, CDL_B, CDL_C, MCWG, OTHER |
| License status | LicenseStatus | VALID, EXPIRING, EXPIRED |
| Compliance | ComplianceStatus | VALID, EXPIRING, EXPIRED |
| Service due | ServiceDueStatus | OK, DUE_SOON, OVERDUE |
| Maintenance type | MaintenanceType | PREVENTIVE, CORRECTIVE, EMERGENCY, OIL_CHANGE, TYRE_REPLACEMENT, ENGINE_REPAIR, BRAKE_SERVICE, BATTERY_REPLACEMENT, INSPECTION |
| Priority | MaintenancePriority | LOW, MEDIUM, HIGH, CRITICAL |
| Expense type | ExpenseType | TOLL, PARKING, REPAIR, MAINTENANCE, INSURANCE, CLEANING, TAX, PERMIT, FINE, OTHER |
| Blood group | BloodGroup | A+, A-, B+, B-, AB+, AB-, O+, O-, UNKNOWN |

## 13.3 Permission Codes

Format: `MODULE:ACTION`  
Modules: VEHICLE, DRIVER, TRIP, MAINTENANCE, FUEL, EXPENSE, DASHBOARD, REPORTS, SETTINGS, USERS, ROLES, PERMISSIONS, NOTIFICATIONS, AUDIT, PROFILE  
Special: `*`

### 13.3.1 Complete Permission Code List

| Code |
|------|
| VEHICLE:VIEW, VEHICLE:CREATE, VEHICLE:UPDATE, VEHICLE:DELETE |
| DRIVER:VIEW, DRIVER:CREATE, DRIVER:UPDATE, DRIVER:DELETE |
| TRIP:VIEW, TRIP:CREATE, TRIP:DISPATCH, TRIP:COMPLETE, TRIP:CANCEL, TRIP:UPDATE, TRIP:DELETE |
| MAINTENANCE:VIEW, MAINTENANCE:CREATE, MAINTENANCE:UPDATE, MAINTENANCE:DELETE, MAINTENANCE:COMPLETE |
| FUEL:VIEW, FUEL:CREATE, FUEL:UPDATE, FUEL:DELETE |
| EXPENSE:VIEW, EXPENSE:CREATE, EXPENSE:UPDATE, EXPENSE:DELETE, EXPENSE:APPROVE |
| DASHBOARD:VIEW |
| REPORTS:VIEW, REPORTS:EXPORT |
| SETTINGS:VIEW, SETTINGS:UPDATE |
| USERS:VIEW, USERS:CREATE, USERS:UPDATE, USERS:DELETE |
| ROLES:VIEW, ROLES:CREATE, ROLES:UPDATE, ROLES:DELETE |
| PERMISSIONS:VIEW, PERMISSIONS:UPDATE |
| NOTIFICATIONS:VIEW, NOTIFICATIONS:UPDATE |
| AUDIT:VIEW, AUDIT:EXPORT |
| PROFILE:VIEW, PROFILE:UPDATE |
| `*` (SUPER_ADMIN only) |

## 13.4 Demo Accounts (Development Seed)

| Email | Password | Role |
|-------|----------|------|
| admin@transitops.com | Admin@12345 | Super Admin |
| fleet@transitops.com | Fleet@12345 | Fleet Manager |
| finance@transitops.com | Finance@12345 | Financial Analyst |
| driver@transitops.com | Driver@12345 | Operator |
| safety@transitops.com | Safety@12345 | Safety Officer |

> **Security note:** Rotate or disable demo credentials before any production deployment.

## 13.5 References

1. Repository README — `/README.md`  
2. Swagger UI — `http://localhost:4000/api/docs`  
3. Trip module README — `apps/backend/src/modules/trip/README.md`  
4. Maintenance README — `apps/backend/src/modules/maintenance/README.md`  
5. Dashboard README — `apps/backend/src/modules/dashboard/README.md`  
6. Settings README — `apps/backend/src/modules/settings/README.md`  
7. Fuel & Expense README — `apps/backend/FUEL_EXPENSE_README.md`  
8. Permission catalog — `apps/backend/src/modules/permissions/permission.catalog.ts`  
9. Shared types — `packages/shared-types`  
10. Companion document — `SRS.md` (Software Requirements Specification)

## 13.6 Document Control

| Item | Value |
|------|-------|
| Next review | Upon major module release |
| Owner | Product / Solution Architecture |
| Distribution | Client, Hackathon judges, Engineering, QA |

## 13.7 Master Error Message Catalog (Cross-Module)

| Module | Condition | Message / Behavior |
|--------|-----------|--------------------|
| Auth | Bad credentials | Unable to sign in |
| Auth | Inactive | User account is inactive |
| Auth | Refresh reuse | 401; clear session |
| Fleet | Duplicate IDs | Conflict |
| Fleet | Mileage decrease | Must not decrease |
| Drivers | Duplicate codes | Conflict |
| Drivers | License/phone validation | Field-specific Zod/API messages |
| Trips | Non-draft update | Only draft trips can be updated |
| Trips | Delete active | Cancel the trip before deleting an active dispatch |
| Trips | Bad transition | Cannot {action} trip in status {status} |
| Trips | OPERATOR scope | You can only view your own trips |
| Maintenance | Concurrent active | Conflict |
| Fuel | Cost | Computed; validation on qty/price |
| Expense | Future date | Expense date cannot be in the future |
| Reports | Export denied | 403 / failed export toast |
| Settings | Weak password | Complexity messages from Zod |
| Notifications | N/A delivery | Preferences saved; no send |

## 13.8 Master Validation Catalog Index

| Module | Catalog Section |
|--------|-----------------|
| Auth | §4.1.8.1 |
| Fleet | §4.3.8.1 |
| Driver | §4.4.8.1 |
| Trip | §4.5.8.1 |
| Maintenance | §4.6.8.1 |
| Fuel | §4.7.8.1 |
| Expense | §4.8.8.1 |
| Settings | §4.10.6.1 |

## 13.9 End-to-End Workflow Catalog

### 13.9.1 Ops Day — Dispatch to Complete

```
Login (DISPATCHER)
  → Dashboard review
  → /trips/new (DRAFT)
  → Dispatch → ON_TRIP
  → Start → IN_PROGRESS
  → Complete actuals → COMPLETED + AVAILABLE
  → Finance reviews fuel/expenses
  → /reports export (FINANCIAL_ANALYST)
```

### 13.9.2 Safety Day — Maintenance Lock

```
Login (SAFETY_OFFICER)
  → /drivers review EXPIRING licenses
  → /maintenance/new SCHEDULED
  → Vehicle MAINTENANCE
  → Dispatcher dispatch attempt blocked
  → Complete maintenance → AVAILABLE
```

### 13.9.3 Admin Day — Provision Operator

```
Login (ADMIN)
  → /settings/users create OPERATOR
  → Assign role OPERATOR
  → Operator logs fuel at /fuel/new
  → totalCost auto-calculated
  → Audit log shows user create + fuel create
```

## 13.10 Environment Variables (Informative)

| Variable | App | Purpose |
|----------|-----|---------|
| MONGODB_URI | Backend | Database connection |
| JWT_SECRET | Backend | Access token signing |
| JWT_REFRESH_SECRET | Backend | Refresh token signing |
| CORS_ORIGINS | Backend | Allowed browser origins |
| NEXT_PUBLIC_API_URL | Frontend | API base including `/api` |
| SEED_ADMIN_* | Backend seeds | Optional admin seed overrides |

## 13.11 Document Expansion Map (This Release)

| Expansion Area | Sections Touched |
|----------------|------------------|
| Field-level I/O tables | §4.1–4.11 |
| Screen inventory | §4.0 |
| Permission matrices | §3.8–3.10 |
| User stories | §6 (expanded to 3–8+ per module) |
| Acceptance criteria | §7 (granular + traceability) |
| Business rule examples | §5.* |
| Workflows | Module subsections + §13.9 |
| Validation/error catalogs | Module subsections + §13.7–13.8 |
| NFR measurable targets | §8 |
| Glossary/appendix | §13 |

---

**End of Functional Requirements Document — TransitOps v1.0.0**
