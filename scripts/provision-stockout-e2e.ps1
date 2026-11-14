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
    param([Parameter(Mandatory)][string]$Path,[string]$Method="GET",$Body=$null,[hashtable]$ExtraHeaders=@{})
    $params = @{ Uri="$apiUrl$Path"; Method=$Method; Headers=($headers + $ExtraHeaders); ContentType="application/json" }
    if ($null -ne $Body) { $params.Body = ConvertTo-Json -InputObject $Body -Depth 12 }
    Invoke-RestMethod @params
}
function Ensure-User {
    param([string]$Label,[string]$Email,[string]$Role,[string]$FacilityId)
    $listed = Invoke-RestMethod -Uri "$apiUrl/auth/v1/admin/users?page=1&per_page=1000" -Headers $headers
    $user = @($listed.users | Where-Object { $_.email -eq $Email } | Select-Object -First 1)
    if ($user.Count -eq 0) {
        $created = Invoke-RestMethod -Uri "$apiUrl/auth/v1/admin/users" -Method POST -Headers $headers -ContentType "application/json" -Body (ConvertTo-Json @{
            email=$Email; password=$credentials.password; email_confirm=$true
            user_metadata=@{ full_name="BUSHO synthetic $Label"; preferred_language="en" }
        } -Depth 5)
        $userId = $created.id
    } else { $userId = $user[0].id }
    if (-not $userId) { throw "Could not provision local synthetic account $Label." }

    $profile = Invoke-LocalRest -Path "/rest/v1/profiles?id=eq.$userId&select=id" -Method PATCH -Body @{role=$Role;status="active"}
    if (@($profile).Count -eq 0) {
        Invoke-LocalRest -Path "/rest/v1/profiles" -Method POST -Body @{id=$userId;role=$Role;status="active"} | Out-Null
    }

    $assignments = Invoke-LocalRest -Path "/rest/v1/user_facility_assignments?select=id&user_id=eq.$userId&facility_id=eq.$FacilityId&assignment_role=eq.$Role"
    if (@($assignments).Count -eq 0) {
        Invoke-LocalRest -Path "/rest/v1/user_facility_assignments" -Method POST -Body @{user_id=$userId;facility_id=$FacilityId;assignment_role=$Role;is_active=$true} | Out-Null
    } else {
        Invoke-LocalRest -Path "/rest/v1/user_facility_assignments?id=eq.$($assignments[0].id)" -Method PATCH -Body @{is_active=$true} | Out-Null
    }

    if ($Role -eq "worker") {
        $workers = Invoke-LocalRest -Path "/rest/v1/workers?select=id&auth_user_id=eq.$userId"
        if (@($workers).Count -eq 0) {
            Invoke-LocalRest -Path "/rest/v1/workers" -Method POST -Body @{
                facility_id=$FacilityId; display_name="BUSHO synthetic SHC worker"; whatsapp_number="+910000000081"; role="worker"; is_active=$true; auth_user_id=$userId
            } | Out-Null
        } else {
            Invoke-LocalRest -Path "/rest/v1/workers?id=eq.$($workers[0].id)" -Method PATCH -Body @{facility_id=$FacilityId;is_active=$true} | Out-Null
        }
    }
    return [pscustomobject]@{label=$Label;email=$Email;id=$userId}
}

# Create isolated, synthetic facilities. No real government facility is asserted.
$facilities = @(
    @{id="f0000000-0000-4000-8000-000000000001";name="BUSHO Synthetic SHC E2E";district="Dhamtari";state="Chhattisgarh";state_lgd_code="22";district_lgd_code="377";block_lgd_code="3625";facility_type="aam_shc";verification_status="verified";is_synthetic=$true},
    @{id="f0000000-0000-4000-8000-000000000002";name="BUSHO Synthetic PHC E2E";district="Dhamtari";state="Chhattisgarh";state_lgd_code="22";district_lgd_code="377";block_lgd_code="3625";facility_type="phc";verification_status="verified";is_synthetic=$true},
    @{id="f0000000-0000-4000-8000-000000000003";name="BUSHO Synthetic Other PHC E2E";district="Dhamtari";state="Chhattisgarh";state_lgd_code="22";district_lgd_code="377";block_lgd_code="3625";facility_type="phc";verification_status="verified";is_synthetic=$true}
)
foreach ($facility in $facilities) {
    Invoke-LocalRest -Path "/rest/v1/facilities?on_conflict=id" -Method POST -Body $facility -ExtraHeaders @{Prefer="resolution=merge-duplicates,return=representation"} | Out-Null
}

$worker = Ensure-User -Label "stockout-worker" -Email "busho-stockout-worker-a204be7a@example.test" -Role "worker" -FacilityId $facilities[0].id
$supervisor = Ensure-User -Label "stockout-supervisor" -Email "busho-stockout-supervisor-a204be7a@example.test" -Role "supervisor" -FacilityId $facilities[1].id
$storekeeper = Ensure-User -Label "stockout-storekeeper" -Email "busho-stockout-storekeeper-a204be7a@example.test" -Role "storekeeper" -FacilityId $facilities[1].id
$otherStorekeeper = Ensure-User -Label "stockout-storekeeper-other" -Email "busho-stockout-storekeeper-other-a204be7a@example.test" -Role "storekeeper" -FacilityId $facilities[2].id

$linkQuery = "/rest/v1/facility_service_links?select=id&shc_facility_id=eq.$($facilities[0].id)&phc_facility_id=eq.$($facilities[1].id)&verification_status=eq.verified"
$links = Invoke-LocalRest -Path $linkQuery
$linkBody = @{
    shc_facility_id=$facilities[0].id; phc_facility_id=$facilities[1].id
    verification_status="verified"; source_authority="BUSHO local synthetic E2E fixture"
    source_reference="BUSHO-E2E-SHC-PHC-a204be7a"; verified_at=(Get-Date).ToUniversalTime().ToString("o")
    effective_from=(Get-Date).ToString("yyyy-MM-dd"); data_mode="synthetic_demo"
}
if (@($links).Count -eq 0) {
    Invoke-LocalRest -Path "/rest/v1/facility_service_links" -Method POST -Body $linkBody | Out-Null
} else {
    Invoke-LocalRest -Path "/rest/v1/facility_service_links?id=eq.$($links[0].id)" -Method PATCH -Body $linkBody | Out-Null
}

# Store only account labels/emails in the Git-ignored local credentials file.
$labels = @("stockout-worker","stockout-supervisor","stockout-storekeeper","stockout-storekeeper-other")
$emails = @($worker.email,$supervisor.email,$storekeeper.email,$otherStorekeeper.email)
$accounts = @($credentials.accounts | Where-Object { $_.label -notin $labels })
for ($i=0; $i -lt $labels.Count; $i++) {
    $accounts += [pscustomobject]@{label=$labels[$i];email=$emails[$i]}
}
$credentials.accounts = $accounts
$credentials | ConvertTo-Json -Depth 12 | Set-Content -Path $credentialPath -Encoding utf8

Write-Host "Synthetic SHC-to-PHC E2E fixtures are ready in local Supabase."
Write-Host "Accounts added: stockout-worker, stockout-supervisor, stockout-storekeeper, stockout-storekeeper-other."
Write-Host "Facilities created: 1 synthetic SHC, 2 synthetic PHCs; 1 verified synthetic link."
Write-Host "No credentials, tokens, hosted database or production data were printed or changed."
