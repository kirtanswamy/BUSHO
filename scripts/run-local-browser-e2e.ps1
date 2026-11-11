$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent $PSScriptRoot)

Write-Host "`n--- Validating local E2E credentials ---"

$credentialPath = Join-Path (Get-Location) ".local-e2e\credentials.json"

if (-not (Test-Path $credentialPath)) {
    throw "Local E2E credentials file is missing."
}

$credentials = Get-Content $credentialPath -Raw | ConvertFrom-Json

$expectedLabels = @(
    "worker-a",
    "supervisor-a",
    "worker-b",
    "supervisor-b",
    "storekeeper-a",
    "storekeeper-b",
    "storekeeper-e2e"
)

if ($credentials.fixture -ne "a204be7a") {
    throw "Unexpected fixture ID."
}

if ($credentials.api_url -ne "http://127.0.0.1:54321") {
    throw "Credentials file does not target the expected local API."
}

if (-not $credentials.password -or $credentials.accounts.Count -ne 7) {
    throw "Credentials file is incomplete."
}

foreach ($label in $expectedLabels) {
    $matches = @($credentials.accounts | Where-Object { $_.label -eq $label })
    if ($matches.Count -ne 1) {
        throw "Expected exactly one credential entry for $label."
    }
}

Write-Host "Seven local test accounts verified. Password values hidden."

Write-Host "`n--- Checking Git credential protection ---"

$ignored = & git check-ignore ".local-e2e/credentials.json"

if ($LASTEXITCODE -ne 0 -or -not $ignored) {
    throw "Credentials file is not ignored by Git."
}

Write-Host "Credentials file is Git-ignored."

Write-Host "`n--- Reading local Supabase environment ---"

$previousPreference = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
$statusLines = & npx.cmd supabase status --output env 2>&1
$cliExitCode = $LASTEXITCODE
$ErrorActionPreference = $previousPreference

$status = ($statusLines | ForEach-Object { "$_" }) -join "`n"

if ($cliExitCode -ne 0) {
    throw "Supabase CLI could not return local environment settings."
}

$publishableKey = $null

foreach ($line in ($status -split "`r?`n")) {
    if ($line -match '^\s*(?:export\s+)?(?:PUBLISHABLE_KEY|SUPABASE_PUBLISHABLE_KEY)="?([^"\r\n]+)"?\s*$') {
        $publishableKey = $Matches[1]
        break
    }
}

if (-not $publishableKey -or -not $publishableKey.StartsWith('sb_publishable_')) {
    throw "Local publishable key not found. Key values will not be printed."
}

Write-Host "Local publishable key detected. Value hidden."

Write-Host "`n--- Checking local Auth API ---"

try {
    $null = Invoke-RestMethod `
        -Uri 'http://127.0.0.1:54321/auth/v1/health' `
        -TimeoutSec 10

    Write-Host "Local Auth API responded."
}
catch {
    throw "Local Auth API is not responding at 127.0.0.1:54321."
}

$previousKey = $env:BUSHO_LOCAL_PUBLISHABLE_KEY
$previousPort = $env:PORT

$env:BUSHO_LOCAL_PUBLISHABLE_KEY = $publishableKey
$env:PORT = '3000'

try {
    Write-Host "`n--- Running local Playwright browser tests ---"

    & npx.cmd playwright test --config=playwright.config.mjs
    $testExitCode = $LASTEXITCODE

    if ($testExitCode -ne 0) {
        throw "Browser tests failed. Review Playwright output and test-results."
    }
}
finally {
    $env:BUSHO_LOCAL_PUBLISHABLE_KEY = $previousKey
    $env:PORT = $previousPort
    Remove-Variable publishableKey, status, statusLines -ErrorAction SilentlyContinue
}
