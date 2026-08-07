# Export catalog/users/orders from SimpleShop DB to frontend/shared/files/*.json
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path $PSScriptRoot -Parent
$outDir = Join-Path $repoRoot 'frontend\shared\files'
$project = Join-Path $PSScriptRoot 'ExportOfflineJson\ExportOfflineJson.csproj'

Push-Location $repoRoot
try {
    dotnet run --project $project -- $outDir
} finally {
    Pop-Location
}
