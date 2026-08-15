<#
.SYNOPSIS
    Removes every row and file created by the demo data seeder.

.DESCRIPTION
    Deletes only rows carrying the demo markers - accounts whose email ends
    @demo.internshipjp.local, and companies whose name starts "Demo ". Real
    data is never matched.

    It also deletes the placeholder certificate files those rows pointed at,
    which the SQL alone cannot do.

    Shows what it will delete and asks for confirmation first.

.EXAMPLE
    .\scripts\remove-demo-data.ps1

.EXAMPLE
    .\scripts\remove-demo-data.ps1 -Force
    Skips the confirmation prompt.

.EXAMPLE
    .\scripts\remove-demo-data.ps1 -WhatIfOnly
    Shows the counts and exits without deleting anything.
#>
param(
    [string]$MysqlPath = "C:\xampp\mysql\bin\mysql.exe",
    [string]$Database  = "internshipjp_db",
    [string]$User      = "root",
    [string]$Password  = "",
    [switch]$Force,
    [switch]$WhatIfOnly
)

$ErrorActionPreference = "Stop"
$repoRoot   = Split-Path -Parent $PSScriptRoot
$uploadRoot = Join-Path $repoRoot "backend\uploads"

if (-not (Test-Path $MysqlPath)) {
    Write-Error "mysql.exe not found at $MysqlPath. Pass -MysqlPath with the right location."
    exit 1
}

# Build the argument list once. A blank password means "no -p flag at all",
# which is what a standard XAMPP install needs.
$baseArgs = @("-u", $User)
if ($Password -ne "") { $baseArgs += "-p$Password" }
$baseArgs += $Database

function Invoke-Sql([string]$sql, [switch]$Raw) {
    $args = $baseArgs + @("-e", $sql)
    if ($Raw) { $args = @("-N", "-B") + $args }
    & $MysqlPath @args
    if ($LASTEXITCODE -ne 0) { throw "MySQL command failed." }
}

Write-Host "Checking for demo data in $Database..." -ForegroundColor Cyan

$counts = Invoke-Sql @"
SELECT 'accounts', COUNT(*) FROM users WHERE email LIKE '%@demo.internshipjp.local'
UNION ALL SELECT 'companies', COUNT(*) FROM companies WHERE name LIKE 'Demo %';
"@ -Raw

$accountCount = [int](($counts | Select-Object -First 1) -split "`t")[1]
$companyCount = [int](($counts | Select-Object -Last 1) -split "`t")[1]

Write-Host "  Demo accounts : $accountCount"
Write-Host "  Demo companies: $companyCount"

if ($accountCount -eq 0 -and $companyCount -eq 0) {
    Write-Host "Nothing to remove. The database has no demo data." -ForegroundColor Green
    exit 0
}

# Collect the certificate file paths BEFORE the rows are deleted - afterwards
# there is no record of which files belonged to demo students.
$files = Invoke-Sql @"
SELECT c.storage_path FROM certificates c
JOIN student_profiles sp ON sp.id = c.student_profile_id
JOIN users u ON u.id = sp.user_id
WHERE u.email LIKE '%@demo.internshipjp.local';
"@ -Raw

$fileList = @($files | Where-Object { $_ -and $_.Trim() -ne "" })
Write-Host "  Uploaded files: $($fileList.Count)"

if ($WhatIfOnly) {
    Write-Host "`n-WhatIfOnly was set. Nothing was deleted." -ForegroundColor Yellow
    exit 0
}

if (-not $Force) {
    Write-Host ""
    Write-Host "This deletes the rows above and everything that cascades from them" -ForegroundColor Yellow
    Write-Host "(their applications, certificates and notifications, and the" -ForegroundColor Yellow
    Write-Host "internships belonging to demo companies). Real data is not touched." -ForegroundColor Yellow
    $answer = Read-Host "`nType 'yes' to continue"
    if ($answer -ne "yes") {
        Write-Host "Cancelled. Nothing was deleted."
        exit 0
    }
}

# Users first: employer_profiles.company_id is RESTRICT, so a company cannot
# be deleted while its recruiters still exist.
Invoke-Sql "DELETE FROM users WHERE email LIKE '%@demo.internshipjp.local';"
Invoke-Sql "DELETE FROM companies WHERE name LIKE 'Demo %';"

$removedFiles = 0
foreach ($relative in $fileList) {
    $target = Join-Path $uploadRoot $relative.Trim().Replace("/", "\")
    # Never delete outside the upload folder, whatever the database said.
    $resolvedRoot = [System.IO.Path]::GetFullPath($uploadRoot)
    $resolved     = [System.IO.Path]::GetFullPath($target)
    if ($resolved.StartsWith($resolvedRoot) -and (Test-Path $resolved)) {
        Remove-Item $resolved -Force
        $removedFiles++
    }
}

# Tidy up any now-empty student folders under certificates.
$certRoot = Join-Path $uploadRoot "certificates"
if (Test-Path $certRoot) {
    Get-ChildItem $certRoot -Directory |
        Where-Object { -not (Get-ChildItem $_.FullName -File -Recurse) } |
        Remove-Item -Recurse -Force
}

Write-Host ""
Write-Host "Removed $accountCount account(s), $companyCount company(ies) and $removedFiles file(s)." -ForegroundColor Green

$left = Invoke-Sql "SELECT COUNT(*) FROM users WHERE email LIKE '%@demo.internshipjp.local';" -Raw
Write-Host "Demo accounts remaining: $left"
Write-Host ""
Write-Host "Your own accounts are untouched:" -ForegroundColor Cyan
Invoke-Sql "SELECT role, account_status, COUNT(*) AS accounts FROM users GROUP BY role, account_status;"
