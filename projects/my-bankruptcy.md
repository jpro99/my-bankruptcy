# My Bankruptcy (ChapterAI monorepo)



Repo: `C:\Projects\ChapterAI` · packages `@chapterai/*`



## Phase 1 — Field capture (phone) + matter ops board



**Goal:** Field capture = cell phone side app only (DGP pattern). Matters list = phase, % done, contact, fees, all tools — one screen, not Best Case tab maze.



### Acceptance (Spec Bot)



1. **Phone only** — desktop `/field-capture` shows gate; mobile gets full app + floating Field FAB on staff pages.

2. **Ops board** — `/matters` cards show phase, completion %, current step, last contact, balance due, **All tools** drawer.

3. **`npm run build` passes** — no auth/RLS changes; no production deploy during dev.



### Test



1. Desktop → `/field-capture` → "phones only" gate

2. Phone (or narrow + `?force=1`) → field capture works

3. `/matters` → expand **All tools** on demo matter



## Phase 1 — Test tab (full sandbox dashboard)



**Goal:** Top **Test** tab — same UI as live, red TEST banner, demo data only, step-by-step walkthrough (toggle off). Integrations + court connections in **Settings** only. Darker gray chrome.



### Acceptance (Spec Bot)



1. **Test tab** — `/test/dashboard` mirrors live dashboard; red TEST bar; demo matters only; walkthrough coach on each step.

2. **Settings only** — integrations + Riverside court readiness on `/settings`, removed from main dashboard and practice page.

3. **`npm run build` passes** — no auth/RLS changes; no production deploy during dev.



### Test sandbox tab



1. Click **Test** in header → `/test/dashboard`

2. Follow walkthrough popup → demo scout → forge → practice → sign-off → continuum

3. Toggle **Walkthrough prompts** off in red bar

4. **Settings** (gear) → integrations + court connections



## Phase 1 — Riverside County / CACB court readiness



**Goal:** All CACB forms + connections for Riverside & San Bernardino (Riverside Division) — attorney's Inland Empire practice area.



### Acceptance (Spec Bot)



1. **County routing** — Riverside & San Bernardino → CACB Riverside Division; `GET /api/districts/readiness?county=Riverside` returns full form list + CM/ECF sandbox status.

2. **Full packet match** — practice packet forms match district required list (16 Ch 7 / 17 Ch 13 incl. 3015-1.7, MML, 341).

3. **`npm run build` passes** — no auth/RLS changes; no production deploy during dev.



### Test Riverside court readiness



1. Open `http://localhost:3000/matters/demo/practice` — banner shows **Riverside County · CACB · Riverside Division · Practice ready**

2. Expand form list — all 16 Ch 7 forms listed (official + CACB local)

3. `GET /api/integrations/status` → `riversideCourtReadiness.connections.practiceReady` = true

4. Change county to **San Bernardino** on Schedules — same Riverside division



## Phase 1 — Practice filing (attorney test workspace)



**Goal:** Full system test without live court filing — attorney sees every paper, edits each form, prints, sandbox e-files.



### Acceptance (Spec Bot)



1. **Full packet** — `/matters/{id}/practice` lists every bankruptcy form (Ch 7/13); each page renders USC-style preview with edit link back to prep tools.

2. **Sandbox only** — practice workspace blocks live CM/ECF; `EFILE_MODE=sandbox` default; banner on practice + court preview when not live.

3. **`npm run build` passes** — no auth/RLS changes; no production deploy during dev.



### Test practice filing



1. `EFILE_MODE=sandbox` in dev (default)

2. Open `http://localhost:3000/matters/demo/practice`

3. Click each paper in sidebar — **Edit** opens schedules/review/dossier

4. Upload own docs on forge dossier — refresh practice — values update

5. Complete Final Sign-Off → Filing packet → sandbox e-file (fake case number)



## Phase 1 — Live documents + practice OS



**Goal:** Real file bytes in R2, matter-scoped uploads, attorney + client paths — minimal diff, auth unchanged.



### Acceptance (Spec Bot)



1. **Real uploads** — attorney drop zone + client portal send file bytes to API; when R2 env vars are set, objects land in `chapterai-documents` and dossier shows **Open** to download.

2. **Matter-scoped API** — upload/download routes stay behind existing auth (intake) or portal token; no PII in API logs (document id only).

3. **`npm run build` passes** — no auth/RLS schema changes; no production deploy during dev.



### Architecture (Architect Bot)



- **Storage:** `apps/api/src/lib/r2-storage.ts` + `document-storage.ts` — S3-compatible R2, keys `firms/{firmId}/matters/{matterId}/documents/{docId}/…`

- **Upload paths:** `POST /api/intake/matter/:id/upload/file` (attorney), `POST /api/portal/:token/upload/file` + `upload-general/file` (client)

- **Download:** `GET /api/intake/matter/:id/documents/:docId/file` — session auth, private cache

- **Fallback:** R2 unset → metadata-only upload (backward compatible)

- **Auth:** `resolveSession` + portal HMAC tokens — unchanged



### Security (Security / Risk Bot)



- Auth via `resolveSession` — unchanged

- No file names or PII in production logs (matterId + documentId only)

- Portal uploads token-scoped only; no cross-matter download without auth

- R2 bucket private; no public ACL



## Build



Node 20+. pnpm `9.15.0` via corepack (see root `packageManager`).



```powershell

cd C:\Projects\ChapterAI

corepack enable

corepack prepare pnpm@9.15.0 --activate

pnpm install --frozen-lockfile

npm run build

```



**Never run `pnpm build` while `pnpm dev` is running** — corrupts Next.js cache. Use `pnpm dev:clean` to recover.



## Dev



```powershell

$env:DEV_AUTH_BYPASS="1"; $env:NEXT_PUBLIC_DEV_AUTH_BYPASS="1"; $env:EFILE_MODE="sandbox"

pnpm dev

```



Web :3000 · API :3002 · Worker :3001



### Test Phase 1 (live documents)



1. Set R2 + `DATABASE_URL` in `apps/api/.env.local`

2. Open `http://localhost:3000/matters/demo/forge?section=dossier`

3. Drop a PDF — dossier shows **Open**; file appears in Cloudflare R2 bucket

4. `GET /api/integrations/status` → `documentStorage.status` = `configured`



### Test co-pilot (unchanged)



1. Open `http://localhost:3000/matters/demo/scout`

2. Tap **Case Assistant** — ask "What should I do next?"

