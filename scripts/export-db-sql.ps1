param(
  [string]$MigrationsPath = "supabase/migrations",
  [string]$OutputPath = "clients/demo-brand/schema.sql",
  [string]$FunctionsListPath = "clients/demo-brand/functions-list.txt"
)

Write-Host "Exportando schema a partir de '$MigrationsPath'..."

if (!(Test-Path $MigrationsPath)) {
  Write-Error "Caminho de migrações não encontrado: $MigrationsPath"
  exit 1
}

$files = Get-ChildItem -Path $MigrationsPath -Filter *.sql | Sort-Object Name
if ($files.Count -eq 0) {
  Write-Error "Nenhum arquivo .sql encontrado em $MigrationsPath"
  exit 1
}

$outputDir = Split-Path -Parent $OutputPath
if (!(Test-Path $outputDir)) { New-Item -ItemType Directory -Force -Path $outputDir | Out-Null }

$header = @(
  "-- Consolidated SQL Schema Export",
  "-- Source: $MigrationsPath",
  "-- Generated: $(Get-Date -Format o)",
  "-- NOTE: This file aggregates all migration files in lexical order.",
  "-- It includes tables, indexes, policies, grants and RPC functions.",
  ""
)

Set-Content -Path $OutputPath -Value ($header -join "`n") -Encoding UTF8

$funcLines = @()

foreach ($f in $files) {
  $sep = "`n-- ========================`n-- File: $($f.Name)`n-- ========================`n"
  Add-Content -Path $OutputPath -Value $sep -Encoding UTF8
  $content = Get-Content -Path $f.FullName -Raw
  Add-Content -Path $OutputPath -Value $content -Encoding UTF8

  $lines = $content -split "`r?`n"
  foreach ($line in $lines) {
    if ($line -match "(?i)^\s*create\s+or\s+replace\s+function\s+") {
      $funcLines += "$($f.Name): $line"
    }
  }
}

if ($funcLines.Count -gt 0) {
  $funcHeader = @(
    "Functions/RPCs detected:",
    "-----------------------------------"
  )
  if (!(Test-Path (Split-Path -Parent $FunctionsListPath))) { New-Item -ItemType Directory -Force -Path (Split-Path -Parent $FunctionsListPath) | Out-Null }
  Set-Content -Path $FunctionsListPath -Value ($funcHeader -join "`n") -Encoding UTF8
  Add-Content -Path $FunctionsListPath -Value ($funcLines -join "`n") -Encoding UTF8
}

Write-Host "✅ Export concluído: $OutputPath"
if ($funcLines.Count -gt 0) { Write-Host "✅ Lista de funções: $FunctionsListPath" }