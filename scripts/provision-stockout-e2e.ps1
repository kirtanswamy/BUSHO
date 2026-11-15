$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent $PSScriptRoot)

$credentialPath = Join-Path (Get-Location) ".local-e2e\credentials.json"
if (-not (Test-Path $credentialPath)) { throw "Local E2E credentials file is missing." }
$credentials = Get-Content $credentialPath -Raw | ConvertFrom-Json
$apiUrl = "http://127.0.0.1:54321"
if ($credentials.fixture -ne "a204be7a" -or $credentials.api_url -ne $apiUrl -or -not $credentials.password) {
    throw "Stockout E2E provisioning accepts only the expected local synthetic fixture."
}

# Read keys only from the local Supabase CLI. Never print them or contact hosted Supabase.
$previousPreference = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
$statusLines = & npx.cmd supabase status --output env 2>&1
$cliExitCode = $LASTEXITCODE
$ErrorActionPreference = $previousPreference
if ($cliExitCode -ne 0) { throw "Local Supabase is not running." }

$statusText = $statusLines -join [Environment]::NewLine
$envValues = @{}
foreach ($line in [regex]::Split($statusText, "\r?\n")) {
    if ($line -match '^\s*(?:export\s+)?([A-Z0-9_]+)="?([^"\r\n]+)"?\s*$') {
        $envValues[$Matches[1]] = $Matches[2]
    }
}
$serviceKey = $envValues["SERVICE_ROLE_KEY"]
if (-not $serviceKey) { throw "Local SERVICE_ROLE_KEY was not returned by Supabase CLI." }

$headers = @{ apikey=$serviceKey; Authorization="Bearer $serviceKey"; Prefer="return=representation" }

function Invoke-LocalRest {
    param(
        [Parameter(Mandatory)][string]$Path,
        [string]$Method = "GET",
        $Body = $null,
        [hashtable]$ExtraHeaders = @{}
    )
    $requestHeaders = @{}
    foreach ($key in $headers.Keys) { $requestHeaders[$key] = $headers[$key] }
    foreach ($key in $ExtraHeaders.Keys) { $requestHeaders[$key] = $ExtraHeaders[$key] }

    $params = @{
        Uri = "$apiUrl$Path"
        Method = $Method
        Headers = $requestHeaders
        ContentType = "application/json"
    }
    if ($null -ne $Body) { $params.Body = ConvertTo-Json -InputObject $Body -Depth 12 }
    Invoke-RestMethod @params
}

function Assert-OneOrZero {
    param([object[]]$Rows,[string]$Description)
    if ($Rows.Count -gt 1) { throw "Ambiguous local synthetic fixture: multiple $Description records exist. No record was selected." }
}

