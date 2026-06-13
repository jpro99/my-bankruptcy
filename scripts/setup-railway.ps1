# My Bankruptcy — Railway API + Vercel link
# Run from repo root: .\scripts\setup-railway.ps1

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path $PSScriptRoot -Parent
Set-Location $RepoRoot

$Railway = "npx"
$RailwayArgs = @("@railway/cli")
$VercelWeb = Join-Path $RepoRoot "apps\web"
$WebUrl = "https://my-bankruptcy.vercel.app"

Write-Host "`n=== My Bankruptcy — Railway API Setup ===" -ForegroundColor Cyan

Write-Host "`n[1/5] Checking Railway login..." -ForegroundColor Yellow
& $Railway @RailwayArgs whoami 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Host "Not logged in. Opening Railway sign-in..." -ForegroundColor Yellow
  Write-Host "Complete sign-in in your browser, then run this script again.`n"
  & $Railway @RailwayArgs login
}

Write-Host "`n[2/5] Creating / linking Railway project (my-bankruptcy-api)..." -ForegroundColor Yellow
& $Railway @RailwayArgs up --new --name my-bankruptcy-api --detach -y -m "my-bankruptcy API deploy"
if ($LASTEXITCODE -ne 0) {
  Write-Host "Deploy failed. Check Railway dashboard." -ForegroundColor Red
  exit 1
}

Write-Host "`n[3/5] Setting environment variables..." -ForegroundColor Yellow
& $Railway @RailwayArgs variables set "DEV_AUTH_BYPASS=1" "NODE_ENV=production" "WEB_URL=$WebUrl"

Write-Host "`n[4/5] Generating public domain..." -ForegroundColor Yellow
& $Railway @RailwayArgs domain 2>&1
Write-Host "`nCopy the https://....up.railway.app URL above." -ForegroundColor Green

$ApiUrl = Read-Host "`nPaste your Railway API URL (no trailing slash)"

if (-not $ApiUrl) {
  Write-Host "No URL entered. Set Vercel env manually: NEXT_PUBLIC_API_URL" -ForegroundColor Yellow
  exit 0
}

Write-Host "`n[5/5] Linking Vercel (apps/web)..." -ForegroundColor Yellow
Set-Location $VercelWeb
echo $ApiUrl | npx vercel env add NEXT_PUBLIC_API_URL production
echo $ApiUrl | npx vercel env add NEXT_PUBLIC_API_URL preview
npx vercel env ls
Write-Host "`nRedeploying Vercel..." -ForegroundColor Yellow
npx vercel --prod --yes

Write-Host "`n=== Done ===" -ForegroundColor Green
Write-Host "API health: $ApiUrl/health"
Write-Host "Phone test: $WebUrl/matters/demo/cockpit"
Write-Host "Approve fields + God Button should work when API shows Live.`n"
