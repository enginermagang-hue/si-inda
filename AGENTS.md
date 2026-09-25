# AGENTS.md — OpenCode Instructions for SIINDAH

Nuxt 4 + Nuxt UI v4 monolith (Nitro server, same-origin API) with Drizzle ORM
+ libSQL (SQLite local / Turso cloud).

## Setup (fresh clone)

```powershell
npm install
Copy-Item .env.example .env   # fill in production values as needed
npm run db:migrate            # run once, repeat after every `db:generate`
npm run db:seed               # creates admin/admin123 + initial content
npm run dev                   # http://localhost:3000 (frontend + API same origin)
```

Admin login: `http://localhost:3000/admin/login` — user `admin`, pass `admin123`.
Password change is forced on first login (middleware redirects to `/admin/password`).

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server (frontend + API on one origin, port 3000) |
| `npm run build` | Production build (Nitro) |
| `npm run typecheck` | Type-check (`nuxt typecheck`) |
| `npm run lint` | ESLint |
| `npm run db:generate` | Generate migration after editing `server/db/schema.ts` |
| `npm run db:migrate` | Apply migrations (local `dev.db` or Turso cloud if env set) |
| `npm run db:seed` | Seed admin + 7 content pages + settings + initial statistics |
| `npm run test:unit` | Vitest (tests in `tests/unit/`) |
| `npm run test:e2e` | Playwright Chromium (tests in `e2e/`, auto-spawns dev server) |

## Database

- Schema lives in `server/db/schema.ts` (Drizzle ORM). After editing it:
  `npm run db:generate` → `npm run db:migrate`.
- Migrations output to `server/drizzle/` (do not edit manually).
- `useDb()` in `server/utils/db.ts` is the singleton accessor — use it, not a raw `drizzle()`.
- Booleans are stored as integers (0/1), not JS booleans. Check schema for
  `isPublished`, `isActive`, `isCurrent`, `mustChangePassword`.

## Environment variables

Nuxt binds `NUXT_*`-prefixed env vars into `runtimeConfig` (see `nuxt.config.ts`).
The root `.env` is authoritative. **`server/.env` is stale** — it uses bare
names (`TURSO_URL`, `JWT_SECRET`, `DROPBOX_*`) that Nuxt will NOT read; edit root
`.env` with the `NUXT_` prefix instead.

Key vars:
- `NUXT_JWT_SECRET` — admin JWT signing key, **≥ 32 characters** (enforced at runtime)
- `NUXT_TURSO_URL` / `NUXT_TURSO_AUTH_TOKEN` — leave empty for local SQLite
- `NUXT_STORAGE_DRIVER` — `local` (dev) or `dropbox` (production)
- `NUXT_DROPBOX_*` / `NUXT_DROPBOX_BASE` — only needed when driver is `dropbox`
- `NUXT_ADMIN_*` — seed admin credentials (default `admin` / `admin123`)

## Server-side gotcha: h3

Do NOT `import { … } from 'h3'` — the root `h3` is v2 and is incompatible with
Nitro (which bundles h3 v1). Nitro **auto-imports** `createError`, `setCookie`,
`deleteCookie`, `getCookie`, `readBody`, etc. See the warning in `server/utils/auth.ts`.

## Testing

- Unit tests: `npm run test:unit` — Vitest, Node environment, files in `tests/unit/`.
- E2E tests: `npm run test:e2e` — Playwright with Chromium. The `webServer` config
  auto-spawns `npm run dev -- --port 3000 --host 127.0.0.1`, so no manual server
  start is needed. Pointing at `http://localhost:3000` (the `baseURL`).
- E2E tests assume a seeded database (`db:seed` must have run).

## Build policy

Do NOT run `npm run build` unless the user explicitly asks. Production builds are
expensive and unnecessary for most tasks (dev server, tests, lint, typecheck are
sufficient).

## Architecture layout

```
app/            frontend — pages, layouts, components, composables, stores, middleware
app/stores/     Pinia stores (site settings, admin auth)
app/composables/api.ts  $fetch wrapper (credentials: 'include' for cookie auth)
app/middleware/admin.ts  admin route guard (client-side cookie check)
server/api/       Nitro server routes (file-based: *.get.ts, *.post.ts, etc.)
server/api/admin/     authenticated admin routes (/admin/login, /admin/me, CRUD)
server/db/schema.ts   Drizzle schema
server/drizzle/       generated migrations + meta snapshots
server/utils/   auth.ts, db.ts, storage.ts, validate.ts, password.ts
db/           migrate.ts, seed.ts  (run via tsx, outside Nuxt runtime)
```

## Password hashing

scrypt via `server/utils/password.ts` with format `scrypt$N$r$p$salt$hex`.
Use `hashPassword()` / `verifyPassword()` — no other hashing utilities exist.