function Ensure-User {
    param([string]$Label,[string]$Email,[string]$Role,[string]$FacilityId)

    $listed = Invoke-RestMethod -Uri "$apiUrl/auth/v1/admin/users?page=1&per_page=1000" -Headers $headers
    $matches = @($listed.users | Where-Object { $_.email -eq $Email })
    Assert-OneOrZero -Rows $matches -Description "Auth users for $Label"

    if ($matches.Count -eq 0) {
        $created = Invoke-RestMethod -Uri "$apiUrl/auth/v1/admin/users" -Method POST -Headers $headers -ContentType "application/json" -Body (ConvertTo-Json @{
            email=$Email; password=$credentials.password; email_confirm=$true
            user_metadata=@{ full_name="BUSHO synthetic $Label"; preferred_language="en" }
        } -Depth 5)
        $userId = $created.id
    } else {
        $userId = $matches[0].id
        # These fixed .example.test identities are local synthetic fixtures.
        # Reapply the current API-run password so browser logins remain valid
        # after a fresh API smoke run replaces credentials.json.
        Invoke-RestMethod -Uri "$apiUrl/auth/v1/admin/users/$userId" -Method PUT -Headers $headers -ContentType "application/json" -Body (ConvertTo-Json @{
            password=$credentials.password; email_confirm=$true
        } -Depth 5) | Out-Null
    }
    if (-not $userId) { throw "Could not provision local synthetic account $Label." }

    # Profiles: reject duplicates, then verify the persisted role and status.
    $profiles = @(Invoke-LocalRest -Path "/rest/v1/profiles?select=id,role,status&id=eq.$userId")
    Assert-OneOrZero -Rows $profiles -Description "profiles for $Label"
    if ($profiles.Count -eq 0) {
        Invoke-LocalRest -Path "/rest/v1/profiles" -Method POST -Body @{id=$userId;role=$Role;status="active"} | Out-Null
    } else {
        Invoke-LocalRest -Path "/rest/v1/profiles?id=eq.$userId" -Method PATCH -Body @{role=$Role;status="active"} | Out-Null
    }
    $verifiedProfile = @(Invoke-LocalRest -Path "/rest/v1/profiles?select=id,role,status&id=eq.$userId")
    if ($verifiedProfile.Count -ne 1 -or $verifiedProfile[0].role -ne $Role -or $verifiedProfile[0].status -ne "active") {
        throw "Profile verification failed for $Label."
    }

    # A test identity must not have another active facility/role assignment.
    $allAssignments = @(Invoke-LocalRest -Path "/rest/v1/user_facility_assignments?select=id,facility_id,assignment_role,is_active&user_id=eq.$userId")
    $activeConflicts = @($allAssignments | Where-Object {
        $_.is_active -eq $true -and ($_.facility_id -ne $FacilityId -or $_.assignment_role -ne $Role)
    })
    if ($activeConflicts.Count -gt 0) { throw "Conflicting active facility assignment exists for $Label; refusing to change it." }

    $targetAssignments = @($allAssignments | Where-Object { $_.facility_id -eq $FacilityId -and $_.assignment_role -eq $Role })
    Assert-OneOrZero -Rows $targetAssignments -Description "target assignments for $Label"
    if ($targetAssignments.Count -eq 0) {
        Invoke-LocalRest -Path "/rest/v1/user_facility_assignments" -Method POST -Body @{
            user_id=$userId;facility_id=$FacilityId;assignment_role=$Role;is_active=$true
        } | Out-Null
    } elseif ($targetAssignments[0].is_active -ne $true) {
        Invoke-LocalRest -Path "/rest/v1/user_facility_assignments?id=eq.$($targetAssignments[0].id)" -Method PATCH -Body @{is_active=$true} | Out-Null
    }
    $verifiedAssignments = @(Invoke-LocalRest -Path "/rest/v1/user_facility_assignments?select=id,facility_id,assignment_role,is_active&user_id=eq.$userId&facility_id=eq.$FacilityId&assignment_role=eq.$Role&is_active=eq.true")
    if ($verifiedAssignments.Count -ne 1) { throw "Active facility assignment verification failed for $Label." }

    if ($Role -eq "worker") {
        $workers = @(Invoke-LocalRest -Path "/rest/v1/workers?select=id,facility_id,auth_user_id,is_active&auth_user_id=eq.$userId")
        Assert-OneOrZero -Rows $workers -Description "worker rows for $Label"
        if ($workers.Count -eq 0) {
            Invoke-LocalRest -Path "/rest/v1/workers" -Method POST -Body @{
                facility_id=$FacilityId; display_name="BUSHO synthetic SHC worker"; whatsapp_number="+910000000081"; role="worker"; is_active=$true; auth_user_id=$userId
            } | Out-Null
        } else {
            if ($workers[0].facility_id -ne $FacilityId) {
                throw "Existing worker row for $Label belongs to a different facility; refusing to reassign it."
            }
            if ($workers[0].is_active -ne $true) {
                Invoke-LocalRest -Path "/rest/v1/workers?id=eq.$($workers[0].id)" -Method PATCH -Body @{is_active=$true} | Out-Null
            }
        }
        $verifiedWorkers = @(Invoke-LocalRest -Path "/rest/v1/workers?select=id,facility_id,auth_user_id,is_active&auth_user_id=eq.$userId&facility_id=eq.$FacilityId&is_active=eq.true")
        if ($verifiedWorkers.Count -ne 1) { throw "Worker record verification failed for $Label." }
    }

    return [pscustomobject]@{label=$Label;email=$Email;id=$userId}
}

