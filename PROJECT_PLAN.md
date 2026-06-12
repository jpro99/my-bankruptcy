# ChapterAI — Project Plan

> Principal Architect: Atlas | v1.0 target: 60 days | Jurisdiction: California (CACB first)

## Five Critical Product Pillars (Acknowledged)

1. **One-Touch Intake** — Attorney drops identity + financial documents; AI extracts and populates all 100-series official forms with cited evidence. No manual re-keying.

2. **Approve-Only UX** — Every AI field presents Approve / Edit / Question with confidence scores, source chips, and bulk-approve for high-confidence items. Attorney reviews; AI executes.

3. **Audit-Grade Provenance** — Every populated field stores source document, bounding box, model version, prompt hash, confidence, and attorney approval timestamp. Court challenges export full JSON provenance.

4. **Deterministic Legal Engines** — Means test (122A/C) and CA exemption optimizer (System 1 vs System 2) run as pure TypeScript with unit tests — LLM writes rationale only, never the math.

5. **California-Deep Filing** — CACB local forms, NextGen CM/ECF e-file bridge, tri-merge credit auto-scheduling, and post-petition autopilot — all from one Matter Cockpit with a single "File Now" pre-flight.

---

## Directory Tree

```
chapterai/
├── .github/workflows/ci.yml
├── apps/
│   ├── web/                      # Next.js 15 attorney Matter Cockpit
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   ├── matters/[matterId]/
│   │   │   │   ├── cockpit/        # Approve-only review queue
│   │   │   │   ├── intake/         # Document upload
│   │   │   │   └── schedules/      # A/B–J form views
│   │   │   └── api/webhooks/
│   │   ├── components/
│   │   └── lib/
│   ├── client-portal/            # Phase 6 — mobile client portal
│   ├── api/                      # Hono edge API
│   │   └── src/
│   │       ├── routes/
│   │       ├── middleware/
│   │       └── index.ts
│   ├── worker/                   # Fly.io/Railway long jobs
│   │   └── src/inngest/
│   ├── ai-pipeline/              # Document extraction service
│   │   └── src/
│   │       ├── extractors/
│   │       ├── redaction/        # PII tokenization proxy
│   │       └── index.ts
│   └── efile-bridge/             # Phase 4 — Playwright PACER filer
├── packages/
│   ├── ui/                       # shadcn/ui + Tailwind 4
│   ├── forms/                    # Zod schemas (USC + CACB) — source of truth
│   │   └── src/
│   │       ├── official/         # Forms 101–123
│   │       ├── schedules/        # A/B–J
│   │       ├── means-test/       # 122A, 122C
│   │       └── cacb/             # Local forms
│   ├── db/                       # Drizzle ORM + migrations
│   │   └── src/schema/
│   ├── auth/                     # Clerk + RLS helpers
│   ├── provenance/               # Audit trail types + helpers
│   ├── means-test/               # Deterministic 122A/C engine
│   └── exemption-optimizer/      # CA §703.140 vs §704 simulator
├── turbo.json
├── pnpm-workspace.yaml
└── PROJECT_PLAN.md
```

---

## Schedule E/F Creditor — Zod Schema

See `packages/forms/src/schedules/schedule-e-f.ts` for the canonical implementation.

```typescript
// Schedule E/F — Unsecured Creditors (Official Form 106E/F)
export const ScheduleEFCreditorSchema = z.object({
  creditorNumber: z.number().int().positive(),
  creditorName: z.string().min(1).max(500),
  creditorAddress: AddressSchema,
  accountNumberLast4: z.string().regex(/^\d{4}$/).optional(),
  claimType: z.enum([
    "priority_unsecured",      // Schedule E
    "nonpriority_unsecured",   // Schedule F
  ]),
  priorityClass: z.enum([
    "domestic_support",
    "taxes",
    "wages_salaries_commissions",
    "contributions_to_employee_benefit_plans",
    "other",
  ]).optional(),
  priorityAmount: MoneySchema.optional(),
  totalClaimAmount: MoneySchema,
  contingent: z.boolean().default(false),
  unliquidated: z.boolean().default(false),
  disputed: z.boolean().default(false),
  dateIncurred: z.string().date().optional(),
  consideration: z.string().max(2000).optional(),
  communityProperty: z.boolean().default(false),
  sourceDocumentId: z.string().uuid().optional(),
  sourceTradelineId: z.string().optional(),
  aiClassification: z.object({
    confidence: z.number().min(0).max(1),
    rationale: z.string(),
    scheduleRecommendation: z.enum(["E", "F"]),
  }).optional(),
});
```

---

## Database Schema (Drizzle)

See `packages/db/src/schema/` for full implementation.

