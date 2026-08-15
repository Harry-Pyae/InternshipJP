# ---------------------------------------------------------------------------
# InternshipJP - start both servers for development
#
# Usage, from the repository root:
#     .\scripts\start-dev.ps1
#
# Opens two PowerShell windows: the backend on :8080 and the frontend on :5173.
# Close a window (or press Ctrl+C in it) to stop that server.
#
# It does NOT start MariaDB - use the XAMPP Control Panel for that, because
# XAMPP manages the service itself.
# ---------------------------------------------------------------------------

$repoRoot = Split-Path -Parent $PSScriptRoot
$backend = Join-Path $repoRoot "backend"
$frontend = Join-Path $repoRoot "frontend"

if (-not (Test-Path (Join-Path $backend "pom.xml"))) {
    Write-Error "Could not find backend\pom.xml. Run this from inside the repository."
    exit 1
}

# A quick sanity check so the usual mistake gets a clear message rather than a
# stack trace 30 seconds later.
$mysql = "C:\xampp\mysql\bin\mysql.exe"
if (Test-Path $mysql) {
    $databases = & $mysql -u root -e "SHOW DATABASES;" 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "MariaDB does not seem to be running. Start MySQL in the XAMPP Control Panel first."
    } elseif ($databases -notmatch "internshipjp_db") {
        Write-Warning "The database internshipjp_db does not exist yet. See README section 2.2."
    } else {
        Write-Host "MariaDB is running and internshipjp_db exists." -ForegroundColor Green
    }
}

if (-not (Test-Path (Join-Path $frontend "node_modules"))) {
    Write-Host "Installing frontend dependencies (first run only)..." -ForegroundColor Yellow
    Push-Location $frontend
    npm install
    Pop-Location
}

Write-Host "Starting backend  -> http://localhost:8080" -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$backend'; .\mvnw.cmd spring-boot:run"

Write-Host "Starting frontend -> http://localhost:5173" -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$frontend'; npm run dev"

Write-Host ""
Write-Host "Two windows are starting. The backend takes a few seconds." -ForegroundColor Green
Write-Host "Then open http://localhost:5173/integration/status to check all three connections."