# These IDs are reserved for this local synthetic E2E fixture. Existing rows
# must already match the expected synthetic identity; never overwrite unknown rows.
$facilities = @(
    @{id="f0000000-0000-4000-8000-000000000001";name="BUSHO Synthetic SHC E2E";district="Dhamtari";state="Chhattisgarh";state_lgd_code="22";district_lgd_code="377";block_lgd_code="3625";facility_type="aam_shc";verification_status="verified";is_synthetic=$true},
    @{id="f0000000-0000-4000-8000-000000000002";name="BUSHO Synthetic PHC E2E";district="Dhamtari";state="Chhattisgarh";state_lgd_code="22";district_lgd_code="377";block_lgd_code="3625";facility_type="phc";verification_status="verified";is_synthetic=$true},
    @{id="f0000000-0000-4000-8000-000000000003";name="BUSHO Synthetic Other PHC E2E";district="Dhamtari";state="Chhattisgarh";state_lgd_code="22";district_lgd_code="377";block_lgd_code="3625";facility_type="phc";verification_status="verified";is_synthetic=$true}
)
foreach ($facility in $facilities) {
    $existing = @(Invoke-LocalRest -Path "/rest/v1/facilities?select=id,name,district,state,state_lgd_code,district_lgd_code,block_lgd_code,facility_type,verification_status,is_synthetic&id=eq.$($facility.id)")
    Assert-OneOrZero -Rows $existing -Description "facility rows for reserved fixture ID $($facility.id)"
    if ($existing.Count -eq 0) {
        Invoke-LocalRest -Path "/rest/v1/facilities" -Method POST -Body $facility | Out-Null
    } else {
        foreach ($field in @("name","district","state","state_lgd_code","district_lgd_code","block_lgd_code","facility_type","verification_status","is_synthetic")) {
            if ([string]$existing[0].$field -ne [string]$facility[$field]) {
                throw "Reserved facility ID $($facility.id) exists but does not match the expected synthetic fixture ($field)."
            }
        }
    }
    $verifiedFacility = @(Invoke-LocalRest -Path "/rest/v1/facilities?select=id,is_synthetic&id=eq.$($facility.id)")
    if ($verifiedFacility.Count -ne 1 -or $verifiedFacility[0].is_synthetic -ne $true) {
        throw "Facility verification failed for reserved synthetic ID $($facility.id)."
    }
}

$worker = Ensure-User -Label "stockout-worker" -Email "busho-stockout-worker-a204be7a@example.test" -Role "worker" -FacilityId $facilities[0].id
$supervisor = Ensure-User -Label "stockout-supervisor" -Email "busho-stockout-supervisor-a204be7a@example.test" -Role "supervisor" -FacilityId $facilities[1].id
$storekeeper = Ensure-User -Label "stockout-storekeeper" -Email "busho-stockout-storekeeper-a204be7a@example.test" -Role "storekeeper" -FacilityId $facilities[1].id
$otherStorekeeper = Ensure-User -Label "stockout-storekeeper-other" -Email "busho-stockout-storekeeper-other-a204be7a@example.test" -Role "storekeeper" -FacilityId $facilities[2].id

# Look up all statuses, not just verified, so an existing pending/rejected
# relation cannot be shadowed by a second row for the same facility pair.
$linkRows = @(Invoke-LocalRest -Path "/rest/v1/facility_service_links?select=id,shc_facility_id,phc_facility_id,verification_status,source_authority,source_reference,data_mode&shc_facility_id=eq.$($facilities[0].id)&phc_facility_id=eq.$($facilities[1].id)")
Assert-OneOrZero -Rows $linkRows -Description "SHC-PHC service links for the fixture pair"

