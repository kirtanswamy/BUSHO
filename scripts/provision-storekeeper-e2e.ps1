$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent $PSScriptRoot)

$credentialPath = Join-Path (Get-Location) ".local-e2e\credentials.json"
if (-not (Test-Path $credentialPath)) {
    throw "Local E2E credentials file not found. Run scripts/local-supabase-auth-smoke.mjs first."
}

$credentials = Get-Content $credentialPath -Raw | ConvertFrom-Json
$apiUrl = "http://127.0.0.1:54321"
if ($credentials.fixture -ne "a204be7a" -or
    $credentials.api_url -ne $apiUrl -or
    -not $credentials.password -or
    -not $credentials.facility_a_id) {
    throw "Credentials do not match the expected local fixture or are missing Facility A."
}

$workerAccount = @($credentials.accounts | Where-Object { $_.label -eq "worker-a" })
if ($workerAccount.Count -ne 1) {
    throw "Expected exactly one worker-a credential entry."
}
$emailMatch = [regex]::Match([string]$workerAccount[0].email, '^busho-e2e-worker-a-([a-f0-9]{8})@example\.test$')
if (-not $emailMatch.Success) {
    throw "Could not derive the synthetic run suffix from worker-a credentials."
}
$suffix = $emailMatch.Groups[1].Value
$facilityId = [string]$credentials.facility_a_id
$email = "busho-e2e-storekeeper-e2e-$suffix@example.test"

# Read local Supabase keys without printing them.
$previousPreference = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
$statusLines = & npx.cmd supabase status --output env 2>&1
$cliExitCode = $LASTEXITCODE
$ErrorActionPreference = $previousPreference
if ($cliExitCode -ne 0) {
    throw "Could not read local Supabase environment. Check that the local Supabase stack is running."
}

$statusText = $statusLines -join "`n"
$envValues = @{}
foreach ($line in ($statusText -split "`r?`n")) {
    if ($line -match '^\s*(?:export\s+)?([A-Z0-9_]+)="?([^"\r\n]+)"?\s*$') {
        $envValues[$Matches[1]] = $Matches[2]
    }
}
$serviceKey = $envValues["SERVICE_ROLE_KEY"]
if (-not $serviceKey) {
    throw "SERVICE_ROLE_KEY was not found in local Supabase status output."
}

$headers = @{
    apikey        = $serviceKey
    Authorization = "Bearer $serviceKey"
}

function Invoke-LocalRest {
    param(
        [Parameter(Mandatory)][string]$Path,
        [string]$Method = "GET",
        $Body = $null
    )

    $params = @{
        Uri         = "$apiUrl$Path"
        Method      = $Method
        Headers     = ($headers + @{ Prefer = "return=representation" })
        ContentType = "application/json"
    }
    if ($null -ne $Body) {
        $params.Body = ConvertTo-Json -InputObject $Body -Depth 10
    }
    Invoke-RestMethod @params
}

# Preflight against the dynamically generated Facility A before provisioning.
$facility = Invoke-LocalRest -Path "/rest/v1/facilities?select=id&id=eq.$facilityId"
if (@($facility).Count -ne 1) {
    throw "Facility A from the API smoke fixture was not found."
}
$inventory = Invoke-LocalRest -Path "/rest/v1/inventory_items?select=id&facility_id=eq.$facilityId&is_active=eq.true"
if (@($inventory).Count -lt 1) {
    throw "Facility A has no active inventory. Run the API smoke fixture successfully first."
}

