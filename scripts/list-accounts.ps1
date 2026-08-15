<#
.SYNOPSIS
    Lists the accounts in the database, and optionally resets one password.

.DESCRIPTION
    Passwords are stored as BCrypt hashes and cannot be read back by anyone.
    This script shows you which accounts exist so you know what to sign in as,
    and can set a known password on one of them if you have lost it.

.EXAMPLE
    .\scripts\list-accounts.ps1
    Shows every account.

.EXAMPLE
    .\scripts\list-accounts.ps1 -ResetPassword student@example.com
    Sets that account's password to  password123

.EXAMPLE
    .\scripts\list-accounts.ps1 -ResetPassword student@example.com -Activate
    Also sets the account to ACTIVE.
#>
param(
    [string]$MysqlPath = "C:\xampp\mysql\bin\mysql.exe",
    [string]$Database  = "internshipjp_db",
    [string]$User      = "root",
    [string]$Password  = "",
    [string]$ResetPassword,
    [switch]$Activate
)

$ErrorActionPreference = "Stop"

# BCrypt hash of "password123", cost 10, $2a variant - the same format Spring
# Security's BCryptPasswordEncoder writes, so it verifies without any doubt.
$KNOWN_PLAIN = "password123"
$KNOWN_HASH  = '$2a$10$/8pE/69fZYUnePzMx4Lt8eNzHW7Xs9QVpX0v0MXDSfS2mE3yPxbbS'

if (-not (Test-Path $MysqlPath)) {
    Write-Error "mysql.exe not found at $MysqlPath. Pass -MysqlPath with the right location."
    exit 1
}

$baseArgs = @("-u", $User)
if ($Password -ne "") { $baseArgs += "-p$Password" }
$baseArgs += $Database

function Invoke-Sql([string]$sql) {
    $args = $baseArgs + @("-e", $sql)
    & $MysqlPath @args
    if ($LASTEXITCODE -ne 0) { throw "MySQL command failed." }
}

if ($ResetPassword) {
    $escaped = $ResetPassword.Replace("'", "''")
    $exists = & $MysqlPath @($baseArgs + @("-N", "-B", "-e",
        "SELECT COUNT(*) FROM users WHERE email = '$escaped';"))
    if ([int]$exists -eq 0) {
        Write-Host "No account with that email. Current accounts:" -ForegroundColor Yellow
        Invoke-Sql "SELECT id, email, role, account_status FROM users ORDER BY id;"
        exit 1
    }

    Invoke-Sql "UPDATE users SET password_hash = '$KNOWN_HASH', updated_at = NOW(6) WHERE email = '$escaped';"
    if ($Activate) {
        Invoke-Sql "UPDATE users SET account_status = 'ACTIVE' WHERE email = '$escaped';"
    }

    Write-Host ""
    Write-Host "Password reset." -ForegroundColor Green
    Write-Host "  Email    : $ResetPassword"
    Write-Host "  Password : $KNOWN_PLAIN"
    Write-Host ""
    Write-Host "Change it after signing in, from Account settings." -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "Accounts in $Database" -ForegroundColor Cyan
Invoke-Sql @"
SELECT id, email, full_name, role, account_status,
       DATE_FORMAT(created_at,'%Y-%m-%d %H:%i') AS created
FROM users ORDER BY id;
"@

Write-Host "Companies" -ForegroundColor Cyan
Invoke-Sql "SELECT id, name, approval_status FROM companies ORDER BY id;"

Write-Host ""
Write-Host "Passwords are BCrypt hashes and cannot be read back - not by you," -ForegroundColor DarkGray
Write-Host "not by an admin, not by anyone with the database. Reset one with:" -ForegroundColor DarkGray
Write-Host "  .\scripts\list-accounts.ps1 -ResetPassword <email>" -ForegroundColor DarkGray
