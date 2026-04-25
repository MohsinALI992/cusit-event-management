# CUSIT Event Management System

A web application for COMSATS Sahiwal (CUSIT) to manage university events end-to-end: proposals, approvals, registrations, attendance, certificates, notifications, and feedback — with role-based dashboards and reports.

## Roles

- **Student** — browse events, register, view their registrations/certificates/notifications, submit feedback.
- **Faculty / Coordinator** — propose events, approve or reject pending proposals, mark attendance, issue certificates.
- **Society Head** — propose events on behalf of a society.
- **Admin (SLC office)** — full access; their own events are auto-approved; can run reports.

## Architecture

- **Monorepo** (pnpm workspaces).
- **`artifacts/cusit-events`** — React + Vite + TanStack Query + shadcn/ui frontend, served at `/`.
- **`artifacts/api-server`** — Express + Drizzle backend, served at `/api`. Cookie-based mock session (`uems_uid`).
- **`lib/api-spec`** — OpenAPI specification (single source of truth).
- **`lib/api-zod`** — generated Zod schemas (used by the server for validation).
- **`lib/api-client-react`** — generated TanStack Query hooks (used by the frontend).
- **`lib/db`** — Drizzle schema for PostgreSQL (users, events, registrations, attendance, certificates, notifications, feedback).
- **`scripts/`** — utility scripts including `pnpm --filter @workspace/scripts run seed` to (re)seed the database.

## Auth (mock)

There is no password flow. The login page lists every seeded user; selecting one issues a session cookie. This is a demo for the SRS — replace with a real auth provider before going to production.

## Data flow rules

- A new event proposal notifies all approvers (faculty, coordinators, admin).
- Approving an event broadcasts a notification to every student.
- Registering for an event sends a confirmation notification.
- Issuing certificates is only possible for attendees marked `present` or `late`; the event is then marked `completed`.
- Certificate codes follow `CUSIT-<eventId>-<userId>-<random>`.

## Running

Workflows are configured for both artifacts:
- `artifacts/api-server: API Server` (port 8080, path `/api`)
- `artifacts/cusit-events: web` (auto-assigned port, path `/`)

To re-seed the database with realistic CUSIT users and events:
```
pnpm --filter @workspace/scripts run seed
```
