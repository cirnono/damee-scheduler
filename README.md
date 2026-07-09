# Damee Scheduler (Archived)

> **⚠️ This repository is archived and no longer maintained.**
>
> The scheduler functionality has been merged into [`DameeOrderingSystemAdmin`](https://github.com/InnospireKynono/DameeOrderingSystemAdmin).
> All scheduler features (employee management, store rules, role requirements, fixed assignments, schedule plans)
> are now part of the cloud admin web app. See `damee-infra/docs/scheduler-dto-contract.md` for the shared DTO contract.

## What It Was

Damee Scheduler was a standalone prototype for staff scheduling across multiple store locations.
It was built as a separate Next.js application before being integrated into the main cloud admin interface.

### Features (now available in DameeOrderingSystemAdmin)

- **Employee management** — create, update, and deactivate staff across stores
- **Store rules** — pair rules, role requirements, fixed shift assignments
- **Role management** — define and assign roles per store
- **Schedule plans** — weekly schedule plans with drag-and-drop cell editing

## Configuration (historical reference)

The standalone prototype required:

```bash
# .env.local
NEXT_PUBLIC_SCHEDULER_API=/api/v1/scheduler
SERVER_SCHEDULER_API=http://cloud-backend:4000/api/v1/scheduler
```

These variables are now part of `DameeOrderingSystemAdmin/.env` for the integrated version.

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui components

## Legacy Development

This repo is kept for source history only. Do not submit new features or bug fixes here.
All scheduler development should target `DameeOrderingSystemAdmin`.
