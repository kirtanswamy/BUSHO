$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent $PSScriptRoot)

$credentialPath = Join-Path (Get-Location) ".local-e2e\credentials.json"
if (-not (Test-Path $credentialPath)) {
    throw "Local E2E credentials file not found."
}

$credentials = Get-Content $credentialPath -Raw | ConvertFrom-Json
if ($credentials.fixture -ne "a204be7a" -or
    $credentials.api_url -ne "http://127.0.0.1:54321" -or
    -not $credentials.password) {
    throw "Credentials do not match the expected local fixture."
}

$facilityId = "0fcf464e-cad9-4ba7-be64-5d50f5e66893"
$email = "busho-e2e-storekeeper-e2e-a204be7a@example.test"
$apiUrl = "http://127.0.0.1:54321"

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

# Preflight: facility and active inventory must exist.
$facility = Invoke-LocalRest -Path "/rest/v1/facilities?select=id&id=eq.$facilityId"
if (@($facility).Count -ne 1) {
    throw "Expected Facility A was not found."
}

$inventory = Invoke-LocalRest -Path "/rest/v1/inventory_items?select=id&facility_id=eq.$facilityId&is_active=eq.true"
if (@($inventory).Count -lt 1) {
    throw "Facility A has no active inventory. No account was created."
}

# Create one Auth user. If this fails, do not modify any existing account.
$user = $null
try {
    $user = Invoke-RestMethod `
        -Uri "$apiUrl/auth/v1/admin/users" `
        -Method POST `
        -Headers $headers `
        -ContentType "application/json" `
        -Body (ConvertTo-Json @{
            email         = $email
            password      = $credentials.password
            email_confirm = $true
            user_metadata = @{
                full_name = "Synthetic storekeeper E2E"
                preferred_language = "en"
            }
        } -Depth 5)

    if (-not $user.id) {
        throw "Auth user creation returned no user ID."
    }

    # Set the role/status explicitly using the local service role.
    $profile = Invoke-LocalRest `
        -Path "/rest/v1/profiles?id=eq.$($user.id)&select=id,role,status" `
        -Method PATCH `
        -Body @{ role = "storekeeper"; status = "active" }

    if (@($profile).Count -ne 1 -or
        $profile[0].role -ne "storekeeper" -or
        $profile[0].status -ne "active") {
        throw "The new profile was not provisioned as an active storekeeper."
    }

    # Assign the account to Facility A.
    $assignment = Invoke-LocalRest `
        -Path "/rest/v1/user_facility_assignments?select=id,user_id,facility_id,assignment_role,is_active" `
        -Method POST `
        -Body @(@{
            user_id         = $user.id
            facility_id     = $facilityId
            assignment_role = "storekeeper"
            is_active       = $true
        })

    if (@($assignment).Count -ne 1 -or
        $assignment[0].facility_id -ne $facilityId -or
        $assignment[0].assignment_role -ne "storekeeper" -or
        $assignment[0].is_active -ne $true) {
        throw "Facility assignment verification failed."
    }

    # Verify the profile and assignment from the database API.
    $verifiedProfile = Invoke-LocalRest `
        -Path "/rest/v1/profiles?id=eq.$($user.id)&select=id,role,status"

    $verifiedAssignment = Invoke-LocalRest `
        -Path "/rest/v1/user_facility_assignments?user_id=eq.$($user.id)&facility_id=eq.$facilityId&select=id,is_active,assignment_role"

    if (@($verifiedProfile).Count -ne 1 -or
        $verifiedProfile[0].role -ne "storekeeper" -or
        $verifiedProfile[0].status -ne "active" -or
        @($verifiedAssignment).Count -ne 1 -or
        $verifiedAssignment[0].is_active -ne $true) {
        throw "Post-provisioning verification failed."
    }

    Write-Host "SUCCESS: dedicated local storekeeper created and verified."
    Write-Host "Label: storekeeper-e2e"
    Write-Host "Email: $email"
    Write-Host "Role: active storekeeper"
    Write-Host "Facility assignment: Facility A"
    Write-Host "Active inventory items visible to service role: $(@($inventory).Count)"
    Write-Host "Password and service-role key were not printed."
}
catch {
    $failure = $_
    if ($user -and $user.id) {
        try {
            Invoke-LocalRest `
                -Path "/rest/v1/user_facility_assignments?user_id=eq.$($user.id)" `
                -Method DELETE | Out-Null
            Invoke-RestMethod `
                -Uri "$apiUrl/auth/v1/admin/users/$($user.id)" `
                -Method DELETE `
                -Headers $headers | Out-Null
            Write-Warning "Partially created account was rolled back."
        }
        catch {
            Write-Warning "Automatic rollback was incomplete. Inspect the new account before retrying."
        }
    }
    throw $failure
}
