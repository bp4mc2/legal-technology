$ScriptDir = $PSScriptRoot
$ProjectRoot = Resolve-Path "$ScriptDir\.."
Set-Location $ProjectRoot
$ErrorActionPreference = "Stop"

Write-Host "Stap 1: Generate ReSpec bronbestanden"
python tools/generate_respec.py
if ($LASTEXITCODE -ne 0) {
  throw "Genereren van ReSpec bronbestanden mislukt."
}

$RespecInputDir = "build/docs/respec"
$AssetInputDir = "build/docs/assets"
$DistRootDir = "dist"
$DistAssetDir = "dist/assets"
$RespecPort = 3010

if (!(Test-Path $RespecInputDir)) {
  throw "Bronmap niet gevonden: $RespecInputDir"
}

New-Item -ItemType Directory -Path $DistRootDir -Force | Out-Null
New-Item -ItemType Directory -Path $DistAssetDir -Force | Out-Null

Get-ChildItem -Path $DistRootDir -Filter "*.html" -ErrorAction SilentlyContinue | Remove-Item -Force
if (Test-Path "dist/site") {
  Remove-Item "dist/site" -Recurse -Force
}

Write-Host "Stap 2: Build alle statische HTML pagina's via ReSpec CLI"
$respecPages = @(
  "index.html",
  "typologie.html",
  "catalogus.html",
  "begrippenkader.html",
  "ontologie.html"
)

foreach ($page in $respecPages) {
  $srcPath = Join-Path $RespecInputDir $page
  if (!(Test-Path $srcPath)) {
    throw "ReSpec bronbestand niet gevonden: $srcPath"
  }

  $outPath = Join-Path $DistRootDir $page

  Write-Host " - Build $page"

  npx respec `
    --src $srcPath `
    --out $outPath `
    --localhost `
    --port $RespecPort `
    --use-local `
    --timeout 60 `
    --verbose

  if ($LASTEXITCODE -ne 0) {
    throw "ReSpec build mislukt voor: $srcPath"
  }
}

if (Test-Path $AssetInputDir) {
  Write-Host "Stap 3: Kopieer assets naar dist"
  Copy-Item "$AssetInputDir\*" $DistAssetDir -Recurse -Force
}

Write-Host "Stap 4: Build PDF (Playwright) van statische HTML"
node tools/pdf.js

if ($LASTEXITCODE -ne 0) {
  throw "PDF build mislukt."
}

Write-Host "Done!"