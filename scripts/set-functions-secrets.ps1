param(
  [Parameter(Mandatory = $true)][string]$SupabaseAccessToken,
  [Parameter(Mandatory = $true)][string]$TargetRef,
  [string]$SupabaseUrl,
  [string]$ServiceRoleKey,
  [string]$WebhookSecret,
  [string]$FirebaseServerKey
)

function Ensure-SupabaseCli {
  $cli = Get-Command supabase -ErrorAction SilentlyContinue
  if ($cli -eq $null) {
    Write-Error "Supabase CLI not found. Install it: npm i -g supabase"
    exit 1
  }
}

Ensure-SupabaseCli

Write-Host "Logging into Supabase CLI..."
supabase login --token "$SupabaseAccessToken"
if ($LASTEXITCODE -ne 0) { Write-Error "Supabase login failed"; exit $LASTEXITCODE }

Write-Host "Setting function secrets on project '$TargetRef'..."
if ($SupabaseUrl) { supabase functions secrets set SUPABASE_URL="$SupabaseUrl" --project-ref "$TargetRef" }
if ($ServiceRoleKey) { supabase functions secrets set SUPABASE_SERVICE_ROLE_KEY="$ServiceRoleKey" --project-ref "$TargetRef" }
if ($WebhookSecret) { supabase functions secrets set KIWIFY_WEBHOOK_SECRET="$WebhookSecret" --project-ref "$TargetRef" }
if ($FirebaseServerKey) { supabase functions secrets set FIREBASE_SERVER_KEY="$FirebaseServerKey" --project-ref "$TargetRef" }

Write-Host "✅ Secrets updated"