$nowUtc = [DateTime]::UtcNow
$indiaTimeZone = [TimeZoneInfo]::FindSystemTimeZoneById("India Standard Time")
$indiaNow = [TimeZoneInfo]::ConvertTimeFromUtc($nowUtc, $indiaTimeZone)
$linkBody = @{
    shc_facility_id=$facilities[0].id
    phc_facility_id=$facilities[1].id
    verification_status="verified"
    source_authority="BUSHO local synthetic E2E fixture"
    source_reference="BUSHO-E2E-SHC-PHC-a204be7a"
    verified_at=$nowUtc.ToString("o")
    effective_from=$indiaNow.ToString("yyyy-MM-dd")
    data_mode="synthetic_demo"
}
if ($linkRows.Count -eq 0) {
    Invoke-LocalRest -Path "/rest/v1/facility_service_links" -Method POST -Body $linkBody | Out-Null
} else {
    $existingLink = $linkRows[0]
    if ($existingLink.data_mode -ne "synthetic_demo" -or
        $existingLink.source_reference -ne "BUSHO-E2E-SHC-PHC-a204be7a" -or
        $existingLink.source_authority -ne "BUSHO local synthetic E2E fixture") {
        throw "An existing SHC-PHC link is not the expected synthetic fixture; refusing to overwrite it."
    }
    Invoke-LocalRest -Path "/rest/v1/facility_service_links?id=eq.$($existingLink.id)" -Method PATCH -Body $linkBody | Out-Null
}
$verifiedLinks = @(Invoke-LocalRest -Path "/rest/v1/facility_service_links?select=id,shc_facility_id,phc_facility_id,verification_status,source_reference,data_mode&shc_facility_id=eq.$($facilities[0].id)&phc_facility_id=eq.$($facilities[1].id)")
if ($verifiedLinks.Count -ne 1 -or
    $verifiedLinks[0].verification_status -ne "verified" -or
    $verifiedLinks[0].source_reference -ne "BUSHO-E2E-SHC-PHC-a204be7a" -or
    $verifiedLinks[0].data_mode -ne "synthetic_demo") {
    throw "Verified synthetic SHC-PHC link verification failed."
}

# Store only account labels/emails in the Git-ignored local credentials file.
$labels = @("stockout-worker","stockout-supervisor","stockout-storekeeper","stockout-storekeeper-other")
$emails = @($worker.email,$supervisor.email,$storekeeper.email,$otherStorekeeper.email)
$accounts = @($credentials.accounts | Where-Object { $_.label -notin $labels })
for ($i=0; $i -lt $labels.Count; $i++) {
    $accounts += [pscustomobject]@{label=$labels[$i];email=$emails[$i]}
}
$credentials.accounts = $accounts
$credentialsJson = $credentials | ConvertTo-Json -Depth 12
$utf8NoBom = New-Object System.Text.UTF8Encoding -ArgumentList $false
$tempCredentialPath = "$credentialPath.$([guid]::NewGuid().ToString('N')).tmp"
try {
    [System.IO.File]::WriteAllText($tempCredentialPath,$credentialsJson,$utf8NoBom)
    if (Test-Path $credentialPath) {
        # File.Replace requires a valid backup path on Windows/.NET Framework.
        # Keep the backup beside the target and remove it after replacement.
        $backupCredentialPath = "$credentialPath.$([guid]::NewGuid().ToString('N')).bak"
        [System.IO.File]::Replace($tempCredentialPath,$credentialPath,$backupCredentialPath)
        if (Test-Path $backupCredentialPath) {
            Remove-Item -LiteralPath $backupCredentialPath -Force
        }
    } else {
        [System.IO.File]::Move($tempCredentialPath,$credentialPath)
    }
} finally {
    if (Test-Path $tempCredentialPath) { Remove-Item -LiteralPath $tempCredentialPath -Force }
    if ($backupCredentialPath -and (Test-Path $backupCredentialPath)) {
        Remove-Item -LiteralPath $backupCredentialPath -Force
    }
}

Write-Host "Synthetic SHC-to-PHC E2E fixtures are ready in local Supabase."
Write-Host "Accounts added: stockout-worker, stockout-supervisor, stockout-storekeeper, stockout-storekeeper-other."
Write-Host "Facilities verified: 1 synthetic SHC, 2 synthetic PHCs; 1 verified synthetic link."
Write-Host "No credentials, tokens, hosted database or production data were printed or changed."
