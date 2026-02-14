param(
  [Parameter(Mandatory = $true)][string]$SchemaPath,
  [Parameter(Mandatory = $true)][string]$TargetDbUrl
)

if (!(Test-Path $SchemaPath)) {
  Write-Error "Schema file not found: $SchemaPath"
  exit 1
}

Write-Host "Applying schema '$SchemaPath' to target DB..."

$psqlExists = (Get-Command psql -ErrorAction SilentlyContinue) -ne $null
if (-not $psqlExists) {
  Write-Error "psql not found. Please install PostgreSQL client to proceed."
  exit 1
}

& psql "$TargetDbUrl" -v ON_ERROR_STOP=1 -f "$SchemaPath"
if ($LASTEXITCODE -ne 0) {
  Write-Error "Schema application failed"
  exit $LASTEXITCODE
}

Write-Host "✅ Schema applied successfully"