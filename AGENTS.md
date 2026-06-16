# AGENTS.md

## Cursor Cloud specific instructions

This is a Turborepo + pnpm monorepo ("My Bankruptcy" / internal packages are `@chapterai/*`). Node 20+, pnpm `9.15.0` (declared in root `package.json` `packageManager`).

The cloud environment is defined in `.cursor/environment.json` (committed, takes precedence over the UI environment): `install` pins pnpm via corepack to match `packageManager` and runs `pnpm install --frozen-lockfile`; a `dev` terminal auto-runs the servers below in demo mode. The base image already provides Node 22 (satisfies `>=20`) — there is no Dockerfile-based build, so node/pnpm versions come from the base image + corepack.

### Services (run all via root `pnpm dev`)
| Service | Port | Notes |
|---------|------|-------|
| `@chapterai/web` (Next.js 15) | 3000 | Attorney UI; `/` redirects to `/matters` |
| `@chapterai/api` (Hono) | 3002 | In-memory demo store; health at `/health` |
| `@chapterai/worker` (Inngest) | 3001 | Background jobs. See worker caveat below. |
| `@chapterai/efile-bridge` | 3003 | Optional; not started by `pnpm dev` |

### Local dev runs in demo mode — no external services needed
The app runs fully on an in-memory demo store; **no Postgres/Neon, Clerk, Redis, or AI keys are required** to run or test locally. You MUST set auth-bypass env vars or API calls return 401 and the web UI shows an "API not connected" banner:

- API (and worker): `DEV_AUTH_BYPASS=1`
- Web (Next.js, build/dev-time public var): `NEXT_PUBLIC_DEV_AUTH_BYPASS=1`

`.env` / `.env.local` are gitignored, so export these in the shell before `pnpm dev` (or place them in `apps/api/.env` and `apps/web/.env.local`). Also set `EFILE_MODE=sandbox` to keep e-file flows in sandbox.

Demo data (matters `demo`, `demo-intake`, `demo-filed`) is seeded in memory on API startup and **resets on every restart** — created matters do not persist across server restarts.

### Worker `:3001` caveat (do not chase a phantom endpoint)
The worker logs `ChapterAI worker listening on port 3001`, but under Node/`tsx` it does **not** actually bind an HTTP port. `apps/worker/src/index.ts` uses a Bun/Cloudflare-style `export default { port, fetch }`, which Node does not auto-serve (the API works because it calls `@hono/node-server`'s `serve()` explicitly). This is harmless for local dev: the web → API flow is the core product and works fully, and the worker's Inngest endpoint only matters once `INNGEST_*` keys are set (not in demo mode). Don't treat a refused connection on `:3001` as an environment problem.

### Commands (from repo root)
Standard scripts in root `package.json` / `turbo.json`:
- `pnpm dev` — builds workspace deps, then runs web + api + worker. Useful URLs in `README.md`.
- `pnpm dev:clean` — kills stale 3000/3002 servers and wipes the Next.js cache; use this to recover from `__webpack_modules__[moduleId] is not a function` / Internal Server Error.
- `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`.

Gotcha: do **not** run `pnpm build` while `pnpm dev` is running — it corrupts the Next.js cache (run `pnpm dev:clean` to recover). The `lint` script for most packages is a no-op (`echo lint ok`); there is no ESLint config.
