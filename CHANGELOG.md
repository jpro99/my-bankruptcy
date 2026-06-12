# Changelog

All notable changes to ChapterAI are documented here.

## [0.3.0] — Phase 3 — God Button + CACB Local Forms — 2025-06-12

### Chapter 13 Plan + CACB Local Forms

- **`@chapterai/ch13-plan`** — F 3015-1.01 payment calculator, §1325(a)(4) best interest test
- **`@chapterai/preflight`** — God Button preflight engine (10 core rules, extensible to 247+)
- **CACB Zod schemas** — F 3015-1.01 Plan, F 3015-1.7 RARA, 341 Notice, Master Mailing List
- **API:** `POST /api/plan/matter/:id/calculate`, `GET /api/preflight/matter/:id`, `POST .../file`
- **God Button UI** — preflight modal → confirm e-file (sandbox case number)
- **Ch 13 Plan Builder page** — `/matters/demo/plan`
- **Git initialized** — ready to push to GitHub as `ChapterAI`

## [0.2.0] — Phase 2 — 2025-06-12

### Credit + Means Test

- **New `@chapterai/credit` package** — CRS Credit API client with sandbox tri-merge fallback
- **Tradeline classifier** — auto-routes creditors to Schedules D, E, F, G with confidence scores
- **Schedule G schema** (Form 106G) — executory contracts and unexpired leases
- **Form 122C engine** — Chapter 13 means test (122C-1 / 122C-2) with disposable income floor
- **Unified means test evaluator** — combines Ch 7 (122A) and Ch 13 (122C) with diagnostics builder
- **API routes:**
  - `POST /api/credit/matter/:id/pull` — tri-merge credit pull
  - `GET /api/credit/matter/:id/tradelines` — classified tradelines
  - `GET /api/diagnostics/matter/:id` — live means test + abuse presumption
- **Inngest workers** — `credit/pull.requested`, `credit/pull.completed`, tradeline classification pipeline
- **Web cockpit wired to live API:**
  - Review queue loads from `/api/form-fields`
  - Diagnostics panel shows §707(b) status + credit→schedule breakdown
  - "Pull Tri-Merge Credit" button in Matter Cockpit
  - Intake triggers credit pull on completion
- **Dev mode** — `DEV_AUTH_BYPASS=1` for local development without Clerk/Neon

### Tests

- 32 → 44 tests (tradeline classifier, credit classification, Form 122C, unified diagnostics)

## [0.1.0] — Phase 0 + Phase 1 — 2025-06-12

### Phase 0 — Bootstrap

- Initialized Turborepo monorepo with pnpm workspaces
- Created packages: `forms`, `db`, `auth`, `provenance`, `means-test`, `exemption-optimizer`
- Created apps: `web`, `api`, `worker`, `ai-pipeline`
- GitHub Actions CI pipeline (typecheck, lint, test, build)
- Drizzle ORM schema: firms, users, matters, parties, documents, form_instances, form_fields, provenance_events, credit_tradelines, extraction_jobs
- USC Official Form Zod schemas (101, 106A/B–J)
- PII redaction proxy for AI gateway (SSN, DOB, account, email, phone tokenization)
- Clerk auth session parsing with firm-level RLS helpers
- Inngest client + intake pipeline function signatures

### Phase 1 — Intake to Schedules

- Document upload API with encrypted storage metadata
- AI extraction pipeline (Claude primary + GPT cross-check architecture)
- Field extractor with provenance event generation
- Approve-only Matter Cockpit UI:
  - Left rail matter tree (Petition → Schedules → Means Test → Local Forms)
  - Center Tinder-style review queue (Approve / Edit / Ask AI)
  - Right rail live diagnostics (means test, abuse presumption, chapter recommendation)
  - Bulk approve >95% confidence
- One-Touch Intake uploader with drag-and-drop + client-side encryption flow
- California exemption optimizer (System 1 vs System 2 dual simulation)
- Means test engine (Forms 122A-1 / 122A-2) with 2025 CA median income tables
- Form field approval API with provenance audit trail
- Vitest test suites with anonymized CA fact patterns:
  - Martinez (below median, Ch 7)
  - Chen (above median, passes 122A-2)
  - Williams (presumption of abuse, Ch 13)
  - Garcia (homeowner, System 2 recommended)
  - Nguyen (renter, System 2 recommended)

### Not yet implemented (future phases)

- CACB local forms engine (Phase 3)
- NextGen CM/ECF e-file bridge (Phase 4)
- Client portal (Phase 6)
