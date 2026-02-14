param(
  [Parameter(Mandatory = $true)][string]$ConfigPath = "clients/demo-brand/supabase.json"
)

if (!(Test-Path $ConfigPath)) {
  Write-Error "Config file not found: $ConfigPath"
  exit 1
}

$cfg = Get-Content $ConfigPath | ConvertFrom-Json

function Ensure-SupabaseCli {
  $cli = Get-Command supabase -ErrorAction SilentlyContinue
  if ($cli -eq $null) {
    Write-Error "Supabase CLI not found. Install it: npm i -g supabase"
    exit 1
  }
}

Ensure-SupabaseCli

Write-Host "Logging into Supabase..."
supabase login --token "$($cfg.SUPABASE_ACCESS_TOKEN)"
if ($LASTEXITCODE -ne 0) { Write-Error "Supabase login failed"; exit $LASTEXITCODE }

Write-Host "Linking project '$($cfg.TARGET_REF)' and pushing migrations..."
supabase link --project-ref "$($cfg.TARGET_REF)"
if ($LASTEXITCODE -ne 0) { Write-Error "Link failed"; exit $LASTEXITCODE }

supabase db push
if ($LASTEXITCODE -ne 0) { Write-Error "db push failed"; exit $LASTEXITCODE }

Write-Host "Setting function secrets..."
if ($cfg.TARGET_URL) { supabase functions secrets set SUPABASE_URL="$($cfg.TARGET_URL)" --project-ref "$($cfg.TARGET_REF)" }
if ($cfg.SUPABASE_SERVICE_ROLE_KEY) { supabase functions secrets set SUPABASE_SERVICE_ROLE_KEY="$($cfg.SUPABASE_SERVICE_ROLE_KEY)" --project-ref "$($cfg.TARGET_REF)" }
if ($cfg.KIWIFY_WEBHOOK_SECRET) { supabase functions secrets set KIWIFY_WEBHOOK_SECRET="$($cfg.KIWIFY_WEBHOOK_SECRET)" --project-ref "$($cfg.TARGET_REF)" }
if ($cfg.FIREBASE_SERVER_KEY) { supabase functions secrets set FIREBASE_SERVER_KEY="$($cfg.FIREBASE_SERVER_KEY)" --project-ref "$($cfg.TARGET_REF)" }

Write-Host "Deploying Edge Functions..."
foreach ($fn in @("handle-purchase","claim-purchases","moderate-content","process-referral","process-referral-reward","seed-database","send-push")) {
  supabase functions deploy $fn --project-ref "$($cfg.TARGET_REF)"
  if ($LASTEXITCODE -ne 0) { Write-Error "Deploy failed for function: $fn"; exit $LASTEXITCODE }
}

Write-Host "✅ Provisioning completed for project '$($cfg.TARGET_REF)'"