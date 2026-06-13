# My Bankruptcy

AI-native bankruptcy practice platform for California attorneys.

> Repo name: **`my-bankruptcy`** (internal code still uses `@chapterai/*` packages — that's fine)

## Open in Cursor

```
File → Open Folder → `c:\Projects\ChapterAI` (or `c:\Projects\Bankrupty`)
```

## Push to GitHub + phone anywhere

**Full step-by-step:** see [DEPLOY.md](./DEPLOY.md)

Quick version:
1. Create repo at [github.com/new](https://github.com/new) named **`my-bankruptcy`**
2. Push code (commands below)
3. Deploy web → [Vercel](https://vercel.com), API → [Railway](https://railway.app)
4. Open `https://my-bankruptcy.vercel.app/matters/demo/command` on your phone

```powershell
cd c:\Projects\ChapterAI
git add -A
git commit -m "my-bankruptcy v0.6.0"
git remote add origin https://github.com/YOUR_USERNAME/my-bankruptcy.git
git push -u origin main
```

## Dev

```powershell
npx pnpm@9.15.0 install
npx pnpm@9.15.0 dev
```

If you see **Internal Server Error** or `__webpack_modules__[moduleId] is not a function`:

```powershell
# Ctrl+C any running dev terminal first, then:
npx pnpm@9.15.0 dev:clean
```

This kills stale servers on ports 3000/3002 and wipes the Next.js cache. **Do not run `pnpm build` while `pnpm dev` is running** — that corrupts the cache.

- Web: http://localhost:3000
- API: http://localhost:3002
- E-File Bridge (optional): http://localhost:3003
- Cockpit: http://localhost:3000/matters/demo/cockpit
- **Command Center:** http://localhost:3000/matters/demo/command
- **Client portal:** http://localhost:3000/portal/demo-client
- Autopilot: http://localhost:3000/matters/demo/autopilot (after filing)