### Core Tables

| Table | Purpose |
|-------|---------|
| `firms` | Law firm tenant |
| `users` | Attorney/staff (Clerk sync) |
| `matters` | Bankruptcy case workspace |
| `parties` | Debtors, joint debtors, codebtors |
| `documents` | Encrypted S3 refs + metadata |
| `form_instances` | One row per form version on a matter |
| `form_fields` | Individual field values + approval state |
| `provenance_events` | Immutable audit log per field change |
| `credit_tradelines` | Tri-merge import rows |
| `extraction_jobs` | AI pipeline job tracking |

### Row-Level Security

All queries scoped by `firm_id` + `matter_id`. Postgres RLS policies enforce tenant isolation.

---

## Inngest Function Signatures — Intake Pipeline

```typescript
// apps/worker/src/inngest/client.ts
export const inngest = new Inngest({ id: "chapterai" });

// Event: matter/intake.started
export const intakePipelineStarted = inngest.createFunction(
  { id: "intake-pipeline-orchestrator", retries: 3 },
  { event: "matter/intake.started" },
  async ({ event, step }) => { /* orchestrates below */ }
);

// Step 1: Document ingestion + OCR
export const ingestDocuments = inngest.createFunction(
  { id: "intake-ingest-documents", retries: 2 },
  { event: "matter/documents.uploaded" },
  async ({ event, step }) => {
    // Input: { matterId, documentIds: string[] }
    // Output: { parsedDocuments: ParsedDocument[] }
  }
);

// Step 2: PII redaction before LLM
export const redactAndTokenize = inngest.createFunction(
  { id: "intake-redact-pii", retries: 1 },
  { event: "matter/documents.parsed" },
  async ({ event, step }) => {
    // Input: { matterId, parsedDocumentIds: string[] }
    // Output: { tokenizedDocuments: TokenizedDocument[] }
  }
);

// Step 3: AI field extraction (Claude primary, GPT cross-check)
export const extractFormFields = inngest.createFunction(
  { id: "intake-extract-fields", retries: 2, concurrency: { limit: 5 } },
  { event: "matter/documents.tokenized" },
  async ({ event, step }) => {
    // Input: { matterId, targetForms: FormId[] }
    // Output: { extractedFields: ExtractedField[], provenanceEvents: ProvenanceEvent[] }
  }
);

// Step 4: Credit pull + schedule classification
export const classifyCreditTradelines = inngest.createFunction(
  { id: "intake-classify-credit", retries: 2 },
  { event: "credit/pull.completed" },
  async ({ event, step }) => {
    // Input: { matterId, creditReportId: string }
    // Output: { scheduleD: [], scheduleE: [], scheduleF: [], scheduleG: [] }
  }
);

// Step 5: Means test + exemption optimizer
export const computeMeansTestAndExemptions = inngest.createFunction(
  { id: "intake-compute-legal-engines", retries: 1 },
  { event: "matter/schedules.populated" },
  async ({ event, step }) => {
    // Input: { matterId }
    // Output: { meansTestResult, exemptionRecommendation, diagnostics }
  }
);

// Step 6: Notify attorney review queue ready
export const notifyReviewQueueReady = inngest.createFunction(
  { id: "intake-review-ready", retries: 1 },
  { event: "matter/intake.completed" },
  async ({ event, step }) => {
    // Input: { matterId, fieldCount, highConfidenceCount }
    // Output: { reviewQueueUrl: string }
  }
);
```

---

## Phase Map

| Phase | Days | Deliverable |
|-------|------|-------------|
| 0 | 1 | Monorepo, auth, DB, forms schemas, AI gateway |
| 1 | 2–7 | Intake → Schedules, exemption optimizer, approve UI |
| 2 | 8–11 | Credit API, means test, abuse presumption |
| 3 | 12–15 | Ch 13 plan, CACB local forms |
| 4 | 16–20 | E-file bridge |
| 5 | 21–25 | Post-petition autopilot |
| 6 | 26–30 | Client portal + billing |
| 7 | 31–45 | Multi-district rollout |
| 8 | 46–60 | SOC 2 + beta launch |

---

## Tech Stack Summary

- **Frontend:** Next.js 15, Tailwind 4, shadcn/ui, TanStack Query, Zustand, RHF + Zod
- **Backend:** Hono, Drizzle, PostgreSQL 17 (Neon), Redis (Upstash), Inngest
- **AI:** Claude Sonnet 4.5 (extract), GPT-5 (cross-check), pgvector memory
- **Storage:** Cloudflare R2, AES-256-GCM client-side encryption
- **Auth:** Clerk (SSO + MFA)
- **Deploy:** Vercel (web/api), Fly.io (worker)
