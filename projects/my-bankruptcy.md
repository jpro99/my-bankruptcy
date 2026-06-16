# My Bankruptcy (ChapterAI monorepo)



Repo: `C:\Projects\ChapterAI` · packages `@chapterai/*`



## Phase 2 — Official court PDF generation

**Goal:** Practice mode + court preview export server-generated Official Form PDFs (B101, B106, CACB local) from live petition data.

### Acceptance

1. **API** — `GET /api/filing/matter/:id/court-pdf/:formId` and `.../court-pdf` return `application/pdf` with practice watermark in sandbox.
2. **UI** — Practice + court preview: **Official PDF** opens filled PDF in new tab; **Official PDF (all)** merges full packet.
3. **`npm run build` passes** — `@chapterai/court-pdf` package; integrations status `official_layout_pdf`.

### Test

1. `/matters/demo/practice` → pick Form 107 → **Official PDF**
2. Header → **Official PDF (all)** — multi-page packet
3. `GET /api/integrations/status` → `pdfGeneration: "official_layout_pdf"`

### Later

- Drop USCourts AcroForm PDFs in `COURT_FORM_TEMPLATES_DIR` for pixel-perfect fill (optional env).

---

## Phase 1 — Matters search + lifecycle tabs

**Goal:** `/matters` — instant search by name, phone, email; tabs for Potential / Active Cases / Completed; one-click Receipt.

### Acceptance (Spec Bot)

1. **Instant search** — filter matters by debtor name, phone (digits), or email as you type; no server log of query text beyond existing API.
2. **Lifecycle tabs** — Potential (not retained), Active Cases (retained/in progress), Completed (discharged); counts on each tab.
3. **`npm run build` passes** — matter-scoped list API unchanged auth; no production deploy during dev.

### Test

1. `/matters` → type `909` or `maria` or email → card filters instantly
2. Click **Active Cases** / **Potential** / **Completed** tabs
3. **Receipt** on any card → billing → print

---

## Phase 1 — Discharge thank-you letter + firm receipts

**Goal:** After discharge, attorney prints professional thank-you letter (PI referral + Google/Yelp review). Billing prints firm letterhead receipts with charged/received amounts.

### Acceptance (Spec Bot)

1. **Thank you letter** — Post-Filing → Print thank you letter: firm letterhead, pleasure to serve, PI note, Google/Yelp review ask; client name editable.
2. **Receipts** — Fees & Trust → enter client name, total charged, amount received → Print receipt with Lombera letterhead (2068 Orange Tree Lane, Redlands · (909) 915-0181).
3. **`npm run build` passes** — client-side print only; no auth/RLS changes; no production deploy during dev.

### Test

1. `/matters/demo-filed/continuum` → complete discharge track → Print thank you letter
2. `/matters/demo/billing` → fill amounts → Print receipt → check letterhead
3. Optional env: `NEXT_PUBLIC_GOOGLE_REVIEW_URL`, `NEXT_PUBLIC_YELP_REVIEW_URL`

---

## Phase 1 — Professional left-aligned staff UI

**Goal:** Match billing page — left sidebar + left-justified content. No centered “toy” columns on matter work.

### Acceptance (Spec Bot)

1. **MatterShell everywhere** — forge, scout, continuum, practice, court preview, billing, audit use sidebar + left main panel (like billing).
2. **staff-panel** — matter panels use left-aligned `.staff-panel` (not `mx-auto` centered columns); firm dashboard/matters list left-aligned in `.app-container`.
3. **`npm run build` passes** — no auth/RLS changes; no production deploy during dev.

### Test

1. Open `/matters/demo/billing` then `/matters/demo/forge` — same sidebar, content flush left
2. Dashboard `/dashboard` — tiles align left, not floating center
3. Schedules/scout panels — headers left, full width within main column

---

## Phase 1 — Attorney schedule control (court-ready filing prep)

**Goal:** Streamlined start-to-finish bankruptcy prep — attorney full control over Schedules A–J, credit → schedules, practice packet mirrors court forms. World-class data entry; no auth/RLS changes.

### Acceptance (Spec Bot)

1. **Full schedule CRUD** — Forge → Schedules: add/edit/remove property (A/B), exemptions (C), creditors (D–G), codebtors (H), income (I), expenses (J), **SOFA (107)**; Form 106J standard lines + custom lines; total expenses computed.
2. **Court path** — Practice packet + court preview pull live schedule/SOFA data; each form **Edit** link (107 → SOFA tab); credit **Apply to petition** → schedules D–G.
3. **`npm run build` passes** — no PII in logs; auth/RLS unchanged; no production deploy during dev.

### Architecture (Architect Bot)

- **Data:** `demo-store` assets + `reviewFields` (formId 106I/J/H) + tradelines → `assemblePetition` → court preview pages.
- **API:** `PATCH/DELETE /api/schedules/matter/:id/items/:id`, `POST …/assets`, `…/lines`, `…/codebtors` — matter-scoped, `isDemoMatter` gate, existing session auth.
- **UI:** `schedules-viewer.tsx` + modals; forge sections credit → apply → schedules.

### Security (Security / Risk Bot)

- Schedule routes: matterId + session only; errors return generic messages — no debtor names in server logs.
- No client bundle secrets; R2/auth paths unchanged.
- User consent for credit pull unchanged; no elevation/UAC bypass.

### Test attorney schedules

1. `pnpm dev` — open `/matters/demo/forge?section=schedules`
2. **A/B** → Add property → "Queen bed, couch" → household goods → save
3. **J** → edit Housing/Food lines → see total at bottom
4. **H** → Add codebtor → appears on Schedule H tab
5. **Credit** → pull → Apply to petition → Schedules D–G populated
6. `/matters/demo/practice` → open 106J / 106A/B / **107** → fields match → Edit → schedules (SOFA tab for 107)

---

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

