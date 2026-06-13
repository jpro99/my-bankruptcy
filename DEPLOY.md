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

### Railway (API) — pick ONE method

#### Method A — Dashboard (easiest, no CLI)

1. Go to [railway.app/new](https://railway.app/new) → **Deploy from GitHub repo**
2. Select **my-bankruptcy**
3. **Settings → Source:** Root Directory = **`.`** (repo root)
4. **Variables** tab — add:
   ```
   DEV_AUTH_BYPASS=1
   NODE_ENV=production
   WEB_URL=https://my-bankruptcy.vercel.app
   ```
5. **Settings → Networking → Generate Domain** → copy URL (e.g. `https://my-bankruptcy-api-production.up.railway.app`)
6. Wait until deploy is **Healthy** (`/health` returns OK)

#### Method B — CLI (one script)

1. Complete Railway sign-in when browser opens
2. From repo root:
   ```powershell
   cd c:\Projects\ChapterAI
   .\scripts\setup-railway.ps1
   ```
3. Paste Railway URL when prompted — script links Vercel and redeploys

#### After you have the Railway URL

```powershell
cd c:\Projects\ChapterAI
.\scripts\link-vercel-api.ps1 -ApiUrl "https://YOUR-RAILWAY-URL.up.railway.app"
```

### Vercel (Web) — link the API

1. Vercel project **my-bankruptcy** → **Settings → Environment Variables**
2. Add:

   ```
   NEXT_PUBLIC_API_URL=https://YOUR-RAILWAY-URL.up.railway.app
   NEXT_PUBLIC_DEV_AUTH_BYPASS=1
   ```

3. **Deployments → Redeploy** (required after env var changes)

Or run: `.\scripts\link-vercel-api.ps1 -ApiUrl "https://YOUR-RAILWAY-URL.up.railway.app"`

The app checks `/health` on load — the yellow banner disappears when the API is reachable.

### Link them (if using dashboard)

Railway → Variables → confirm `WEB_URL=https://my-bankruptcy.vercel.app` → redeploy API if you changed it.

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
