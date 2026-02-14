param(
  [string]$EnvPath = "clients/demo-brand/env.json"
)

$config = Get-Content $EnvPath | ConvertFrom-Json

$env:VITE_ENABLE_ADMIN = "false"
$env:VITE_BUILD_TARGET = "client"

$env:VITE_BRAND_NAME = "$($config.VITE_BRAND_NAME)"
$env:VITE_DEFAULT_DESCRIPTION = "$($config.VITE_DEFAULT_DESCRIPTION)"
$env:VITE_PWA_DESCRIPTION = "$($config.VITE_PWA_DESCRIPTION)"
$env:VITE_BASE_URL = "$($config.VITE_BASE_URL)"
$env:VITE_SUPABASE_URL = "$($config.VITE_SUPABASE_URL)"
$env:VITE_SUPABASE_PUBLISHABLE_KEY = "$($config.VITE_SUPABASE_PUBLISHABLE_KEY)"

Set-Location "mvp-starter"
if (Test-Path "dist") { Remove-Item "dist" -Recurse -Force }
npm run build

$outputRoot = Resolve-Path "..\clients\demo-brand"
$outputDir = Join-Path $outputRoot "dist"
if (!(Test-Path $outputDir)) { New-Item -ItemType Directory -Force -Path $outputDir | Out-Null }
Copy-Item -Recurse -Force "dist\*" $outputDir