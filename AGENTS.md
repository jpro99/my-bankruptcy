# AGENTS.md

## Cursor Cloud specific instructions

### Overview
`my-bankruptcy` (internal `@chapterai/*`) is a pnpm + Turborepo monorepo (Node ≥20, pnpm 9.15.0). Standard commands live in the root `package.json` and `README.md`; reference those for `build`, `lint`, `test`, `typecheck`, and `db:*`.

Services (run all via `pnpm dev` from repo root):
- `@chapterai/web` (Next.js) — attorney UI + client portal, port **3000** (required)
- `@chapterai/api` (Hono) — backend API, port **3002**, health at `/health` (required)
- `@chapterai/worker` (Inngest/Hono) — background workflows, port **3001** (optional for demo)
- `@chapterai/efile-bridge` (Hono + Playwright) — PACER e-filing, port 3003 (optional; needs `playwright:install` for live mode)

### Running in demo mode (no external services needed)
The app runs fully in **demo mode** with an in-memory store — no `DATABASE_URL`, Clerk, AI keys, etc. required. Demo mode needs two local env files (gitignored, so they must exist on disk):
- `apps/web/.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:3002`, `NEXT_PUBLIC_DEV_AUTH_BYPASS=1`, `WEB_URL=http://localhost:3000`
- `apps/api/.env`: `DEV_AUTH_BYPASS=1`, `WEB_URL=http://localhost:3000`, `EFILE_MODE=sandbox`

Then `pnpm dev`. Open the demo matter at `http://localhost:3000/matters/demo/command` (redirects to the Forge). Other entry points: `/matters/demo/cockpit`, `/matters/demo/forge/review`, `/portal/[token]`.

### Non-obvious gotchas
- **Auth in demo:** the web app injects `x-firm-id`/`x-user-id`/`x-clerk-user-id`/`x-user-email`/`x-user-role` headers when `NEXT_PUBLIC_DEV_AUTH_BYPASS=1`, so the UI works without real auth. Direct `curl` to the API returns `401` unless you send those headers (or set `DEV_AUTH_BYPASS=1`, which the API reads from process env, not from `.env`).
- **DB-backed routes:** `/api/matters/*` requires a real `DATABASE_URL` and returns `500 DATABASE_URL environment variable is required` in demo mode. This is expected — the demo UI uses the in-memory-store routes (`/api/command`, `/api/form-fields`, `/api/schedules`, etc.), not `/api/matters`.
- **Next.js cache:** do not run `pnpm build` while `pnpm dev` is running — it corrupts the `.next` cache. Use `pnpm dev:clean` to clear `apps/web/.next` and restart (the port-killing part of `dev:clean` is Windows-only and a no-op on Linux).
- **lint** is stubbed (`echo lint ok`) in the apps; there is no real linter wired up.
