# Deploy My Bankruptcy — Use on Your Phone Anywhere

GitHub repo name: **`my-bankruptcy`**

GitHub stores your code. **Deploying** puts the app on the internet so your phone works away from home.

---

## Part 1 — Push to GitHub (5 minutes)

### Step 1: Create the repo on GitHub

1. Go to [github.com/new](https://github.com/new)
2. Repository name: **`my-bankruptcy`**
3. Keep it **Private** (recommended)
4. Do **not** add README, .gitignore, or license
5. Click **Create repository**

### Step 2: Push from your PC

```powershell
cd c:\Projects\ChapterAI
git add -A
git commit -m "my-bankruptcy v0.6.0"
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/my-bankruptcy.git
git push -u origin main
```

Replace `YOUR_GITHUB_USERNAME` with your GitHub username.

If remote already exists:

```powershell
git remote set-url origin https://github.com/YOUR_GITHUB_USERNAME/my-bankruptcy.git
git push -u origin main
```

**Result:** **my-bankruptcy** shows under Your repositories on GitHub.

---

## Part 2 — Phone anywhere (Vercel + Railway)

| Piece | Service | URL example |
|-------|---------|-------------|
| Web UI | [Vercel](https://vercel.com) | `https://my-bankruptcy.vercel.app` |
| API | [Railway](https://railway.app) | `https://my-bankruptcy-api.up.railway.app` |

The web app shows an **API not connected** banner until Railway is wired. Demo mode works once both are linked.

### Railway (API) — step by step

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
2. Select **my-bankruptcy** (same repo as Vercel)
3. **Settings → Source:** Root Directory = **`.`** (repo root — `railway.toml` handles the build)
4. **Variables** tab — add:

   ```
   DEV_AUTH_BYPASS=1
   NODE_ENV=production
   WEB_URL=https://my-bankruptcy.vercel.app
   ```

   Do **not** set `PORT` — Railway injects it automatically.

5. **Settings → Networking → Generate Domain** → copy the URL (e.g. `https://my-bankruptcy-api-production.up.railway.app`)
6. Wait for deploy — check **Deployments** shows healthy (`GET /health`)

### Vercel (Web) — link the API

1. Vercel project **my-bankruptcy** → **Settings → Environment Variables**
2. Add:

   ```
   NEXT_PUBLIC_API_URL=https://YOUR-RAILWAY-URL.up.railway.app
   NEXT_PUBLIC_DEV_AUTH_BYPASS=1
   ```

3. **Deployments → Redeploy** (required after env var changes)

The app checks `/health` on load — the yellow banner disappears when the API is reachable.

### Vercel (Web)

1. [vercel.com](https://vercel.com) → Import **my-bankruptcy**
2. Root directory: **`apps/web`**
3. Framework: **Next.js**
4. Environment variables:
   ```
   NEXT_PUBLIC_DEV_AUTH_BYPASS=1
   NEXT_PUBLIC_API_URL=https://YOUR-RAILWAY-API-URL.up.railway.app
   ```
5. Deploy

If the first build fails (monorepo / pnpm), open the project → **Settings → General → Build & Development** and set:

- **Install Command:** `cd ../.. && corepack enable && pnpm install`
- **Build Command:** `cd ../.. && pnpm turbo run build --filter=@chapterai/web...`

Then **Deployments → Redeploy**.

`apps/web/vercel.json` in the repo should apply these automatically on the next deploy after you push.

### Link them

Railway → set `WEB_URL=https://my-bankruptcy.vercel.app` → redeploy API.

### On your phone

```
https://my-bankruptcy.vercel.app/matters/demo/command
```

---

## Part 3 — At home only (same Wi‑Fi)

```
http://YOUR-PC-LAN-IP:3000/matters/demo/command
```

Stops working when you leave the house.

---

## Checklist

| Item | Required for phone anywhere? |
|------|------------------------------|
| GitHub repo `my-bankruptcy` | Yes |
| Vercel + Railway | Yes |
| Neon / Clerk / PACER | No (demo mode) |
