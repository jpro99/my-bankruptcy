# My Bankruptcy (ChapterAI monorepo)

Repo: `C:\Projects\ChapterAI` · packages `@chapterai/*`

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

## Dev

```powershell
$env:DEV_AUTH_BYPASS="1"; $env:NEXT_PUBLIC_DEV_AUTH_BYPASS="1"; $env:EFILE_MODE="sandbox"
pnpm dev
```

Web :3000 · API :3002 · Worker :3001