$user = $null
$userId = $null
$createdUser = $false
try {
    # The generated run suffix makes this identity unique to the current API
    # fixture. Reuse it on retries, rather than failing on duplicate email.
    $listed = Invoke-RestMethod -Uri "$apiUrl/auth/v1/admin/users?page=1&per_page=1000" -Headers $headers
    $matches = @($listed.users | Where-Object { $_.email -eq $email })
    if ($matches.Count -gt 1) {
        throw "More than one local Auth account matched the dedicated storekeeper fixture."
    }

    if ($matches.Count -eq 1) {
        $userId = $matches[0].id
        # This is a synthetic .example.test identity from this exact run.
        # Reapply its fixture password so retries remain deterministic.
        $user = Invoke-RestMethod `
            -Uri "$apiUrl/auth/v1/admin/users/$userId" `
            -Method PUT `
            -Headers $headers `
            -ContentType "application/json" `
            -Body (ConvertTo-Json @{ password = $credentials.password; email_confirm = $true } -Depth 5)
    }
    else {
        $user = Invoke-RestMethod `
            -Uri "$apiUrl/auth/v1/admin/users" `
            -Method POST `
            -Headers $headers `
            -ContentType "application/json" `
            -Body (ConvertTo-Json @{
                email         = $email
                password      = $credentials.password
                email_confirm = $true
                user_metadata = @{ full_name = "Synthetic storekeeper E2E"; preferred_language = "en" }
            } -Depth 5)
        $createdUser = $true
        $userId = $user.id
    }

    if (-not $userId) {
        throw "Auth user provisioning returned no user ID."
    }

    $profile = Invoke-LocalRest -Path "/rest/v1/profiles?id=eq.$userId&select=id,role,status" -Method PATCH -Body @{ role = "storekeeper"; status = "active" }
    if (@($profile).Count -eq 0) {
        Invoke-LocalRest -Path "/rest/v1/profiles" -Method POST -Body @{ id = $userId; role = "storekeeper"; status = "active" } | Out-Null
    }

    $assignments = Invoke-LocalRest -Path "/rest/v1/user_facility_assignments?select=id,user_id,facility_id,assignment_role,is_active&user_id=eq.$userId&facility_id=eq.$facilityId&assignment_role=eq.storekeeper"
    if (@($assignments).Count -eq 0) {
        Invoke-LocalRest -Path "/rest/v1/user_facility_assignments" -Method POST -Body @(@{
            user_id = $userId; facility_id = $facilityId; assignment_role = "storekeeper"; is_active = $true
        }) | Out-Null
    }
    else {
        Invoke-LocalRest -Path "/rest/v1/user_facility_assignments?id=eq.$($assignments[0].id)" -Method PATCH -Body @{ is_active = $true } | Out-Null
    }

    $verifiedProfile = Invoke-LocalRest -Path "/rest/v1/profiles?id=eq.$userId&select=id,role,status"
    $verifiedAssignment = Invoke-LocalRest -Path "/rest/v1/user_facility_assignments?user_id=eq.$userId&facility_id=eq.$facilityId&assignment_role=eq.storekeeper&select=id,is_active"
    if (@($verifiedProfile).Count -ne 1 -or
        $verifiedProfile[0].role -ne "storekeeper" -or
        $verifiedProfile[0].status -ne "active" -or
        @($verifiedAssignment).Count -ne 1 -or
        $verifiedAssignment[0].is_active -ne $true) {
        throw "Post-provisioning profile or facility assignment verification failed."
    }

    $accounts = @($credentials.accounts | Where-Object { $_.label -ne "storekeeper-e2e" })
    $accounts += [pscustomobject]@{ label = "storekeeper-e2e"; email = $email; user_id = $userId }
    $credentials.accounts = $accounts
    $credentialsJson = $credentials | ConvertTo-Json -Depth 12
    $utf8NoBom = New-Object System.Text.UTF8Encoding -ArgumentList $false
    $temporaryPath = $credentialPath + ".tmp"
    [System.IO.File]::WriteAllText($temporaryPath, $credentialsJson, $utf8NoBom)
    Move-Item -LiteralPath $temporaryPath -Destination $credentialPath -Force

    Write-Host "SUCCESS: dedicated local storekeeper created or reused and verified."
    Write-Host "Label: storekeeper-e2e"
    Write-Host "Facility assignment: generated Facility A ($facilityId)"
    Write-Host "Active inventory items visible to service role: $(@($inventory).Count)"
    Write-Host "Password and service-role key were not printed."
}
catch {
    $failure = $_
    if ($createdUser -and $userId) {
        try {
            Invoke-LocalRest -Path "/rest/v1/user_facility_assignments?user_id=eq.$userId" -Method DELETE | Out-Null
            Invoke-RestMethod -Uri "$apiUrl/auth/v1/admin/users/$userId" -Method DELETE -Headers $headers | Out-Null
            Write-Warning "Newly created partial fixture account was rolled back."
        }
        catch {
            Write-Warning "Automatic rollback was incomplete. Inspect the newly created account before retrying."
        }
    }
    throw $failure
}
