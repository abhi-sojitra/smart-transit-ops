# Drivers Frontend Module

Routes (protected shell):

| Route | Page |
|-------|------|
| `/drivers` | List + statistics + filters |
| `/drivers/new` | Create driver |
| `/drivers/[id]` | View + status update |
| `/drivers/[id]/edit` | Edit driver |

## Layout

```
src/
  app/(protected)/drivers/...
  components/drivers/
  hooks/use-drivers.ts
  services/drivers.ts
  types/driver.ts
```

## Features

- TanStack Query (list/detail/stats + mutations with cache invalidation)
- Optimistic status updates
- React Hook Form + Zod validation
- Sonner toasts on create/update/delete/status/errors
- Responsive table (desktop) + cards (mobile)
- Dark mode via existing theme tokens

API base: `NEXT_PUBLIC_API_URL` (default `http://localhost:4000/api`)
