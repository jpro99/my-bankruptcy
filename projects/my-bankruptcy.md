# My Bankruptcy (ChapterAI monorepo)

Repo: `C:\Projects\ChapterAI` · packages `@chapterai/*`

## Phase 1 — Practice OS slice (intake → discharge)

**Goal:** AI co-pilot on every matter step — smallest slice that proves value.

### Acceptance (Spec Bot)

1. **Relief Co-pilot** — floating panel on Scout, Forge, and Continuum; context-aware answers from matter progress (no PII in logs or client bundles).
2. **Matter-scoped API** — `POST /api/copilot/matter/:id` uses existing auth + demo-store scoping; PII redacted before any LLM path.
3. **`pnpm run build` passes** — no auth/RLS changes; no production deploy during dev.

### Architecture (Architect Bot)

- **Pipeline:** Scout → Forge → Gavel → Continuum (`ReliefCommandRail`)
- **Co-pilot context:** phase + `computeMatterProgress` snapshot — same pattern as Command Center
- **PII:** `@chapterai/ai-pipeline` redaction proxy on user questions; token map never leaves API
- **Demo mode:** canned phase answers when no `ANTHROPIC_API_KEY` — matches field-extractor pattern

### Security (Security / Risk Bot)

- Auth via `resolveSession` — unchanged
- No PII/secrets in logs (redact before log/LLM)
- No Windows UAC/AV bypass — web app only; Relief Pocket = PWA install with explicit user consent
- Stripe/webhook/RLS paths untouched in Phase 1

## Build

Node 20+. pnpm `9.15.0` via corepack (see root `packageManager`).

```powershell
cd C:\Projects\ChapterAI
corepack enable
corepack prepare pnpm@9.15.0 --activate
pnpm install --frozen-lockfile
pnpm run build
```

If `pnpm` not recognized:

```powershell
npx pnpm@9.15.0 install --frozen-lockfile
npx pnpm@9.15.0 run build
```

Or after install: `npm run build` (uses npx pnpm internally).

**Never run `pnpm build` while `pnpm dev` is running** — corrupts Next.js cache. Use `pnpm dev:clean` to recover.

## Dev

```powershell
$env:DEV_AUTH_BYPASS="1"; $env:NEXT_PUBLIC_DEV_AUTH_BYPASS="1"; $env:EFILE_MODE="sandbox"
pnpm dev
```

Web :3000 · API :3002 · Worker :3001

### Test Phase 1

1. Start dev (env vars above)
2. Open `http://localhost:3000/matters/demo/scout`
3. Tap **Relief Co-pilot** (bottom-left) — ask "What should I do next?"
4. Walk Scout → Forge → Continuum — co-pilot answers change with phase
