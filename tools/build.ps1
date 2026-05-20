$ScriptDir = $PSScriptRoot
$ProjectRoot = Resolve-Path "$ScriptDir\.."
Set-Location $ProjectRoot

Write-Host "Stap 1: Generate markdown"
python tools/generate_respec.py

Write-Host "Stap 2: Build static HTML via ReSpec CLI"
npx respec `
  --src media/index.html `
  --out dist/index.html `
  --localhost `
  --use-local `
  --timeout 60 `
  --verbose

Write-Host "Stap 3: Build PDF (Playwright) van statische HTML"
node tools/pdf.js

Write-Host "Done!"