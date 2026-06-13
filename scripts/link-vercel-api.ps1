param(
  [Parameter(Mandatory = $true)]
  [string]$ApiUrl
)

$ErrorActionPreference = "Stop"
$ApiUrl = $ApiUrl.TrimEnd("/")
$WebRoot = Join-Path (Split-Path $PSScriptRoot -Parent) "apps\web"

Write-Host "Linking Vercel to API: $ApiUrl" -ForegroundColor Cyan
Set-Location $WebRoot

# Remove existing if present (ignore errors)
npx vercel env rm NEXT_PUBLIC_API_URL production -y 2>$null
npx vercel env rm NEXT_PUBLIC_API_URL preview -y 2>$null

echo $ApiUrl | npx vercel env add NEXT_PUBLIC_API_URL production
echo $ApiUrl | npx vercel env add NEXT_PUBLIC_API_URL preview

Write-Host "`nRedeploying production..." -ForegroundColor Yellow
npx vercel --prod --yes

Write-Host "`nDone. Test: https://my-bankruptcy.vercel.app/matters/demo/cockpit" -ForegroundColor Green
Write-Host "Health: $ApiUrl/health"
